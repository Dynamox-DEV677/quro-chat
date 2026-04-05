// servers.js -- Server browsing, joining, creating, settings, invites
// Extracted from index.html — do not modify logic

import { sb } from './config.js';
import {
  ME,
  appMode, setAppMode,
  curServer, setCurServer,
  unreadCounts
} from './state.js';
import { escH, notify } from './utils.js';
import { updateServerBadge, clearServerUnread } from './notifications.js';
import { loadServerChannels } from './channels.js';
import { goHome, closeDrawer } from './navigation.js';
// TODO: import checkServerOwnership circular ref handled below

// ─── Mode: Server ───
export function pickServerById(serverId,serverName){
  setAppMode('server');setCurServer(serverId);clearServerUnread(serverId);
  // Right panel switches to server channels (sidebarNav stays visible)
  document.getElementById('homePanel').style.display='none';
  document.getElementById('serverPanel').style.display='flex';
  document.getElementById('drawerChannelSection').style.display='block';
  document.getElementById('serverLabel').textContent=serverName;
  document.getElementById('drawerServerLabel').textContent=serverName;
  // Show members bar for server view
  document.getElementById('membersBar').classList.remove('hidden');
  // Update sidebar server active state
  document.querySelectorAll('.sb-srv-item').forEach(function(s){s.classList.remove('active');});
  var srvItem=document.querySelector('.sb-srv-item[data-serverid="'+serverId+'"]');
  if(srvItem)srvItem.classList.add('active');
  document.querySelectorAll('.sb-nav-item').forEach(function(n){n.classList.remove('active');});
  loadServerChannels(serverId);
  checkServerOwnership();
}

// ─── Load joined servers into sidebar ───
export async function loadServersIntoBar(){
  if(!ME)return;
  var srvList=document.getElementById('srvList');srvList.innerHTML='';
  var sidebarList=document.getElementById('srvListSidebar');if(sidebarList)sidebarList.innerHTML='';
  var drawerSrvList=document.getElementById('drawerServerList');if(drawerSrvList)drawerSrvList.innerHTML='';
  var res=await sb.from('server_members').select('server_id, servers(id,name,icon)').eq('user_id',ME.id);
  if(!res.data||!res.data.length)return;
  res.data.forEach(function(m){
    var srv=m.servers;if(!srv)return;
    // Old icon bar (hidden but kept for compatibility)
    var btn=document.createElement('div');
    btn.className='srv-btn';btn.title=srv.name;btn.dataset.serverid=srv.id;
    btn.innerHTML=srv.icon?'<img src="'+escH(srv.icon)+'" style="width:100%;height:100%;object-fit:cover;border-radius:10px">':escH(srv.name.charAt(0).toUpperCase());
    btn.onclick=function(){
      document.querySelectorAll('.srv-btn').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');pickServerById(srv.id,srv.name);
    };
    srvList.appendChild(btn);

    // New sidebar text list
    if(sidebarList){
      var item=document.createElement('div');
      item.className='sb-srv-item';item.dataset.serverid=srv.id;
      var iconDiv=document.createElement('div');iconDiv.className='sb-srv-icon';
      iconDiv.innerHTML=srv.icon?'<img src="'+escH(srv.icon)+'">':escH(srv.name.charAt(0).toUpperCase());
      var nameSpan=document.createElement('span');nameSpan.className='sb-srv-name';nameSpan.textContent=srv.name;
      item.appendChild(iconDiv);
      item.appendChild(nameSpan);
      // Add unread badge placeholder
      var badge=document.createElement('span');badge.className='sb-srv-badge';badge.style.display='none';badge.dataset.badgeid=srv.id;
      item.appendChild(badge);
      item.onclick=function(){
        document.querySelectorAll('.srv-btn').forEach(function(b){b.classList.remove('active');});
        var oldBtn=document.querySelector('.srv-btn[data-serverid="'+srv.id+'"]');
        if(oldBtn)oldBtn.classList.add('active');
        pickServerById(srv.id,srv.name);
      };
      sidebarList.appendChild(item);
    }

    // Drawer server list (mobile)
    if(drawerSrvList){
      var dItem=document.createElement('div');
      dItem.className='sb-srv-item';dItem.dataset.serverid=srv.id;
      var dIcon=document.createElement('div');dIcon.className='sb-srv-icon';
      dIcon.innerHTML=srv.icon?'<img src="'+escH(srv.icon)+'">':escH(srv.name.charAt(0).toUpperCase());
      var dName=document.createElement('span');dName.className='sb-srv-name';dName.textContent=srv.name;
      dItem.appendChild(dIcon);
      dItem.appendChild(dName);
      dItem.onclick=function(){
        document.querySelectorAll('.srv-btn').forEach(function(b){b.classList.remove('active');});
        var oldBtn=document.querySelector('.srv-btn[data-serverid="'+srv.id+'"]');
        if(oldBtn)oldBtn.classList.add('active');
        closeDrawer();
        pickServerById(srv.id,srv.name);
      };
      drawerSrvList.appendChild(dItem);
    }
  });
  // Re-render any existing unread badges
  Object.keys(unreadCounts).forEach(function(sid){updateServerBadge(sid);});
}

