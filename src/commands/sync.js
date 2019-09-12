import { pickBy, fromPairs } from 'lodash';
import path from 'path';
import childProcess from 'child_process';
import { FOLDER_APP_PATH, SN_FRONT } from '../constants';
import { readJSONAsync } from '../utils/fs';
import { noop } from '../utils/funcs';
import { decorateAction as $a } from '../utils/vorpal';
import * as Git from '../utils/git';
import { log } from '../utils/console';

const parseBranch = value => {
  const match = value.match(/#(\S+)$/);
  return match && match[1] ? match[1] : 'master';
};

const branchesForDependencies = async () => {
  const packageInfo = await readJSONAsync(path.join(FOLDER_APP_PATH, 'package.json'));
  const snFrontDeps = pickBy(
    packageInfo.devDependencies,
    (depSource, depName) => depName.startsWith(SN_FRONT),
  );

  return fromPairs(
    Object.entries(snFrontDeps)
      .map(([depName, depSource]) => [depName, parseBranch(depSource)])
  );
};

const prepareSubmoduleRepos = async () => {
  const branchesMap = await branchesForDependencies();

  return Promise.all(
    Object.entries(branchesMap).map(([depName, branch]) =>
      Git.definitelyCheckout(depName, `../${depName}`, branch)
    )
  ).catch(noop);
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
