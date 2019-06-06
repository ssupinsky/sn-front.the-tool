import { pickBy, omitBy } from 'lodash';
import path from 'path';
import { FOLDER_APP_PATH, SN_FRONT } from '../constants';
import { readJSONAsync } from '../utils/fs';
import { decorateAction as $a } from '../utils/vorpal';
import { checkoutAndPull } from '../utils/git';

const isGitDependency = value => value.startsWith('git@');
const parseBranch = value => {
  const match = value.match(/#(\S+)$/);
  return match && match[1];
};

const getDependencies = async () => {
  const packageInfo = await readJSONAsync(path.join(FOLDER_APP_PATH, 'package.json'));
  const snFrontDependencies = pickBy(
    packageInfo.devDependencies,
    (value, key) => key.startsWith(SN_FRONT),
  );

  const gitDependencies = pickBy(snFrontDependencies, isGitDependency);
  const otherDependencies = omitBy(snFrontDependencies, isGitDependency);

  return { gitDependencies, otherDependencies };
};

const prepareSubmoduleRepos = async () => {
  const { gitDependencies } = await getDependencies();
  return Promise.all(
    Object.entries(gitDependencies).map(([repoName, dependencyValue]) =>
      checkoutAndPull(`../${repoName}`, parseBranch(dependencyValue))
    )
  );
};

export const sync = app => app
  .command('sync')
  .action($a(async () => {
    await prepareSubmoduleRepos();
  }));
