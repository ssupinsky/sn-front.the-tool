export const decorateAction = func => async function _decorateAction(args, callback) {
  await func(args, this);
  callback();
};
