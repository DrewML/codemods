/*
    TODO:
        - Handle beforeEach/afterEach (no equivalent in tape)

    Caveats:
        - Does not handle `assert.propEqual` from QUnit (no equivelant in Tape)
        - You must already be using `assert.expect` in *all* QUnit tests. If not, Tape tests will hang indefinitely
        - Will not transform helper functions used to make assertions
 */

const assert = require('assert');

const assertionMap = {
    ok: 'ok',
    expect: 'plan',
    equal: 'equal',
    deepEqual: 'deepEqual',
    notOk: 'notOk',
    notDeepEqual: 'notDeepEqual',
    throws: 'throws'
};

export default function transformer(file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);

    // Note: Transforms are order dependent
    const transforms = new Set([
        function swapImport() {
            root.find(j.ImportDeclaration, {
                source: {
                    value: 'qunit'
                }
            }).replaceWith(j.importDeclaration(
                [j.importDefaultSpecifier(j.identifier('test'))],
                j.literal('tape')
            ));
        },

        function swapRequire() {
            const requireCalls = root.find(j.CallExpression, {
                callee: {
                    name: 'require'
                }
            });

            requireCalls.closest(j.VariableDeclarator).forEach(p => (
                p.node.id = j.identifier('test')
            ));

            requireCalls.forEach(p => p.node.arguments[0].value = 'tape');
        },

        function swapTestCallExpr() {
            root.find(j.MemberExpression, {
                object: {
                    name: 'QUnit'
                },
                property: {
                    name: 'test'
                }
            }).replaceWith(j.identifier('test'));

            root.find(j.MemberExpression, {
                object: {
                    name: 'QUnit'
                },
                property: {
                    name: 'skip'
                }
            }).replaceWith(j.memberExpression(
                j.identifier('test'),
                j.identifier('skip')
            ));
        },

        function assertArgToT() {
            root.find(j.CallExpression, {
                callee: {
                    name: 'test'
                }
            }).forEach(p => {
                const testFn = p.node.arguments.slice(-1)[0];
                assert(testFn.params.length === 1, 'Expected only 1 param in test fn');
                testFn.params = [j.identifier('t')];
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
                    j.identifier('t'),
                    j.identifier(newAssertion)
                ));
            });
        },

        function removeAsync() {
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

                // Remove explicit call to done fn
                j(wrappingFn).find(j.CallExpression, {
                    callee: {
                        name: doneFnIdentifier
                    }
                }).remove();

                // Remove passing of done fn to another fn
                // Example: Passing done fn to .thenable
                j(wrappingFn).find(j.CallExpression, {
                    arguments: args => args.some(arg => arg.name === doneFnIdentifier)
                }).forEach(p => {
                    j(p).find(j.Identifier, {
                        name: doneFnIdentifier
                    }).remove();
                });

                // Remove call + assignment of async
                j(p.parent).remove();
            });
        },

        function removeModule() {
            root.find(j.MemberExpression, {
                object: {
                    name: 'QUnit'
                },
                property: {
                    name: 'module'
                }
            }).closest(j.CallExpression).remove();
        }
    ]);

    for (const transform of transforms) transform();

    return root.toSource();
};