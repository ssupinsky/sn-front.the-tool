import Git from 'nodegit';
import { FOLDER_APP_PATH } from '../constants';
import { getCurrentBranchShorthand } from '../utils/git';
import { decorateAction as $a } from '../utils/vorpal';

export const branchname = app => app
  .command('branchname')
  .action($a(async (args, self) => {
    const branch = await getCurrentBranchShorthand(Git.Repository.open(FOLDER_APP_PATH));

    self.log(branch);
  }));
