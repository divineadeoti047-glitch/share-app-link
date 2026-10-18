import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,existsSync,readdirSync } from 'node:fs';
import vm from 'node:vm';
const root=new URL('../public/',import.meta.url);
test('all inline workspace scripts parse',()=>{
  const html=readFileSync(new URL('app.html',root),'utf8');
  for(const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(script);
});
test('offline shell includes only existing local assets',()=>{
  const worker=readFileSync(new URL('service-worker.js',root),'utf8');
  const shell=worker.match(/const SHELL = (\[[^;]+\]);/)[1];
  for(const path of vm.runInNewContext(shell))assert.ok(existsSync(new URL(path.slice(1),root)),path);
});
test('vendored Identity modules resolve locally',()=>{
  for(const name of readdirSync(new URL('vendor/',root))){
    const file=new URL('vendor/'+name,root),source=readFileSync(file,'utf8');
    for(const [,path] of source.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+)["']/g))assert.ok(existsSync(new URL(path,file)),path);
    assert.ok(!source.includes('"/node/'));
  }
});
