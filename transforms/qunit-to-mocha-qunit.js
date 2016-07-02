const assert = require('assert');

const assertionMap = {
    propEqual: 'deepEqual',
    raises: 'throws'
};

export default function transformer(file, api) {
    const j = api.jscodeshift;
    if (!file.path.includes('__TEST__')) return;
    const root = j(file.source);

    let qunitIdentifier;
  
    // Note: Transforms are order dependent
    const transforms = new Set([
        function removeImport() {
            const qunitImport = root.find(j.ImportDeclaration, {
                source: {
                    value: 'qunit'
                }
            });

            if (!qunitImport.size()) return;
            qunitIdentifier = qunitImport.get(0).node.specifiers[0].local.name;

            qunitImport.insertAfter(j.importDeclaration(
                [j.importSpecifier(j.identifier(' assert '))],
                j.literal('chai')
            ));

            qunitImport.remove();
        },

        function removeRequire() {
            const qunitRequire = root.find(j.CallExpression, {
                callee: {
                    name: 'require'
                },
                arguments: args => args[0].value === 'qunit'
            }).closest(j.VariableDeclaration);

            if (!qunitRequire.size()) return;
            qunitIdentifier = qunitRequire.get(0).node.declarations[0].id.name;

            qunitRequire.insertAfter(j.variableDeclaration(
                'const', [j.variableDeclarator(
                    j.identifier('assert'),
                    j.memberExpression(
                        j.callExpression(j.identifier('require'), [j.literal('chai')]),
                        j.identifier('assert')
                    )
                )]
            ));
            qunitRequire.remove();
        },

        function swapTestCallExpr() {
            root.find(j.MemberExpression, {
                object: {
                    name: qunitIdentifier
                },
                property: {
                    name: 'test'
                }
            }).replaceWith(j.identifier('test'));

            root.find(j.MemberExpression, {
                object: {
                    name: qunitIdentifier
                },
                property: {
                    name: 'skip'
                }
            }).replaceWith(j.memberExpression(
                j.identifier('test'),
                j.identifier('skip')
            ));
        },

        function removeAssertArg() {
            root.find(j.CallExpression, {
                callee: {
                    name: 'test'
                }
            }).forEach(p => {
                const testFn = p.node.arguments.slice(-1)[0];
                assert(testFn.params.length === 1, 'Expected only 1 param in test fn');
                testFn.params = [];
            });
        },

        function swapAssertions() {
            Object.keys(assertionMap).forEach(assertion => {
                const newAssertion = assertionMap[assertion];

                root.find(j.MemberExpression, {
                    object: {
                        name: 'assert'
                    },
                    property: {
                        name: assertion
                    }
                }).replaceWith(j.memberExpression(
                    j.identifier('assert'),
                    j.identifier(newAssertion)
                ));
            });
        },

        function fixAsync() {
            root.find(j.CallExpression, {
                callee: {
                    object: {
                        name: 'assert'
                    },
                    property: {
                        name: 'async'
                    }
                }
            }).forEach(p => {
                assert(
                    j.VariableDeclarator.check(p.parent.node),
                    'Expected async result to be assigned to var'
                );

                const doneFnIdentifier = p.parent.node.id.name;
                const wrappingFn = p.scope.path;
                wrappingFn.node.params = [j.identifier(doneFnIdentifier)];

                // Remove call + assignment of async
                j(p.parent).remove();
            });
        },

        function updateModuleAndLifecycle() {
            const moduleCall = root.find(j.MemberExpression, {
                object: {
                    name: qunitIdentifier
                },
                property: {
                    name: 'module'
                }
            });

            moduleCall.closest(j.CallExpression).forEach(p => {
                const { arguments: args } = p.node;
                if (args.length === 1) {
                    return j(p).replaceWith(j.callExpression(
                        j.identifier('suite'),
                        args
                    ));
                }

                const lifecycleObj = args.slice(-1)[0];
                assert(
                    j.ObjectExpression.check(lifecycleObj),
                    "Expected an object of lifecycle hooks"
                );

                const hooks = lifecycleObj.properties.map(prop => {
                    assert(j.FunctionExpression.check(prop.value), "Expected a fn expr");
                    return {
                        hookName: prop.key.name,
                        fnBody: prop.value.body.body
                    };
                });

                hooks.reverse().forEach(hook => {
                    j(p).closest(j.ExpressionStatement).insertAfter(
                        j.expressionStatement(
                            j.callExpression(j.identifier(hook.hookName), [
                                j.functionExpression(null, [], j.blockStatement(hook.fnBody))
                            ])
                        )
                    );
                });

                j(p).replaceWith(j.callExpression(
                    j.identifier('suite'), [args[0]]
                ));
            });
        }
    ]);

    for (const transform of transforms) transform();

    return root.toSource();
};