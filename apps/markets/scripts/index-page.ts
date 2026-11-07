// dist/index.html: the deployed root, which sends a visitor to the Isoloop
// build (the toggle on each page links the other).
import { writeFileSync } from 'node:fs';

writeFileSync(
  'dist/index.html',
  '<!doctype html><meta charset="utf-8"><title>Markets</title>' +
    '<meta http-equiv="refresh" content="0; url=./isoloop/">' +
    '<a href="./isoloop/">Markets on Isoloop</a> · <a href="./native/">native</a> · ' +
    '<a href="./isoloop-preact/">Isoloop, Preact</a> · <a href="./native-preact/">native, Preact</a> · ' +
    '<a href="./mixed/">React and Preact</a>\n',
);
