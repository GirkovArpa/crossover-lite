import { $, $$ } from '@sciter';
import { launch } from '@env';
import { cwd } from '@sys';

$('#sciter').on('click', () => {
  launch('https://sciter.com');
});

$('#mit').on('click', () => {
  launch(cwd() + '/license.txt');
});

$('button').on('click', () => Window.this.close());