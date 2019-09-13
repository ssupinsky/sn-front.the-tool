const isResolved = ({ success }) => success;
const isRejected = ({ success }) => !success;
const onFulfilled = value => ({ value, success: true });
const onRejected = value => ({ value, success: false });

const settle = promise => promise.then(onFulfilled, onRejected);

const getResult = ({ onResolved }) => tasks => {
  if (onResolved && tasks.some(isResolved)) {
    onResolved(tasks.filter(isResolved));
  }
  return tasks.some(isRejected) ? Promise.reject(tasks) : tasks;
};

export const settleAll = (promises, options = {}) =>
  Promise.all(promises.map(settle)).then(getResult(options));
