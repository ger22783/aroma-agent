import fs from 'node:fs';
import ts from 'typescript';
import {englishCopy} from '../lib/accounts/locale';
let missing:string[]=[];
for(const name of ['AccountExperience','BrandHeader','AdminDashboard']){
 const file=`components/${name}.tsx`,text=fs.readFileSync(file,'utf8'),tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 function visit(n:ts.Node){if(ts.isCallExpression(n)&&n.expression.getText(tree)==='tx'&&n.arguments[0]&&ts.isStringLiteral(n.arguments[0])){const s=n.arguments[0].text;if(!englishCopy[s])missing.push(s);}ts.forEachChild(n,visit);}
 visit(tree);
}
if(missing.length){console.error('Missing translations:',[...new Set(missing)]);process.exitCode=1;}else console.log('All account and admin copy keys have English translations.');
