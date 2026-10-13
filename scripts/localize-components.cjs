const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
for(const name of ['AccountExperience','BrandHeader','AdminDashboard']){
 const file=path.join(__dirname,'..','components',name+'.tsx'),source=fs.readFileSync(file,'utf8');
 const tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
 function insideTranslatedFunction(node){for(let p=node.parent;p;p=p.parent)if(ts.isFunctionDeclaration(p))return ['Questionnaire','AccountExperience','BrandHeader','AdminDashboard'].includes(p.name?.text);return false;}
 function visit(node){
  if(ts.isJsxText(node)&&/[\u3400-\u9fff]/u.test(node.text)){
   const value=node.text.replace(/\s+/g,' ').trim();edits.push({start:node.getFullStart(),end:node.end,text:'{tx('+JSON.stringify(value)+')}' });
  } else if(ts.isStringLiteral(node)&&/[\u3400-\u9fff]/u.test(node.text)&&insideTranslatedFunction(node)&&!(ts.isCallExpression(node.parent)&&node.parent.expression.getText(tree)==='tx')){
   const text='tx('+JSON.stringify(node.text)+')';
   edits.push({start:node.getStart(tree),end:node.end,text:ts.isJsxAttribute(node.parent)?'{'+text+'}':text});
  }
  ts.forEachChild(node,visit);
 }
 visit(tree);let result=source;for(const edit of edits.sort((a,b)=>b.start-a.start))result=result.slice(0,edit.start)+edit.text+result.slice(edit.end);
 fs.writeFileSync(file,result);console.log(name+': '+edits.length+' labels localized');
}
