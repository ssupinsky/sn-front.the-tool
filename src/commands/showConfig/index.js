import { getConfig } from './getConfig';
import { decorateAction as $a } from '../../utils/vorpal';

export const showConfig = app => app
  .command('show-config')
  .action($a(async (args, self) => {
    self.log(await getConfig());
  }));
