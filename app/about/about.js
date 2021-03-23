import { $, $$ } from '@sciter';
import { launch } from '@env';
import { cwd } from '@sys';

$('#sciter').on('click', () => {
  launch('https://sciter.com');
});

$('#mit').on('click', () => {
  launch(cwd() + '/license.txt');
});

$('#girkov-arpa').on('click', () => {
  launch('https://github.com/girkovarpa');
});

$('#lacy-morrow').on('click', () => {
  launch('https://github.com/lacymorrow');
});

$('button').on('click', () => Window.this.close());