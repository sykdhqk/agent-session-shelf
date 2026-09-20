import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {Script} from 'node:vm';
import {buildPackages} from '../package.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
test('install archive is deterministic and contains exactly the declared runtime',()=>{
 execFileSync(process.execPath,['scripts/build.mjs'],{cwd:root});
 const tmp=mkdtempSync(path.join(tmpdir(),'shelf-test-'));
 try {
  const [a]=buildPackages(root,path.join(tmp,'a'));const [b]=buildPackages(root,path.join(tmp,'b'));
  assert.deepEqual(readFileSync(a),readFileSync(b));
  assert.deepEqual(execFileSync('unzip',['-Z1',a],{encoding:'utf8'}).trim().split('\n'),['ipollowork.plugin.json','ui/index.html']);
  assert.deepEqual(execFileSync('unzip',['-p',a,'ui/index.html']),readFileSync(path.join(root,'ui/index.html')));
 } finally {rmSync(tmp,{recursive:true,force:true});}
});
test('bundled script parses, uses no external assets, and contains exact topics',()=>{
 const html=readFileSync(path.join(root,'ui/index.html'),'utf8');
 const script=html.match(/<script>([\s\S]*)<\/script>/)[1];new Script(script);
 assert.doesNotMatch(html,/<(?:script|link)[^>]+(?:src|href)=/);
 assert.doesNotMatch(script,/\b(?:eval|fetch|localStorage)\s*\(/);
 const topics=JSON.parse(readFileSync(path.join(root,'topics.json')));assert.ok(topics.includes('ipollowork-plugin'));assert.ok(topics.includes('ipollowork'));assert.ok(!topics.includes('ipollo-plugin'));
});
test('filter controls are direct buttons so every category is reachable in the native panel',()=>{
 const template=readFileSync(path.join(root,'src/index.template.html'),'utf8');
 assert.match(template,/id="filter" role="group"/);
 assert.match(template,/createElement\('button'\)/);
 assert.doesNotMatch(template,/<select id="filter"/);
});
