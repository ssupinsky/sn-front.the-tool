import vorpal from 'vorpal';
import { decorateAction } from './utils';

const TheTool = vorpal();


TheTool
  .command('say [words...]')
  .option('-b, --backwards')
  .option('-t, --twice')
  .action(decorateAction((args, { log }) => {
    let str = args.words.join(' ');
    str = (args.options.backwards) ?
      str.split('').reverse().join('') :
      str;
    log(str);
  }));

TheTool.show();
