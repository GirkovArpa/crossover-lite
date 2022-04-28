import { $, $$ } from '@sciter';
import * as sys from '@sys';
import * as Stream from "this://app/js/stream.js";
import { read_pipe } from 'this://app/js/read_pipe.js';
import { movableView } from 'this://app/js/moveable_view.js';
import { DropZone } from 'this://app/js/drop_zone.js';

const HOME = sys.cwd();
// $('#crosshair').style.backgroundImage = `url(${HOME}/crosshairs/logo/CrossOver Lite.png)`;

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

movableView('#drag');

spawn_ahk();

async function spawn_ahk() {
  const ahk = sys.spawn([sys.cwd() + '/ahk/hotkeys.exe'], { stdout: 'pipe', stdin: 'pipe' });
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

// centerWindow();
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


const setting =
{
  data: {
    glyph: "blind",
    size: 20,
    hue: 359,
    sat: 100,
    val: 50,
    alpha: 1,
    x: 700,
    y: 300,
    crosshair: `${HOME}/crosshairs/logo/CrossOver Lite.png`
  },
  load: function()
  {
    let saved = JSON.parse(Stream.readSync(`${HOME}/setting.json`) || "{}");
    this.data = { ...this.data, ...saved};

    $('.tools').value = this.data;
    $('.tools').postEvent(new Event("input", {bubbles: true}));

    const glyphs = { disc: '•', cross: '+', blind: '' };
    $('#center-glyph').textContent = glyphs[this.data.glyph];
    $('#crosshair').style.backgroundImage = `url(${this.data.crosshair})`;

    Window.this.move(this.data.x, this.data.y);
  },
  save: function()
  {
    document.timer(2000, () => this.write());
  },
  write: function()
  {
    this.data = { ...this.data, ...$('.tools').value };
    
    Stream.writeSync(`${HOME}/setting.json`, this.data);
  }
}

Window.this.on("move", () =>
{
  var [x, y] = Window.this.box("position", "border", "screen");
  setting.data.x = x;
  setting.data.y = y;

  setting.save();
});

document.on('click', 'li.selection', (_, { attributes: { path } }) => {
  $('#crosshair').style.backgroundImage = `url(${path})`;
  setting.data.crosshair = path;
  setting.save();
});

document.on('click', '[name=glyph]', (_, { id }) => {
  const glyphs = { disc: '•', cross: '+', blind: '' };
  $('#center-glyph').textContent = glyphs[id];
  setting.save();
});

document.on('input', '.tools', (_, { value: {hue, sat, val, alpha, size} }) => {
  $('#crosshair').style.opacity = alpha;
  $('#crosshair').style.backgroundSize = size + '%';

  $('#center-glyph').style.color = `hsl(${hue}, ${sat}%, ${val}%)`;
  $('#center-glyph').style.fontSize = size + 'pt';
  setting.save();
});

$('#hue').on('input', function () {
  $('#sat').style.background = `linear-gradient(to right, hsl(${this.value}, 0%, 50) 0%, hsl(${this.value}, 100%, 50) 100%)`;
  setting.save();
});

document.ready = () =>
{
  setting.load();
}