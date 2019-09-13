export const decorateAction = func => async function _decorateAction(args, callback) {
  this.log = this.log.bind(this);
  await func(args, this);
  callback();
};
