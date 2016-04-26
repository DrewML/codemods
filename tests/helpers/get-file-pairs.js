import fs from 'fs';
import promisify from 'es6-promisify';

const readFile = promisify(fs.readFile);
const fixturePath = './fixtures';

export default function getFilePairs(fixtureName) {
    return Promise.all([
        readFile(`${fixturePath}/${fixtureName}/in.js`, {encoding: 'utf8'}),
        readFile(`${fixturePath}/${fixtureName}/out.js`, {encoding: 'utf8'}),
    ]);
}
