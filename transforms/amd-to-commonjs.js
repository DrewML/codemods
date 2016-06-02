const FN_EXPR_TYPES = ['FunctionExpression', 'ArrowFunctionExpression'];

export default function transformer(file, api) {
    if (/bower_components/.test(file.path) || /node_modules/.test(file.path)) return;

    const j = api.jscodeshift;
    const root = j(file.source);

    function createModuleFn(fnBody) {
        return j.functionDeclaration(
            j.identifier('moduleFn'), [],
            fnBody
        );
    }

    function createExportDefaultDecl(decl) {
        return j.exportDefaultDeclaration(
            decl
        );
    }

    function createImportDecl(name, source) {
        if (!name) {
            return j.importDeclaration([], j.literal(source));
        }

        return j.importDeclaration(
            [j.importDefaultSpecifier(j.identifier(name))],
            j.literal(source)
        );
    }

    function removePath(p) {
        j(p).remove();
    }

    function transformOldStyleModule(p) {
        const [depArray, callback] = p.node.arguments;
        const depNames = depArray.elements.map(el => el.value);
        const depAliases = callback.params.map(param => param.name);
        const fnBody = callback.body;
        const program = root.find(j.Program).paths()[0].node;
        const moduleFn = createModuleFn(fnBody);
        const exportDecl = createExportDefaultDecl(
            j.callExpression(j.identifier('moduleFn'), [])
        );

        p.parent.insertAfter(exportDecl);
        p.parent.replace(moduleFn);

        depNames.forEach((depName, i) => {
            const importDecl = createImportDecl(depAliases[i], depName);
            program.body.unshift(importDecl);
        });
    }

    function transformNewStyleModule(p) {

    }

    root.find(j.CallExpression, {
        callee: {
            name: 'define'
        }
    }).forEach(p => {
        const args = p.node.arguments;
        const firstArgType = args && args[0] && args[0].type;
        const firstArgIsFn = FN_EXPR_TYPES.includes(firstArgType);
        const firstArgIsArray = firstArgType === 'ArrayExpression';

        if (firstArgIsFn) {
            transformNewStyleModule(p);
            return;
        }

        if (firstArgIsArray) {
            transformOldStyleModule(p);
            return;
        }
    });

    return root.toSource();
};