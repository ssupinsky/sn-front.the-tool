import { findConfig, mergeConfigs } from '../../utils/config';
import { CONFIG_DEFAULT } from '../../utils/config/default';

export const getConfig = async (...args) => (
  findConfig(...args).then(conf => mergeConfigs(CONFIG_DEFAULT, conf))
);
