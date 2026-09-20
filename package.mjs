import { readFileSync, mkdirSync, mkdtempSync, readdirSync, lstatSync, copyFileSync, chmodSync, utimesSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const modulePath = fileURLToPath(import.meta.url);
const epoch = new Date('2000-01-01T00:00:00Z');

function filesUnder(root, relative) {
  const p = path.join(root, relative);
  const stat = lstatSync(p);
  if (stat.isSymbolicLink()) throw new Error(`Refusing symbolic link: ${relative}`);
  if (stat.isFile()) return [relative];
  if (!stat.isDirectory()) throw new Error(`Not a regular file or directory: ${relative}`);
  return readdirSync(p).sort().flatMap(name => filesUnder(root,`${relative}/${name}`));
}

export function buildPackages(root, out) {
  root = path.resolve(root);
  out = path.resolve(out);
  const manifest = JSON.parse(readFileSync(path.join(root,'ipollowork.plugin.json')));
  if (manifest.id !== 'agent-session-shelf' || !/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(manifest.package.version)) throw new Error('Unexpected package identity/version');
  const files = ['ipollowork.plugin.json',...filesUnder(root,'ui')];
  if(files.length > 512) throw new Error('Too many files');
  let total = 0;
  for(const f of files) {
    if(f.split('/').includes('..') || path.isAbsolute(f)) throw new Error('Invalid archive path');
    const s=lstatSync(path.join(root,f));
    if(!s.isFile() || s.isSymbolicLink()) throw new Error(`Refusing symbolic link or special file: ${f}`);
    total+=s.size;
  }
  if(total>10*1024*1024) throw new Error('Expanded package exceeds 10 MiB');
  const stage = mkdtempSync(path.join(tmpdir(),'session-shelf-package-'));
  mkdirSync(out,{recursive:true});
  try {
    for(const file of files) {
      const dest=path.join(stage,file);
      mkdirSync(path.dirname(dest),{recursive:true});
      copyFileSync(path.join(root,file),dest);
      chmodSync(dest,0o644);
      utimesSync(dest,epoch,epoch);
    }
    const stem=`${manifest.id}-${manifest.package.version}`;
    const install=path.join(out,`${stem}.ipollowork-plugin`);
    for(const dest of [install]) rmSync(dest,{force:true});
    const options={cwd:stage,env:{...process.env,TZ:'UTC'}};
    execFileSync('zip',['-X','-q',install,...files],options);
    if(lstatSync(install).size>12*1024*1024) throw new Error('Archive exceeds 12 MiB');
    return [install];
  } finally {rmSync(stage,{recursive:true,force:true});}
}

if(process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  const root=path.dirname(modulePath);
  for(const output of buildPackages(root,path.join(root,'dist'))) console.log(output);
}
