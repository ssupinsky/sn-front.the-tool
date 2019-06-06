import { isQuiet } from '../env';
import { noop } from '../utils/funcs';

export const log = isQuiet ? noop : console.log;
