function propertyisShorthand(prop) {
    return prop.shorthand === true;
}

// We only support transforming when the 
// mapStateToProps callback function body consists
// solely of a return statement whose argument is
// an object expression with all properties using shorthand syntax
function isSimpleObjReturn(body) {
    if (
        body.type !== 'BlockStatement' ||
        !body.body[0] ||
        body.body[0].type !== 'ReturnStatement' ||
        body.body[0].argument.type !== 'ObjectExpression'
    ) {
        return false;
    }

    return body.body[0].argument.properties.every(propertyisShorthand);
}

export default function transformer(file, api) {
    const j = api.jscodeshift;

    function buildPropList(selectorNames, argNames) {
        return selectorNames.map((selector, i) => {
            return j.property('init', j.identifier(argNames[i]), j.identifier(selector));
        });
    }

    const root = j(file.source);

    let selectorTransformed;
    let skippedSome;
    root.find(j.CallExpression, {
            callee: {
                name: 'createSelector'
            }
        })
        .forEach(path => {
            const { node } = path;
            const [selectors, mapStateToProps] = node.arguments;
            if (selectors.type !== 'ArrayExpression' || !isSimpleObjReturn(mapStateToProps.body)) {
                skippedSome = true;
                return;
            };

            const selectorNames = selectors.elements.map(selector => selector.name);
            const argNames = mapStateToProps.params.map(param => param.name);

            path.replace(j.callExpression(
                j.identifier('createStructuredSelector'), [j.objectExpression(buildPropList(selectorNames, argNames))]
            ));

            selectorTransformed = true;
        });

    if (!selectorTransformed) return root.toSource();

    root.find(j.ImportDeclaration, {
        source: {
            value: 'reselect'
        }
    }).find(j.ImportSpecifier, {
        imported: {
            name: 'createSelector'
        }
    }).forEach(p => {
        if (!skippedSome) {
            p.replace(j.importSpecifier(j.identifier('createStructuredSelector')));
        } else {
            p.insertAfter(j.importSpecifier(j.identifier('createStructuredSelector')));
        }
    });

    return root.toSource();
};