import Git from 'nodegit';

const authenticationCallbacks = {
  certificateCheck: function skipCertCheck() { return 1; },
  credentials: () => Git.Cred.sshKeyFromAgent('git'),
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
  debugger;
  const branch = await getCurrentBranchShorthand(repo);

  debugger;

  await r.fetchAll({ callbacks: authenticationCallbacks });
  return r.mergeBranches(branch, `origin/${branch}`);
};

export const checkoutAndPull = async (pathToRepo, branch) => {
  checkout(Git.Repository.open(pathToRepo), branch).then(pull);
};
