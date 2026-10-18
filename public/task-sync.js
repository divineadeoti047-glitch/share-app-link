// Local changes never upload automatically. Cloud copies are explicitly managed in Settings.
function queueTaskSync(){
  const el=document.getElementById('task-save-status');
  if(el)el.textContent='Saved on this device. Manage your private cloud backup in Settings.';
}
queueTaskSync();
