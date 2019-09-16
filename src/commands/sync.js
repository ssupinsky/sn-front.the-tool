import { pickBy, fromPairs } from 'lodash';
import path from 'path';
// import childProcess from 'child_process';
import { FOLDER_APP_PATH, SN_FRONT } from '../constants';
import { readFileAsync, readJSONAsync, writeFileAsync } from '../utils/fs';
import { settleAll } from '../utils/promises/settle';
import { decorateAction as $a } from '../utils/vorpal';
import * as Git from '../utils/git';
// import { log } from '../utils/console';
import { getConfig } from './showConfig/getConfig';

const parseBranch = value => {
  const match = value.match(/#(\S+)$/);
  return match && match[1] ? match[1] : 'master';
};

const branchesForDependencies = async () => {
  const [
    { dependencies: { exclude } },
    packageInfo,
  ] = await Promise.all([
    getConfig(),
    readJSONAsync(path.join(FOLDER_APP_PATH, 'package.json'))
  ]);
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

  await settleAll(
    Object.entries(branchesMap).map(([depName, branch]) =>
      Git.definitelyCheckout(depName, `../${depName}`, branch)
    )
  );

  return branchesMap;
};

// eslint-disable-next-line prefer-const
let folderAppProcess = null;
//
// const startApp = args => new Promise(resolve => {
//   const child = childProcess.exec(
//     'npm run start',
//     {
//       cwd: FOLDER_APP_PATH,
//       env: {
//         ...process.env,
//         ...args,
//       },
//     },
//   );
//
//   child.stdout.pipe(process.stdout);
//   child.stderr.pipe(process.stderr);
//   child.on('exit', () => {
//     folderAppProcess = null;
//   });
//
//   folderAppProcess = child;
// });

const updateWebpackConfig = async dependencies => {
  const webpackConfigFile = `${FOLDER_APP_PATH}/webpack.config.js`;
  const configByLines = (await readFileAsync(webpackConfigFile))
    .toString()
    .split('\n');
  const exportLineIndex = configByLines.findIndex(x => x.includes('module.exports ='));

  const linkString = `require('sn-front-webpack-config/link')(config, {
  ${dependencies.map(x => `'${x}': '../${x},'`).join('\n  ')}
});
`;

  await writeFileAsync(
    webpackConfigFile,
    [
      ...configByLines.slice(0, exportLineIndex),
      linkString,
      ...configByLines.slice(exportLineIndex),
    ].join('\n'),
  );
};

export const sync = app => app
  .command('sync')
  .allowUnknownOptions()
  .action($a(async (/* args */) => {
    const dependencies = Object.keys(await prepareSubmoduleRepos());
    await updateWebpackConfig(dependencies);
    // await startApp(args);
  }))
  .cancel(() => {
    if (folderAppProcess) {
      folderAppProcess.kill('SIGINT');
    }
  });
