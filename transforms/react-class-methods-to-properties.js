export default function transformer(file, api) {
    const j = api.jscodeshift;

    const getSuperName = ({ node }) => {
        return node.superClass && (node.superClass.name ||
            node.superClass.property && node.superClass.property.name);
    };

    const extendsComponent = p => {
        return getSuperName(p) === 'Component';
    };

    const isCustomMethod = methodName => {
        return ![
            'constructor',
            'getInitialState',
            'getDefaultProps',
            'componentWillMount',
            'componentDidMount',
            'componentWillReceiveProps',
            'shouldComponentUpdate',
            'componentWillUpdate',
            'componentDidUpdate',
            'componentWillUnmount'
        ].includes(methodName);
    };

    const methodToClassProp = ({ node }) => {
        node.type = 'ClassProperty';
        node.value.type = 'ArrowFunctionExpression';
    };

    const methodsToProperties = rootNode => {
        const convertedMethods = new Set();

        rootNode.find(j.ClassBody)
            .map(p => p.parent)
            .filter(extendsComponent)
            .find(j.MethodDefinition)
            .filter(p => isCustomMethod(p.node.key.name))
            .forEach(p => {
                methodToClassProp(p);
                convertedMethods.add(p.node.key.name);
            });

        return convertedMethods;
    };

    const removeBinds = (rootNode, methods) => {
        const collections = [
            rootNode.find(j.MethodDefinition),
            rootNode.find(j.ClassProperty)
        ];

        collections.forEach(collection => {
            collection
                .find(j.AssignmentExpression, {
                    left: {
                        property: {
                            name: prop => methods.has(prop)
                        }
                    },
                    right: {
                        callee: {
                            object: {
                                property: {
                                    name: prop => methods.has(prop)
                                }
                            },
                            property: {
                                name: 'bind'
                            }
                        }
                    }
                }).remove();
        });
    };

    const root = j(file.source);
    const convertedMethods = methodsToProperties(root);
    removeBinds(root, convertedMethods);

    return root.toSource();
};