import { glob } from 'glob';
import * as fs from 'fs';
// import * as pixx from 'pixx'; // no
// import * as pixxy from 'pixx'; // no
// const pixx = 'default' in pixxy ? (pixxy.default as any) : pixxy;
// import pixx from 'pixx'; // no
// import { pixx } from 'pixx'; // no
// const pixx = require('pixx'); // no
// const pixx = require('pixx').default; // works
const { pixx } = require('pixx'); // works

export async function pixxFlow(globFiles: string[], ignore: { ignore: string[] }) {
  // place code for your default task here

  const files = await glob(globFiles, ignore);
  console.log(files);

  async function replaceAsync(str: string, regex: RegExp, isHTML: boolean) {
    const promises: Promise<string>[] = [];
    // do something with match
    async function asyncFn(match: string, args: string[]) {
      console.log('match', match);
      // JS code
      let commentMatch = '';
      let html = '';
      if (!isHTML) {
        // JSX
        const code = match.trim().slice(0, -1);
        const bracket = match.trim().slice(-1);
        commentMatch += `/* ${match.trim()} */${bracket}`;
        html += await eval(code);
      } else {
        // HTML page
        commentMatch += `<!-- ${match} -->`;
        html += await eval(match);
      }
      // // console.log(html);
      return `${commentMatch}\n${html.trim()}\n\n`;
      // return matchFix;
    }
    // Run first time with promises.
    str.replace(regex, (match, ...args) => {
      // do something with match, push into promises array. 'args' is an array.
      promises.push(asyncFn(match, args));
      return match;
    });
    const data = await Promise.all(promises);
    // run second time, returning resolved promises instead of first match.
    return str.replace(regex, () => data.shift() || ''); // always return something.
  }

  for (const file of files) {
    console.log(file);
    const textIn = fs.readFileSync(file, 'utf-8');
    const isHTML = /htm.?$/i.test(file);
    // console.log('isHTML', isHTML);
    const regExJSX = /(?<!\/\*\s*{\s*)pixx\s*\(.*?('|"|})\s*\);?\s*}/gis; // jsx/tsx.
    const regExHTML = /(?<!<!--\s*)pixx\s*\(.*?('|"|})\s*\);?/gis; // html
    const textOut = await replaceAsync(textIn, isHTML ? regExHTML : regExJSX, isHTML);
    console.log('textOut', textOut);

    fs.writeFileSync(`avoid-${file.replaceAll('\\', '')}`, textOut);
  }
}
export default pixxFlow;

pixxFlow(['test/**/*.html', 'test/**/*.jsx', 'test/**/*.tsx'], {
  ignore: ['node_modules/**', '**/avoid*'],
});
