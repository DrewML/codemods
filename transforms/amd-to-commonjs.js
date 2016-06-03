/*
    Edge-cases:
        1. Can't switch a `require` to an `import` when execution order is important
            Example:
                var getOldRef = window.foo;
                require('foo'); // module "foo" replaces the "window.foo" prop
           Since this is impossible to detect, just ignoring transforming to imports
           when a require() statement looks like it will produce side-effects
*/

const FN_EXPR_TYPES = ['FunctionExpression', 'ArrowFunctionExpression'];

export default function transformer(file, api) {
    if (
        /bower_components/.test(file.path) ||
        /node_modules/.test(file.path) ||
        /sf_planner/.test(file.path)
    ) return;

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
  
    function appendToTopOfFile(node) {
        const program = root.find(j.Program).paths()[0].node;
        program.body.unshift(node);
    }

    function transformOldStyleModule(p) {
        const [depArray, callback] = p.node.arguments;
        const depNames = depArray.elements.map(el => el.value);
        const depAliases = callback.params.map(param => param.name);
        const fnBody = callback.body;
        const moduleFn = createModuleFn(fnBody);
        const exportDecl = createExportDefaultDecl(
            j.callExpression(j.identifier('moduleFn'), [])
        );

        p.parent.insertAfter(exportDecl);
        p.parent.replace(moduleFn);

        depNames.forEach((depName, i) => {
            const importDecl = createImportDecl(depAliases[i], depName);
            appendToTopOfFile(importDecl);
        });
    }

    function transformNewStyleModule(p) {
        const requireCalls = j(p).find(j.CallExpression, {
            callee: { name: 'require' }
        });
        const [callback] = p.node.arguments;
        const fnBody = callback.body;
        const moduleFn = createModuleFn(fnBody);
        const exportDecl = createExportDefaultDecl(
            j.callExpression(j.identifier('moduleFn'), [])
        );
      
        p.parent.insertAfter(exportDecl);
        p.parent.replace(moduleFn);
      
        requireCalls.forEach(callExpr => {
            const parentNode = callExpr.parent.node;
          
            // ex: var a = require('a')
            if (parentNode.type === 'VariableDeclarator') {
                const importAlias = parentNode.id.name;
                const importName = callExpr.node.arguments[0].value;
                const importDecl = createImportDecl(importAlias, importName);
                appendToTopOfFile(importDecl);
                removePath(callExpr.parent);
            }
          
            // ex: require('a').b() or require('a')()
            if (parentNode.type === 'MemberExpression' || parentNode.type === 'CallExpression') {
                const importName = callExpr.node.arguments[0].value;
                const importAlias = `_${importName}`;
                const importDecl = createImportDecl(importAlias, importName);
                appendToTopOfFile(importDecl);
                callExpr.replace(j.identifier(importAlias));
            }
        });
    }

    root.find(j.CallExpression, {
        callee: { name: 'define' }
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
