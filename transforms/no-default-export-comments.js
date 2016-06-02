export default function transformer(file, api) {
  const RULE = 'spredfast/no-default-export';
  const j = api.jscodeshift;
  const root = j(file.source);
  
  const hasDefaultExport = root.find(j.ExportDefaultDeclaration).__paths.length;
  if (!hasDefaultExport) { return; }
  root.find(j.Program).forEach(p => {
    const comments = p.node.comments = p.node.comments || [];
    comments.unshift(
        j.commentBlock(' eslint-disable spredfast/no-default-export ')
    );
  });
  
  return root.toSource();
};
