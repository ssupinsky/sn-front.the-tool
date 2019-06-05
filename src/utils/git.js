import Git from 'nodegit';

const authenticationCallbacks = {
  certificateCheck: () => 1, // skip certificate check
  credentials: (url, userName) => Git.Cred.sshKeyFromAgent(userName),
  transferProgress: console.log,
};


export const getCurrentBranchShorthand = repo => (
  Promise.resolve(repo)
    .then(r => r.getCurrentBranch())
    .then(branch => branch.shorthand())
);

export const checkout = (repo, branch) => (
  Promise.resolve(repo)
    .then(r => r.checkoutBranch(branch))
    .then(() => (
      console.log('Checked out ', branch),
      repo
    ))
);

export const pull = async repo => {
  const r = await Promise.resolve(repo);
  const branch = await getCurrentBranchShorthand(repo);

  await r.fetchAll({ callbacks: authenticationCallbacks });
  return r.mergeBranches(branch, `origin/${branch}`);
};

export const checkoutAndPull = (pathToRepo, branch) => {
  checkout(Git.Repository.open(pathToRepo), branch).then(pull);
};
