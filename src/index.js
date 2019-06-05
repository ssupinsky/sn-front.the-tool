import vorpal from 'vorpal';
import { commands } from './commands';

const callWith = (...args) => func => func(...args);

const TheTool = vorpal();
commands.forEach(callWith(TheTool));
TheTool.show();
