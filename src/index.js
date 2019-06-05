import vorpal from 'vorpal';
import { commands } from './commands';
import { callWith } from './utils/funcs';
import { checkoutAndPull } from './utils/git';

checkoutAndPull('../sn-front.modals', 'dev/034');

// const TheTool = vorpal();
// commands.forEach(callWith(TheTool));
// TheTool.show();
