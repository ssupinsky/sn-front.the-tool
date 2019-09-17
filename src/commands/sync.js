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
  const branchesMapAsEntries = Object.entries(branchesMap);

  try {
    await settleAll(
      branchesMapAsEntries.map(([depName, branch]) =>
        Git.definitelyCheckout(depName, `../${depName}`, branch)
      )
    );
  } catch (tasks) {
    tasks.forEach(({ value }, i) => {
      if (value instanceof Error) {
        console.log(`\nError at ${branchesMapAsEntries[i][0]}:`);
        console.error(value, '\n');
      }
    });
  }

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

const clearLink = configByLines => {
  const startIndex = configByLines.findIndex(
    x => x.includes('require(\'sn-front-webpack-config/link\')')
  );

  if (startIndex !== -1) {
    const endIndex = configByLines.findIndex((x, i) => i > startIndex && x.includes('})'));
    return clearLink([
      ...configByLines.slice(0, startIndex),
      ...configByLines.slice(endIndex + 1),
    ]);
  }

  return configByLines;
};

const updateWebpackConfig = async dependencies => {
  const webpackConfigFile = `${FOLDER_APP_PATH}/webpack.config.js`;
  const configByLines = (await readFileAsync(webpackConfigFile))
    .toString()
    .split('\n');
  const configByLinesNoLink = clearLink(configByLines);

  const exportLineIndex = configByLinesNoLink.findIndex(
    x => x.includes('module.exports =')
  );


  const linkString = `require('sn-front-webpack-config/link')(config, {
  ${dependencies.map(x => `'${x}': '../${x}',`).join('\n  ')}
});
`;

  console.log('Writing webpack.config.js...');
  await writeFileAsync(
    webpackConfigFile,
    [
      ...configByLinesNoLink.slice(0, exportLineIndex),
      linkString,
      ...configByLinesNoLink.slice(exportLineIndex),
    ]
      .join('\n')
      .replace(/\n{3,}/, '\n\n')
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
