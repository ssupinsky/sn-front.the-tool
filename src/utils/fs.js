import util from 'util';
import fs from 'fs';

export const writeFileAsync = util.promisify(fs.writeFile);
export const readFileAsync = util.promisify(fs.readFile);

export const readJSONAsync = url => (
  readFileAsync(url).then(buffer => JSON.parse(buffer.toString()))
);