// ─── Server Browser ───
export function openServerBrowser(){
  document.getElementById('srvBrowserOverlay').classList.add('open');
  loadAllServers();
}
export function closeServerBrowser(){document.getElementById('srvBrowserOverlay').classList.remove('open');}
export function srvBrowserOverlayClick(e){if(e.target===document.getElementById('srvBrowserOverlay'))closeServerBrowser();}

export async function loadAllServers(){
  var body=document.getElementById('srvbBody');
  body.innerHTML='<div class="srvb-empty">Loading\u2026</div>';
  var srvRes=await sb.from('servers').select('id,name,icon,description');
  var myRes=ME?await sb.from('server_members').select('server_id').eq('user_id',ME.id):{data:[]};
  var joined=new Set((myRes.data||[]).map(function(m){return m.server_id;}));
  var servers=srvRes.data||[];
  if(!servers.length){body.innerHTML='<div class="srvb-empty">No servers yet.<br>Create the first one below!</div>';return;}
  body.innerHTML=servers.map(function(srv){
    var isJoined=joined.has(srv.id);
    var ico=srv.icon?'<img src="'+escH(srv.icon)+'" style="width:100%;height:100%;object-fit:cover;border-radius:10px">':escH((srv.name||'?').charAt(0).toUpperCase());
    return '<div class="srvb-item"><div class="srvb-icon">'+ico+'</div>'+
      '<div class="srvb-info"><div class="srvb-name">'+escH(srv.name)+'</div><div class="srvb-desc">'+escH(srv.description||'A Quro server')+'</div></div>'+
      (isJoined?'<button class="srvb-join-btn joined">Joined</button>':'<button class="srvb-join-btn" onclick="joinServer(\''+srv.id+'\')">Join</button>')+
      '</div>';
  }).join('');
}

export async function joinServer(serverId){
  var btn=event.target;btn.disabled=true;btn.textContent='Joining\u2026';
  var res=await sb.from('server_members').insert({server_id:serverId,user_id:ME.id,role:'member'});
  if(res.error&&!res.error.message.includes('duplicate')){notify('Failed: '+res.error.message,'error');btn.disabled=false;btn.textContent='Join';return;}
  notify('Joined!','success');
  closeServerBrowser();
  await loadServersIntoBar();
  var srv=(await sb.from('servers').select('id,name').eq('id',serverId).single()).data;
  if(srv){
    document.querySelectorAll('.srv-btn').forEach(function(b){b.classList.remove('active');});
    var sBtn=document.querySelector('[data-serverid="'+serverId+'"]');
    if(sBtn)sBtn.classList.add('active');
    pickServerById(srv.id,srv.name);
  }
}

