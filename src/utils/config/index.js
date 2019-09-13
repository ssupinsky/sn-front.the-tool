/* globals __non_webpack_require__ */
import findUp from 'find-up';

const defaultFilename = 'the-tool.config.js';

export const findConfig = async ({
  findBy = defaultFilename,
} = {}) => {
  const configFileUrl = await findUp(findBy);
  return __non_webpack_require__(configFileUrl);
};

// TODO: merge properly
export const mergeConfigs = (conf1, conf2) => ({
  ...conf1 || {},
  ...conf2 || {},
});
