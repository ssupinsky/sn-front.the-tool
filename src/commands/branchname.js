import Git from 'nodegit';
import { FOLDER_APP_PATH } from '../constants';
import { getBranchShorthand } from '../utils/git';
import { decorateAction as $a } from '../utils/vorpal';

export const branchname = app => app
  .command('branchname')
  .action($a(async (args, self) => {
    const branch = await getBranchShorthand(Git.Repository.open(FOLDER_APP_PATH));

    self.log(branch);
  }));
