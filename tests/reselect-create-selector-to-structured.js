import test from 'ava';
import codemod from '../transforms/reselect-create-selector-to-structured';
import transform from './helpers/transform';
import getFilePairs from './helpers/get-file-pairs';

const testFixture = async (t, fixtureName) => {
    const [code, expected] = await getFilePairs(fixtureName);
    const result = transform({ code, codemod });
    t.is(result, expected);
};

test('rewrites to createStructuredSelector, and removes unneeded import', async t => {
    await testFixture(t, 'reselect-create-selector-unmixed');
});

test('rewrites to createStructuredSelector, and does not remove createSelector import', async t => {
    await testFixture(t, 'reselect-create-selector-mixed');
});
