import fs from 'fs';
import promisify from 'es6-promisify';

const readFile = promisify(fs.readFile);
const fixturePath = './fixtures';

export default function getFilePairs(before, after) {
    return Promise.all([
        readFile(`${fixturePath}/${before}.js`, {encoding: 'utf8'}),
        readFile(`${fixturePath}/${after}.js`, {encoding: 'utf8'}),
    ]);
}
