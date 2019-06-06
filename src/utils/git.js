import Git from 'nodegit';
import { log } from './console';

const authenticationCallbacks = {
  certificateCheck: () => 1, // skip certificate check
  credentials: (url, userName) => Git.Cred.sshKeyFromAgent(userName),
};


export const getCurrentBranchShorthand = repo => (
  Promise.resolve(repo)
    .then(r => r.getCurrentBranch())
    .then(branch => branch.shorthand())
);

export const checkout = async (repo, branch) => {
  const r = await Promise.resolve(repo);
  await r.checkoutBranch(branch);

  log(`Checked out branch ${branch} at ${r.path()}`);

  return r;
};

export const pull = async repo => {
  const r = await Promise.resolve(repo);
  const branch = await getCurrentBranchShorthand(repo);

  await r.fetchAll({ callbacks: authenticationCallbacks });
  await r.mergeBranches(branch, `origin/${branch}`);

  log(`Performed pull at ${r.path()}`);

  return r;
};

export const checkoutAndPull = (pathToRepo, branch) => (
  checkout(Git.Repository.open(pathToRepo), branch).then(pull)
);
