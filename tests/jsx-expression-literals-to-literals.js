import test from 'ava';
import codemod from '../transforms/jsx-expression-literals-to-literals';
import transform from './helpers/transform';
import getFilePairs from './helpers/get-file-pairs';

const testFixture = async (t, fixtureName) => {
    const [code, expected] = await getFilePairs(fixtureName);
    const result = transform({ code, codemod });
    t.is(result, expected);
};

test('Transforms string literals in JSX expressions with simple literals', async t => {
    await testFixture(t, 'jsx-braced-expressions');
});
