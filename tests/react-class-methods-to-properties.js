import test from 'ava';
import codemod from '../transforms/react-class-methods-to-properties';
import transform from './helpers/transform';
import getFilePairs from './helpers/get-file-pairs';

const testFixture = async (t, fixtureName) => {
    const [code, expected] = await getFilePairs(fixtureName);
    const result = transform({ code, codemod });
    t.is(result, expected);
};

test('Transforms methods of class declarations', async t => {
    await testFixture(t, 'component-class-with-method');
});

test('Transforms methods of class expressions', async t => {
    await testFixture(t, 'component-class-expr-with-method');
});

test('Does not modify non-React related classes', async t => {
    await testFixture(t, 'non-react-component');
});

test('Removes manually method binding', async t => {
    await testFixture(t, 'manually-bound-methods');
});

test('Does not touch react-specific methods', async t => {
    await testFixture(t, 'lifecycle-methods');
});
