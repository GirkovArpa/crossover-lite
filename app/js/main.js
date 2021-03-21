import { $, $$ } from '@sciter';
import * as sys from '@sys';
import * as env from '@env';
import * as Storage from "@storage";
import { read_pipe } from 'this://app/js/read_pipe.js';
import { moveableView } from 'this://app/js/moveable_view.js';
import { DropZone } from 'this://app/js/drop_zone.js';

const HOME = sys.cwd();
$('#crosshair').style.backgroundImage = `url(${HOME}/crosshairs/logo/CrossOver Lite.png)`;

function screenshot() {
  setTimeout(async () => {
    const image = new Graphics.Image(500, 500, document);
    console.log(image);
    const bytes = image.toBytes('png');
    console.log(bytes);
    const path = HOME + '/test.png';
    try {
      const file = await sys.fs.open(path, "w+", 0o666);
      await file.write(bytes);
    } catch (e) {
      Window.this.modal(<warning>Cannot open file {path} for writing.<br />{e}<br />Settings will not be saved.</warning>);
    }
  }, 3000);
}

DropZone({
  container: $('.wrapper'),
  accept: '*.*',
  ondrop: function (files) {
    let filename = null;
    if (Array.isArray(files)) {
      filename = files[0];
    } else {
      filename = files;
    }
    $('#crosshair').style.backgroundImage = `url(${filename})`;
  }
});

globalThis.CURSOR = { x: null, y: null };

moveableView('#drag');

spawn_ahk();

async function spawn_ahk() {
  const ahk = sys.spawn([sys.cwd() + '/ahk/hotkeys.exe'], { stdout: 'pipe', stdin: 'pipe' });
  // Example of writing to AHK's stdin:
  //ahk.stdin.write('Hello World!\r\n');
  for await (const line of read_pipe(ahk.stdout)) {
    console.log(`“${line}”`);
    handle_message(line);
  }
}

function handle_message(line) {
  const [_, title, body] = line.match(/\[(.+)\] ?(.+)?/);
  if (title === 'LOCK') {
    const lock = !!+body;
    if (lock) {
      if ($('.wrapper.hidden')) return;
      $('.wrapper').classList.add('hidden');
      $('.tools').classList.add('hidden');
      $('#gear').classList.remove('enabled');
    } else {
      if ($('.wrapper.hidden') === null) return;
      $('.wrapper').classList.remove('hidden');
    }
  } else if (title === 'CENTER') {
    centerWindow();
  } else if (title === 'MOVE') {
    const direction = body;
    let [x, y] = Window.this.box('xy', 'border', 'screen');
    if (direction === 'Up') y--;
    if (direction === 'Down') y++;
    if (direction === 'Left') x--;
    if (direction === 'Right') x++;
    Window.this.move(x, y);
  } else if (title === 'ABOUT') {
    Window.this.modal({
      url: 'about/about.html'
    });
  }
}

centerWindow();
setInterval(() => {
  Window.this.isTopmost = true;
});


$('#close').on('click', () => Window.this.close());
$('#gear').on('click', function () {
  this.classList.toggle('enabled');
  $('.tools').classList.toggle('hidden');
});

$('.container').on('dblclick', function () {
  centerWindow();
});

function centerWindow() {
  const CROSSHAIR_CSS_TOP = 89;
  const [_, w] = document.state.contentWidths();
  const h = document.state.contentHeight(w);
  const [sw, sh] = Window.this.screenBox('frame', 'dimension');
  Window.this.move((sw - w) / 2, (sh - h) / 2 + (CROSSHAIR_CSS_TOP), w, h, true);
}

$('#size').on('input', function () {
  $('#crosshair').style.backgroundSize = this.value + '%';
  $('#center-glyph').style.fontSize = this.value + 'pt';
});

$('#alpha').on('input', function () {
  $('#crosshair').style.opacity = this.value;
});

document.on('click', '#target', (_, target) => {
  const [, , , screenHeight] = Window.this.box('screen', 'dimension');
  const [sx, sy] = Window.this.box('position');
  const { offsetLeft, offsetTop } = target;
  $('menu').popupAt(offsetLeft - sx, offsetTop - sy, 7);
});

async function getFilenamesRecursive(path, files = []) {
  const results = sys.fs.$readdir(path);
  const folders = [];
  for (const { name, type } of results) {
    if (sys.fs.match(name, '.*') || sys.fs.match(name, '~*')) {
      continue;
    }
    if (type === 2) {
      folders.push(name);
    } else {
      files.push(`${path}/${name}`);
    }
  }
  for (const folder of folders) {
    await new Promise(setTimeout);
    await getFilenamesRecursive(`${path}/${folder}`, files);
  }
  return files;
}

async function buildTree() {
  const path = `${sys.cwd()}/crosshairs`;
  const files = await getFilenamesRecursive(path);
  const tree = files.reduce((tree, file) => {
    const regex = /([^\/]+)\/([^\/]+\.[pnggifjpg]+)/;
    const [, folder, filename] = file.match(regex);
    tree[folder] = tree[folder] || [];
    tree[folder].push(filename);
    return tree;
  }, {});
  delete tree.crosshairs;
  return tree;
}

async function buildMenu() {
  const tree = await buildTree();
  let debug = true;
  for (const [folder, files] of Object.entries(tree)) {
    const crosshairs = files.map((file) => {
      const path = HOME + `/crosshairs/${folder}/${file}`.replace(/\\/g, '/');
      const style = ' ';
      const [sansExt] = file.split('.');
      const sansSymbols = sansExt.replace(/[-_+]/g, ' ');
      const displayName = sansSymbols;
      const classes = [];
      const darkCrosshairs = [
        'Kenney',
        'Actual',
        'Dot Outlined'
      ]
      const colorScheme = darkCrosshairs.includes(folder) ? 'light' : 'dark';
      classes.push(colorScheme);
      const smallCrosshairs = [
        'Animated',
        'Chevron',
        'Crossdot Broken',
        'Crossdot Simple',
        'Crosshair Broken',
        'Crosshair Simple',
        'Dot Outlined',
        'Dot Simple',
        'X-Hair Broken',
        'X-Hair Simple',
        'I-Dot Broken',
        'T-Dot Broken',
        'T-Hair Broken'
      ];
      const zoom = smallCrosshairs.includes(folder) ? 'zoom' : '';
      classes.push(zoom);
      classes.push('selection');
      return <li path={path} class={classes.join(' ')} style={style}>{displayName}</li>;
    });
    $('menu').append(<li>{folder}<menu>{crosshairs}</menu></li>);

    $$('menu:not(.popup) > li').forEach((li) => {
      li.style.foregroundImage = 'url(' + li.attributes.path + ')';
    });
  }
}

buildMenu();

document.on('click', 'li.selection', (_, { attributes: { path } }) => {
  $('#crosshair').style.backgroundImage = `url(${path})`;
});

document.on('click', '[name=glyph]', (_, { id }) => {
  const glyphs = { disc: '•', cross: '+', blind: '' };
  $('#center-glyph').textContent = glyphs[id];
});

document.on('input', '#alpha, #hue, #sat, #val', (_, { id, value }) => {
  const hue = $('#hue').value;
  const sat = $('#sat').value;
  const val = $('#val').value;
  const alpha = $('#alpha').value;
  $('#center-glyph').style.color = `hsl(${hue}, ${sat}%, ${val}%)`;
});

$('#hue').on('input', function () {
  $('#sat').style.background = `linear-gradient(to right, hsl(${this.value}, 0%, 50) 0%, hsl(${this.value}, 100%, 50) 100%)`;
});