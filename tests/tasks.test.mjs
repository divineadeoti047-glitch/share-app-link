import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

const source=stripTypeScriptTypes(readFileSync(new URL('../netlify/functions/tasks.mts',import.meta.url),'utf8'))
  .replace(/^import .*;\n/gm,'').replace('export default async','const handler = async')+'\nhandler;';
function fixture(user){
  const rows=new Map();let touched=0;
  const db={
    select(){touched++;return{from(){return{where:async id=>rows.has(id)?[rows.get(id)]:[]}}}},
    insert(){touched++;return{values(row){return{onConflictDoUpdate:async()=>rows.set(row.userId,row)}}}},
    delete(){touched++;return{where:async id=>rows.delete(id)}}
  };
  const handler=vm.runInNewContext(source,{getUser:async()=>user.current,db,eq:(_col,id)=>id,accountWorkspaces:{userId:'user_id'},Response,Headers,URL,Buffer});
  const request=(method,body,origin='https://daystar.example')=>handler(new Request('https://daystar.example/.netlify/functions/tasks',{method,headers:{origin,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}));
  return {request,rows,touched:()=>touched};
}
const payload={tasks:[{id:'study',name:'Study',target:25}],records:{},settings:{name:'Friend'},journals:{today:'Reflection'}};
test('anonymous requests never access storage',async()=>{
  const f=fixture({current:null});for(const method of ['GET','PUT','DELETE'])assert.equal((await f.request(method)).status,401);
  assert.equal(f.touched(),0);
});
test('accounts cannot read, replace, or delete another account backup',async()=>{
  const user={current:{id:'first'}};const f=fixture(user);
  assert.equal((await f.request('PUT',{payload,userId:'second'})).status,200);
  user.current={id:'second'};
  assert.equal((await (await f.request('GET')).json()).payload,null);
  await f.request('PUT',{payload:{...payload,journals:{}}});await f.request('DELETE');
  user.current={id:'first'};
  assert.deepEqual((await (await f.request('GET')).json()).payload,payload);
});
test('cross-origin mutations and invalid backups are rejected',async()=>{
  const f=fixture({current:{id:'first'}});
  assert.equal((await f.request('PUT',{payload},'https://another.example')).status,403);
  assert.equal((await f.request('DELETE',undefined,'https://another.example')).status,403);
  assert.equal((await f.request('PUT',{payload:{tasks:[]}})).status,400);
  assert.equal((await f.request('POST',{payload})).status,405);
  assert.equal(f.rows.size,0);
});
