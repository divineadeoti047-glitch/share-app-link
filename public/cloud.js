import { login, signup, logout, getUser, handleAuthCallback, requestPasswordRecovery, updateUser, acceptInvite, onAuthChange } from './vendor/identity.mjs';

const $=id=>document.getElementById(id);
let busy=false, inviteToken=null, resetting=false;
function status(message){$('cloud-status').textContent=message;}
async function refresh(){
  const user=await getUser();
  $('cloud-badge').textContent=user?'Signed in':'Device only';
  $('cloud-auth').classList.toggle('hidden',!!user||resetting);
  $('cloud-actions').classList.toggle('hidden',!user||resetting);
  $('cloud-account').textContent=user?`Signed in as ${user.email}.` : '';
  return user;
}
async function run(action){
  if(busy)return;
  busy=true;
  const controls=[...document.querySelectorAll('#cloud-auth button, #cloud-actions button, #cloud-reset button')];
  controls.forEach(el=>el.disabled=true);
  try{await action();}
  catch(error){status(error.message==='offline'?'You are offline. Your device records remain available.':error.message==='unauthorized'?'Sign in again to access your private cloud backup.':error.message==='storage'?'Could not save on this device. Export a backup and check browser storage.':error.message==='empty'?'No cloud backup exists yet. Save a device copy first.':error.message==='invalid'?'This cloud copy is not a valid DAYSTAR workspace. Your device copy is unchanged.':error.message==='changed'?'The signed-in account changed. Try again.':'This action could not be completed. Check your connection and credentials, confirm your email if needed, and try again. Your device records are unchanged.');}
  finally{busy=false;controls.forEach(el=>el.disabled=false);await refresh();}
}
async function request(method,payload){
  if(!navigator.onLine)throw Error('offline');
  const user=await getUser();
  if(!user)throw Error('unauthorized');
  const response=await fetch('/.netlify/functions/tasks',{
    method,cache:'no-store',credentials:'same-origin',
    headers:payload?{'Content-Type':'application/json'}:{},
    body:payload?JSON.stringify({payload}):undefined,
  });
  if(response.status===401)throw Error('unauthorized');
  if(!response.ok)throw Error('request');
  const result=await response.json();
  if((await getUser())?.id!==user.id)throw Error('changed');
  return result;
}
$('cloud-auth').addEventListener('submit',event=>{
  event.preventDefault();
  const create=event.submitter?.value==='signup';
  run(async()=>{
    if(!navigator.onLine)throw Error('offline');
    const email=$('cloud-email').value.trim(), password=$('cloud-password').value;
    if(create){await signup(email,password);status('Account created. Check your email to confirm it before signing in.');}
    else{await login(email,password);status('Signed in. Choose Save or Restore below. No records were uploaded or replaced.');}
    $('cloud-password').value='';
  });
});
$('cloud-forgot').addEventListener('click',()=>run(async()=>{
  if(!$('cloud-email').reportValidity())return;
  await requestPasswordRecovery($('cloud-email').value.trim());
  status('Check your email for a password reset link.');
}));
$('cloud-reset').addEventListener('submit',event=>{
  event.preventDefault();run(async()=>{
    const password=$('cloud-new-password').value;
    if(inviteToken){await acceptInvite(inviteToken,password);inviteToken=null;}
    else await updateUser({password});
    $('cloud-new-password').value='';resetting=false;$('cloud-reset').classList.add('hidden');
    status('Password saved. Your cloud backup is ready to use.');
  });
});
$('cloud-upload').addEventListener('click',()=>run(async()=>{
  if(!confirm("Replace your account's cloud backup with this device's current workspace? Other devices do not update automatically."))return;
  if(!save())throw Error('storage');
  await request('PUT',JSON.parse(JSON.stringify(data)));
  status('Cloud backup saved. Later changes stay on this device until you save to cloud again.');
}));
$('cloud-restore').addEventListener('click',()=>run(async()=>{
  const remote=await request('GET');
  if(!remote.payload)throw Error('empty');
  const copy=remote.payload;
  if(!Array.isArray(copy.tasks)||!copy.records||!copy.settings)throw Error('invalid');
  if(!confirm('Replace this device’s workspace with your cloud backup? Export a local backup first if you want to keep the current records.'))return;
  // Persist before changing the running workspace, so quota failures cannot lose the current copy.
  const restored=Object.assign(fresh(),copy);
  try{localStorage.setItem(KEY,JSON.stringify(restored));}catch{throw Error('storage');}
  data=restored;renderAll();renderTimer();queueTaskSync();
  status('Cloud backup restored on this device. Future changes save locally.');
}));
$('cloud-delete').addEventListener('click',()=>run(async()=>{
  if(!confirm('Delete your private cloud backup? Device records remain. This cannot be undone.'))return;
  await request('DELETE');status('Cloud backup deleted. Your device records remain.');
}));
$('cloud-logout').addEventListener('click',()=>run(async()=>{
  await logout();status('Signed out. Your device records remain available. On a shared device, export and delete local records separately.');
}));
onAuthChange(()=>refresh());
run(async()=>{
  const callback=await handleAuthCallback();
  if(callback?.type==='recovery'||callback?.type==='invite'){
    resetting=true;inviteToken=callback.token||null;
    $('cloud-reset').classList.remove('hidden');go('settings');
    status('Set a new password to finish.');
  }else if(callback){go('settings');status('Email confirmed. Choose Save or Restore to use your cloud backup.');}
  await refresh();
});
