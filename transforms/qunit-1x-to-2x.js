// QUnit 1.x >> 2.0 upgrade

export default function transformer(file, api) {
    if (!/_tests?.jsx?$/.test(file.path)) return;
    if (/bower_components/.test(file.path) || /node_modules/.test(file.path)) return;

    const j = api.jscodeshift;
    const root = j(file.source);

    function callIsInject(node) {
        const injectorVariants = 'inject inj injector injectResponse injectNoLinkCalls'.split(' ');
        return node && node.type === 'CallExpression' &&
            injectorVariants.includes(node.callee.name);
    }

    function callToMemberExpr(callExprPath, obj, prop) {
        callExprPath.replace(
            j.callExpression(
                j.memberExpression(j.identifier(obj), j.identifier(prop)),
                callExprPath.node.arguments
            )
        );
    }

    const tasks = {
        // asyncUpgrade() {
        //     const asyncTests = root.find(j.CallExpression, {
        //         callee: {
        //             name: 'asyncTest'
        //         }
        //     });

        //     asyncTests.forEach(p => callToMemberExpr(p, 'QUnit', 'test'));

        //     asyncTests.find(j.CallExpression, {
        //         callee: {
        //             name: 'start'
        //         }
        //     }).replaceWith(p => (
        //         j.callExpression(j.identifier('done'), p.node.arguments)
        //     ));

        //     asyncTests.forEach(p => {
        //         const args = p.node.arguments;
        //         let testFn = args[args.length - 1];
        //         if (callIsInject(testFn)) testFn = testFn.arguments[0];

        //         if (testFn.type !== 'FunctionExpression') {
        //             const loc = p.node.loc ? p.node.loc.start.line : '?';
        //             console.warn(
        //                 `Expected FunctionExpression on line ${loc} ` +
        //                 `in ${file.path}`
        //             );
        //             return;
        //         }

        //         testFn.body.body.unshift('var done = assert.async()');
        //         const hasAssert = testFn.params.some(param => param.name === 'assert');
        //         if (!hasAssert) testFn.params.push(j.identifier('assert'));
        //     });
        // },

        upgradeModules() {
            root.find(j.CallExpression, {
                callee: {
                    name: 'module'
                }
            }).forEach(p => callToMemberExpr(p, 'QUnit', 'module'));
        },

        upgradeTests() {
            const testCalls = root.find(j.CallExpression, {
                callee: {
                    name: 'test'
                }
            });

            testCalls.forEach(p => {
                const args = p.node.arguments;
                let testFn = args[args.length - 1];
                if (callIsInject(testFn)) {
                    testFn = testFn.arguments[testFn.arguments.length - 1];
                }

                if (!testFn) {
                    console.warn(
                        `Ignoring a CallExpression to a different fn named "test"` +
                        `in ${file.path}`
                    );
                    return;
                }

                if (testFn.type !== 'FunctionExpression') {
                    const loc = p.node.loc ? p.node.loc.start.line : '?';
                    console.warn(
                        `Expected FunctionExpression on line ${loc} ` +
                        `in ${file.path}, but instead found ${testFn.type}`
                    );
                    return;
                }

                const hasAssert = testFn.params.some(param => param.name === 'assert');
                if (!hasAssert) testFn.params.push(j.identifier('assert'));
            });

            testCalls.forEach(p => callToMemberExpr(p, 'QUnit', 'test'));
        },

        upgradeAssertions() {
            const assertions = [
                'deepEqual',
                'equal',
                'notDeepEqual',
                'notEqual',
                'notPropEqual',
                'notStrictEqual',
                'ok',
                'propEqual',
                'strictEqual',
                'throws'
            ];
            assertions.forEach(assertion => {
                root.find(j.CallExpression, {
                    callee: {
                        name: assertion
                    }
                }).forEach(p => callToMemberExpr(p, 'assert', assertion));
            });
        },

        upgradeExpect() {
            root.find(j.CallExpression, {
                callee: {
                    property: {
                        name: 'test'
                    },
                    object: {
                        name: 'QUnit'
                    }
                }
            }).forEach(p => {
                const args = p.node.arguments;
                if (args.length !== 3) return;

                const testFn = args[args.length - 1];
                if (testFn.type !== 'FunctionExpression') {
                    const loc = p.node.loc ? p.node.loc.start.line : '?';
                    console.warn(
                        `Skipped an "expect" update on line ${loc} ` +
                        `in ${file.path}`
                    );
                    return;
                }
                const expectVal = args.splice(1, 1)[0].rawValue;

                testFn.body.body.unshift(`assert.expect(${expectVal});`);
            });
        }
    };


    Object.keys(tasks).forEach(task => tasks[task]());

    return root.toSource();
};