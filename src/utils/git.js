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

const clone = (repoName, pathToRepo) => (
  log(`Cloning ${repoName} to ${pathToRepo}...`),
  NodeGit.Clone(
    `git@github.com:SignNowInc/${repoName}.git`,
    pathToRepo,
    { fetchOpts: { callbacks: authenticationCallbacks } },
  )
);

const openOrClone = async (repoName, pathToRepo) => (
  fs.existsSync(pathToRepo)
    ? NodeGit.Repository.open(pathToRepo)
    : clone(repoName, pathToRepo)
);

export const definitelyCheckout = async (repoName, pathToRepo, branch) => {
  const r = await openOrClone(repoName, pathToRepo);
  return r;

  return pull(r)
    .then(() => checkout(r, branch))
    .then(pull);
};
