import jscodeshift from 'jscodeshift';

export default function transform({ code, codemod }) {
    return codemod({
        source: code
    }, { jscodeshift });
}
