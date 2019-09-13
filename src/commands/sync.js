import { pickBy, fromPairs } from 'lodash';
import path from 'path';
import childProcess from 'child_process';
import { FOLDER_APP_PATH, SN_FRONT } from '../constants';
import { readJSONAsync } from '../utils/fs';
import { settleAll } from '../utils/promises/settle';
import { decorateAction as $a } from '../utils/vorpal';
import * as Git from '../utils/git';
import { log } from '../utils/console';
import { getConfig } from './showConfig/getConfig';

const parseBranch = value => {
  const match = value.match(/#(\S+)$/);
  return match && match[1] ? match[1] : 'master';
};

const branchesForDependencies = async () => {
  const { dependencies: { exclude } } = await getConfig();
  const packageInfo = await readJSONAsync(path.join(FOLDER_APP_PATH, 'package.json'));
  const snFrontDeps = pickBy(
    packageInfo.devDependencies,
    (depSource, depName) => !exclude.includes(depName) && depName.startsWith(SN_FRONT),
  );

  return fromPairs(
    Object.entries(snFrontDeps)
      .map(([depName, depSource]) => [depName, parseBranch(depSource)])
  );
};

const prepareSubmoduleRepos = async () => {
  const branchesMap = await branchesForDependencies();

  return settleAll(
    Object.entries(branchesMap).map(([depName, branch]) =>
      Git.definitelyCheckout(depName, `../${depName}`, branch)
    )
  );
};

let folderAppProcess = null;

const startApp = args => new Promise(resolve => {
  const child = childProcess.exec(
    'npm run start',
    {
      cwd: FOLDER_APP_PATH,
      env: {
        ...process.env,
        ...args,
      },
    },
  );

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  child.on('exit', () => {
    folderAppProcess = null;
  });

  folderAppProcess = child;
});

export const sync = app => app
  .command('sync')
  .allowUnknownOptions()
  .action($a(async args => {
    await prepareSubmoduleRepos();
    log('\nPrepared submodule directories\n');
    // await startApp(args);
  }))
  .cancel(() => {
    if (folderAppProcess) {
      folderAppProcess.kill('SIGINT');
    }
  });
