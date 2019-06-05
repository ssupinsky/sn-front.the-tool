import vorpal from 'vorpal';
import { commands } from './commands';
import { callWith } from './utils/funcs';


const TheTool = vorpal();
commands.forEach(callWith(TheTool));
TheTool.show();
