import test from 'ava';
import codemod from '../transforms/react-class-methods-to-properties';
import transform from './helpers/transform';
import getFilePairs from './helpers/get-file-pairs';

test('Transforms methods of class declarations', async t => {
    const [before, after] = await getFilePairs(
        'component-class-with-method',
        'component-class-with-property'
    );

    t.is(transform({
        code: before,
        codemod
    }), after);
});

test('Transforms methods of class expressions', async t => {
    const [before, after] = await getFilePairs(
        'component-class-expr-with-method',
        'component-class-expr-with-property'
    );

    t.is(transform({
        code: before,
        codemod
    }), after);
});
