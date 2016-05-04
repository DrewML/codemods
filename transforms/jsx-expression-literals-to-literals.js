function isStringLiteral(value) {
    if (typeof value !== 'string') return false;

    const allowed = ['"', "'"];
    return allowed.indexOf(value.charAt(0)) > -1 &&
        allowed.indexOf(value.charAt(value.length - 1)) > -1
}


export default function transformer(file, api) {
    const j = api.jscodeshift;
    const {
        expression,
        statement,
        statements
    } = j.template;

    return j(file.source)
        .find(j.JSXExpressionContainer)
        .filter(path => {
            return path.node.expression &&
                path.node.expression.raw &&
                isStringLiteral(path.node.expression.raw);
        })
        .forEach(path => {
            const literalValue = path.node.expression.rawValue;
            const literal = j.literal(path.node.expression.rawValue);
            path.parentPath.node.value = literal;
        })
        .toSource();
}
