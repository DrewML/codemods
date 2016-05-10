import test from 'ava';
import codemod from '../transforms/reselect-create-selector-to-structured';
import transform from './helpers/transform';
import getFilePairs from './helpers/get-file-pairs';

const testFixture = async (t, fixtureName) => {
    const [code, expected] = await getFilePairs(fixtureName);
    const result = transform({ code, codemod });
    t.is(result, expected);
};

test('Rewrites simple calls to createSelector to use createStructuredSelector', async t => {
    await testFixture(t, 'reselect-create-selector');
});
