export default function transformer(file, api) {
    if (!file.path.includes('__TEST__')) return;

    const j = api.jscodeshift;
    const root = j(file.source);

    const suiteCall = root.find(j.CallExpression, {
        callee: {
            name: 'suite'
        }
    });
    const suiteName = suiteCall.get(0).node.arguments[0].value;

    const testCalls = root.find(j.CallExpression, {
        callee: {
            name: 'test'
        }
    }).map(p => {
        p.node.callee.name = 'it';
        return p.parent;
    });

    const beforeEach = root.find(j.CallExpression, {
        callee: {
            name: 'beforeEach'
        }
    }).map(p => p.parent);

    const afterEach = root.find(j.CallExpression, {
        callee: {
            name: 'afterEach'
        }
    }).map(p => p.parent);


    const describeCall = j.expressionStatement(
        j.callExpression(
            j.identifier('describe'), [
                j.literal(suiteName),
                j.functionExpression(null, [], j.blockStatement([
                    ...beforeEach.nodes(),
                    ...afterEach.nodes(),
                    ...testCalls.nodes()
                ]))
            ]
        )
    );

    testCalls.get().insertBefore(describeCall);
    testCalls.remove();
    suiteCall.remove();
    beforeEach.remove();
    afterEach.remove();

    return root.toSource({ useTabs: true });
};
