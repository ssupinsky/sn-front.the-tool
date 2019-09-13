import fs from 'fs';
import NodeGit from 'nodegit';
import { log } from './console';

const authenticationCallbacks = {
  certificateCheck: () => 1, // skip certificate check
  credentials: (url, userName) => NodeGit.Cred.sshKeyFromAgent(userName),
};


export const getCurrentBranchShorthand = repo => (
  Promise.resolve(repo)
    .then(r => r.getCurrentBranch())
    .then(branch => branch.shorthand())
);

export const checkout = async (repo, branch) => {
  const r = await repo;
  await r.checkoutBranch(branch);

  log(`Checked out branch ${branch} at ${r.path()}`);

  return r;
};

export const pull = async repo => {
  const r = await repo;
  const branch = await getCurrentBranchShorthand(repo);

  await r.fetchAll({ callbacks: authenticationCallbacks });
  await r.mergeBranches(branch, `origin/${branch}`);

  log(`Performed pull at ${r.path()}`);

  return r;
};

const checkoutAndPull = (repo, branch) => (
  pull(repo)
    .then(() => checkout(repo, branch))
    .then(pull)
);

const clone = (repoName, pathToRepo) => (
  log(`Cloning ${repoName} to ${pathToRepo}...`),
  NodeGit.Clone(
    `git@github.com:SignNowInc/${repoName}.git`,
    pathToRepo,
    { fetchOpts: { callbacks: authenticationCallbacks } },
  )
    .then(() => log(`Succesfully cloned ${repoName} to ${pathToRepo}`))
    .catch(error => log(`Failed cloning ${repoName} to ${pathToRepo}:\n`, error))
);

const openWithClone = async (repoName, pathToRepo) => {
  await (!fs.existsSync(pathToRepo) && clone(repoName, pathToRepo));
  return NodeGit.Repository.open(pathToRepo);
};

export const definitelyCheckout = (repoName, pathToRepo, branch) => (
  openWithClone(repoName, pathToRepo)
    .then(r => checkoutAndPull(r, branch))
);