export async function createServer(){
  var name=prompt('Server name:');if(!name||!name.trim())return;
  var res=await sb.from('servers').insert({name:name.trim(),owner_id:ME.id,description:''}).select().single();
  if(res.error){notify('Failed: '+res.error.message,'error');return;}
  var srv=res.data;
  await sb.from('server_members').insert({server_id:srv.id,user_id:ME.id,role:'owner'});
  await sb.from('channels').insert({server_id:srv.id,name:'general',type:'text',position:0});
  notify('"'+name.trim()+'" created!','success');
  closeServerBrowser();
  await loadServersIntoBar();
  document.querySelectorAll('.srv-btn').forEach(function(b){b.classList.remove('active');});
  var sBtn=document.querySelector('[data-serverid="'+srv.id+'"]');
  if(sBtn)sBtn.classList.add('active');
  pickServerById(srv.id,srv.name);
}

export function pickServer(btnEl,id,name){
  // Legacy -- delegate to new DB-backed function
  document.querySelectorAll('.srv-btn').forEach(function(b){b.classList.remove('active');});
  if(btnEl)btnEl.classList.add('active');
  pickServerById(id,name);
}

export function addServer(){openServerBrowser();}

// ─── Server Settings (Owner Only) ───
var _curServerData=null;
export { _curServerData };

export async function checkServerOwnership(){
  var btn=document.getElementById('srvSettingsBtn');
  var addChBtn=document.getElementById('addChannelBtn');
  if(!curServer||!ME){btn.style.display='none';return;}
  var{data}=await sb.from('servers').select('id,name,icon,description,owner_id').eq('id',curServer).single();
  _curServerData=data;
  var isOwner=data&&data.owner_id===ME.id;
  btn.style.display=isOwner?'':'none';
  addChBtn.style.display=isOwner?'':'none';
}

export function openServerSettings(){
  if(!_curServerData)return;
  var s=_curServerData;
  document.getElementById('srvsName').value=s.name||'';
  document.getElementById('srvsDesc').value=s.description||'';
  var preview=document.getElementById('srvsIconPreview');
  preview.innerHTML=s.icon?'<img src="'+escH(s.icon)+'">':escH((s.name||'?').charAt(0).toUpperCase());
  var url=window.location.origin+window.location.pathname+'?invite='+curServer;
  document.getElementById('srvsInviteUrl').value=url;
  document.getElementById('srvSettingsOverlay').classList.add('open');
}
export function closeServerSettings(){document.getElementById('srvSettingsOverlay').classList.remove('open');}

export async function saveServerSettings(){
  if(!curServer||!_curServerData)return;
  var name=document.getElementById('srvsName').value.trim();
  var desc=document.getElementById('srvsDesc').value.trim();
  if(!name){notify('Server name cannot be empty','error');return;}
  var{error}=await sb.from('servers').update({name:name,description:desc}).eq('id',curServer);
  if(error){notify('Failed: '+error.message,'error');return;}
  _curServerData.name=name;_curServerData.description=desc;
  document.getElementById('serverLabel').textContent=name;
  document.getElementById('drawerServerLabel').textContent=name;
  await loadServersIntoBar();
  notify('Server updated!','success');
}

export async function uploadServerIcon(e){
  var file=e.target.files[0];if(!file||!curServer)return;
  if(file.size>2*1024*1024){notify('Max 2MB','error');e.target.value='';return;}
  try{
    var ext=file.name.split('.').pop()||'png';
    var path='server-icons/'+curServer+'/icon.'+ext;
    var{error:upErr}=await sb.storage.from('avatars').upload(path,file,{upsert:true,contentType:file.type});
    if(upErr)throw upErr;
    var{data:urlData}=sb.storage.from('avatars').getPublicUrl(path);
    var url=urlData.publicUrl+'?t='+Date.now();
    var{error:dbErr}=await sb.from('servers').update({icon:url}).eq('id',curServer);
    if(dbErr)throw dbErr;
    _curServerData.icon=url;
    document.getElementById('srvsIconPreview').innerHTML='<img src="'+escH(url)+'">';
    await loadServersIntoBar();
    notify('Server icon updated!','success');
  }catch(err){notify('Upload failed: '+(err.message||err),'error');}
  e.target.value='';
}

