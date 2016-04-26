import test from 'ava';
import codemod from '../transforms/react-class-methods-to-properties';
import transform from './helpers/transform';
import getFilePairs from './helpers/get-file-pairs';

test('Transforms methods of class declarations', async t => {
    const [code, expected] = await getFilePairs('component-class-with-method');
    const result = transform({ code, codemod });

    t.is(result, expected);
});

test('Transforms methods of class expressions', async t => {
    const [code, expected] = await getFilePairs('component-class-expr-with-method');
    const result = transform({ code, codemod });

    t.is(result, expected);
});

test('Does not modify non-React related classes', async t => {
    const [code, expected] = await getFilePairs('non-react-component');
    const result = transform({ code, codemod });

    t.is(result, expected);
});

test('Removes manually method binding', async t => {
    const [code, expected] = await getFilePairs('manually-bound-methods');
    const result = transform({ code, codemod });

    t.is(result, expected);
});

test('Does not touch react-specific methods', async t => {
    const [code, expected] = await getFilePairs('lifecycle-methods');
    const result = transform({ code, codemod });

    t.is(result, expected);
});
