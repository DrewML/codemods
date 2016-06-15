export default function transformer(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);

    function fileHasQUnit() {
        return root.find(j.ImportDeclaration, {
            source: {
                value: 'qunit'
            }
        }).__paths.length > 0;
    }

    if (!fileHasQUnit()) return;

    root.find(j.MemberExpression, {
        object: {
            name: 'QUnit'
        },
        property: {
            name: 'test'
        }
    }).forEach(p => {
        const { arguments: args } = p.parent.node;
        const testFn = args.slice(-1)[0];

        if (j.ArrowFunctionExpression.check(testFn)) {
            testFn.type = 'FunctionExpression';
        }
    });

    return root.toSource();
};