export function copyInviteLink(){
  var input=document.getElementById('srvsInviteUrl');
  input.select();
  navigator.clipboard.writeText(input.value).then(function(){
    notify('Invite link copied!','success');
  }).catch(function(){
    document.execCommand('copy');
    notify('Invite link copied!','success');
  });
}

export async function leaveServer(){
  if(!curServer||!ME)return;
  if(_curServerData&&_curServerData.owner_id===ME.id){notify('You cannot leave a server you own. Transfer ownership first.','error');return;}
  if(!confirm('Leave this server?'))return;
  await sb.from('server_members').delete().eq('server_id',curServer).eq('user_id',ME.id);
  notify('Left the server.','info');
  closeServerSettings();
  await loadServersIntoBar();
  goHome();
}

// ─── Invite System ───
var _pendingInvite=null;
export { _pendingInvite };

export async function checkInviteLink(){
  var params=new URLSearchParams(window.location.search);
  var inviteId=params.get('invite');
  if(!inviteId)return;
  _pendingInvite=inviteId;
  // Clean URL
  window.history.replaceState({},'',window.location.pathname);
  // If not logged in yet, the invite will be handled after login in initApp
}

export async function showInviteModal(){
  if(!_pendingInvite)return;
  var srvId=_pendingInvite;
  var{data:srv}=await sb.from('servers').select('id,name,icon,description').eq('id',srvId).single();
  if(!srv){notify('Server not found or invite is invalid.','error');_pendingInvite=null;return;}
  var{count}=await sb.from('server_members').select('id',{count:'exact',head:true}).eq('server_id',srvId);
  // Check if already joined
  var{data:membership}=await sb.from('server_members').select('id').eq('server_id',srvId).eq('user_id',ME.id).maybeSingle();
  var iconEl=document.getElementById('inviteIcon');
  iconEl.innerHTML=srv.icon?'<img src="'+escH(srv.icon)+'">':escH((srv.name||'?').charAt(0).toUpperCase());
  document.getElementById('inviteName').textContent=srv.name;
  document.getElementById('inviteDesc').textContent=srv.description||'Come hang out on Quro!';
  document.getElementById('inviteMembers').textContent=(count||0)+' member'+(count!==1?'s':'');
  var joinBtn=document.getElementById('inviteJoinBtn');
  if(membership){
    joinBtn.textContent='Already Joined';joinBtn.classList.add('joined');joinBtn.onclick=function(){closeInviteModal();
      document.querySelectorAll('.srv-btn').forEach(function(b){b.classList.remove('active');});
      var sBtn=document.querySelector('[data-serverid="'+srvId+'"]');if(sBtn)sBtn.classList.add('active');
      pickServerById(srvId,srv.name);
    };
  }else{
    joinBtn.textContent='Join Server';joinBtn.classList.remove('joined');joinBtn.onclick=async function(){
      joinBtn.disabled=true;joinBtn.textContent='Joining\u2026';
      var res=await sb.from('server_members').insert({server_id:srvId,user_id:ME.id,role:'member'});
      if(res.error&&!res.error.message.includes('duplicate')){notify('Failed: '+res.error.message,'error');joinBtn.disabled=false;joinBtn.textContent='Join Server';return;}
      notify('Welcome to '+srv.name+'!','success');
      closeInviteModal();
      await loadServersIntoBar();
      document.querySelectorAll('.srv-btn').forEach(function(b){b.classList.remove('active');});
      var sBtn=document.querySelector('[data-serverid="'+srvId+'"]');if(sBtn)sBtn.classList.add('active');
      pickServerById(srvId,srv.name);
    };
  }
  _pendingInvite=null;
  document.getElementById('inviteOverlay').classList.add('open');
}
export function closeInviteModal(){document.getElementById('inviteOverlay').classList.remove('open');}
