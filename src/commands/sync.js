import { pickBy, omitBy } from 'lodash';
import path from 'path';
import { FOLDER_APP_PATH, SN_FRONT } from '../constants';
import { readJSONAsync } from '../utils/fs';
import { decorateAction as $a } from '../utils/vorpal';

const isGitDependency = value => value.startsWith('git@');
const parseBranch = value => value.match(/#(\S+)$/)[1];

const getDependencies = async () => {
  const packageInfo = await readJSONAsync(path.join(FOLDER_APP_PATH, 'package.json'));
  const snFrontDependencies = pickBy(
    {
      ...packageInfo.dependencies,
      ...packageInfo.devDependencies,
    },
    (value, key) => key.startsWith(SN_FRONT),
  );

  const gitDependencies = pickBy(snFrontDependencies, isGitDependency);
  const otherDependencies = omitBy(snFrontDependencies, isGitDependency);

  return { gitDependencies, otherDependencies };
};

export const sync = app => app
  .command('sync')
  .action($a(async (args, self) => {
    const { gitDependencies } = getDependencies();

    Object.values(gitDependencies).forEach(([repoName, dependencyValue]) => {
      const branch = parseBranch(dependencyValue);
    });
  }));
