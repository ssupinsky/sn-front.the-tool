import Git from 'nodegit';


export const getBranchShorthand = repo => (
  Promise.resolve(repo)
    .then(r => r.getCurrentBranch())
    .then(branch => branch.shorthand())
);

export const checkout = (repo, branch) => (
  Promise.resolve(repo)
    .then(r => r.checkoutBranch(branch))
    .then(() => repo)
);

export const pull = repo => (
  repo
    .fetchAll({ credentials: (url, userName) => Git.Cred.sshKeyFromAgent(userName) })
    .then(() => repo.mergeBranches('master', 'origin/master'))
    .then(() => repo)
);

export const checkoutAndPull = async (pathToRepo, branch) => {
  checkout(Git.Repository.open(pathToRepo), branch).then(pull);
};
