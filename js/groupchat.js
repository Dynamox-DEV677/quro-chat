// ═══════════════════════════════════════
// GROUP CHATS Module
// ═══════════════════════════════════════
import { sb } from './config.js';
import { ME, REAL_USERS, curGroupChat, setCurGroupChat, curDMUser, setCurDMUser, chatMode, setChatMode, membersOpen, setMembersOpen, _myGroupChats, set_myGroupChats, _gcSelectedUsers, set_gcSelectedUsers } from './state.js';
import { subscribeAndRender } from './messaging.js';
import { escH, isMobile, notify } from './utils.js';
import { closeDrawer, updateSidebarToggleIcon } from './navigation.js';
import { closeMobileMembers } from './members.js';

export async function loadGroupChats(){
  if(!ME)return;
  try{
    var{data:memberships}=await sb.from('group_chat_members').select('group_id').eq('user_id',ME.id);
    if(!memberships||!memberships.length){set_myGroupChats([]);renderGCList();return;}
    var ids=memberships.map(m=>m.group_id);
    var{data:groups}=await sb.from('group_chats').select('*').in('id',ids);
    if(!groups){set_myGroupChats([]);renderGCList();return;}
    // Load members for each group
    var{data:allMembers}=await sb.from('group_chat_members').select('group_id,user_id').in('group_id',ids);
    set_myGroupChats(groups.map(function(g){
      var memberIds=(allMembers||[]).filter(m=>m.group_id===g.id).map(m=>m.user_id);
      var members=memberIds.map(function(uid){
        var u=REAL_USERS.find(r=>r.id===uid);
        if(u)return{id:u.id,username:u.username,photo:u.photo,avatar:u.avatar};
        if(uid===ME.id)return{id:ME.id,username:ME.username,photo:ME.photo,avatar:ME.avatar};
        return{id:uid,username:'User',photo:'',avatar:'?'};
      });
      return{id:g.id,name:g.name,icon:g.icon||'',created_by:g.created_by,members:members};
    }));
    renderGCList();
  }catch(e){console.error('loadGroupChats:',e);}
}

export function renderGCList(){
  ['gcList','drawerGcList'].forEach(function(listId){
    var list=document.getElementById(listId);
    if(!list)return;
    list.innerHTML='';
    if(!_myGroupChats.length)return;
    if(listId==='gcList'){
      var div=document.createElement('div');div.className='gc-divider';div.textContent='Group Chats';
      list.appendChild(div);
    }
    _myGroupChats.forEach(function(gc){
      var el=document.createElement('div');
      el.className='gc-item';
      el.dataset.gcid=gc.id;
      el.dataset.gckey='gc_'+gc.id;
      if(chatMode==='gc'&&curGroupChat&&curGroupChat.id===gc.id)el.classList.add('active');
      var initials=gc.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      el.innerHTML='<div class="gc-av">'+(gc.icon?'<img src="'+escH(gc.icon)+'">':'<span>'+initials+'</span>')+'</div>'
        +'<span class="gc-name">'+escH(gc.name)+'</span>'
        +'<span class="gc-count">'+gc.members.length+'</span>';
      el.onclick=function(){openGroupChat(gc);closeDrawer();};
      list.appendChild(el);
    });
  });
}

export function openGroupChat(gc){
  setCurGroupChat(gc);
  setCurDMUser(null);
  setChatMode('gc');
  // Clear GC unread badge
  if(typeof clearGCUnread==='function')clearGCUnread('gc_'+gc.id);
  document.getElementById('membersBar').classList.add('hidden');setMembersOpen(false);
  document.querySelectorAll('.ch-item').forEach(e=>e.classList.remove('active'));
  document.querySelectorAll('.dm-item').forEach(e=>e.classList.remove('active'));
  document.querySelectorAll('.gc-item').forEach(e=>e.classList.toggle('active',e.dataset.gcid===gc.id));
  var ci=document.getElementById('chatIcon');
  var initials=gc.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  ci.innerHTML=gc.icon?'<img src="'+escH(gc.icon)+'" style="width:100%;height:100%;object-fit:cover;border-radius:8px">':'<span style="font-size:13px;font-weight:700">'+initials+'</span>';
  var cn=document.getElementById('chatName');cn.textContent=gc.name;cn.className='chat-name';
  document.getElementById('chatDesc').textContent=gc.members.length+' members';
  document.getElementById('msgInput').placeholder='Message '+gc.name+'...';
  document.getElementById('inputArea').style.display='';
  // Show GC settings gear for owner
  var gcBtn=document.getElementById('gcSettingsBtn');
  gcBtn.style.display=(gc.created_by===ME.id)?'':'none';
  subscribeAndRender();
  if(isMobile()){closeDrawer();closeMobileMembers();document.querySelectorAll('.mob-nav-btn').forEach(b=>b.classList.remove('active'));document.getElementById('mnChat').classList.add('active');updateSidebarToggleIcon();}
}

// --- Create GC Modal ---
export function openGCCreate(){
  set_gcSelectedUsers([]);
  document.getElementById('gcNameInput').value='';
  document.getElementById('gcMemberSearch').value='';
  document.getElementById('gcSelectedTags').innerHTML='';
  document.getElementById('gcCreateBtn').disabled=true;
  document.getElementById('gcCreateBtn').textContent='Select at least 2 members';
  gcSearchMembers('');
  document.getElementById('gcCreateOverlay').classList.add('open');
  setTimeout(function(){document.getElementById('gcNameInput').focus();},80);
}

export function closeGCCreate(){
  document.getElementById('gcCreateOverlay').classList.remove('open');
}

export function gcSearchMembers(q){
  var list=document.getElementById('gcUserList');
  q=(q||'').toLowerCase().trim();
  var users=REAL_USERS.filter(function(u){
    return !q||u.username.toLowerCase().includes(q);
  }).slice(0,20);
  list.innerHTML='';
  users.forEach(function(u){
    var selected=_gcSelectedUsers.some(s=>s.id===u.id);
    var el=document.createElement('div');
    el.className='gcc-user'+(selected?' selected':'');
    el.innerHTML='<div class="gcc-user-av">'+(u.photo?'<img src="'+escH(u.photo)+'">':'<span>'+escH(u.avatar)+'</span>')+'</div>'
      +'<span class="gcc-user-name">'+escH(u.username)+'</span>'
      +'<div class="gcc-user-check">'+(selected?'\u2713':'')+'</div>';
    el.onclick=function(){gcToggleUser(u);};
    list.appendChild(el);
  });
}

export function gcToggleUser(u){
  var idx=_gcSelectedUsers.findIndex(s=>s.id===u.id);
  if(idx>=0)_gcSelectedUsers.splice(idx,1);
  else _gcSelectedUsers.push(u);
  gcUpdateTags();
  gcSearchMembers(document.getElementById('gcMemberSearch').value);
}

export function gcRemoveUser(uid){
  set_gcSelectedUsers(_gcSelectedUsers.filter(u=>u.id!==uid));
  gcUpdateTags();
  gcSearchMembers(document.getElementById('gcMemberSearch').value);
}

export function gcUpdateTags(){
  var tags=document.getElementById('gcSelectedTags');
  tags.innerHTML=_gcSelectedUsers.map(function(u){
    return '<span class="gcc-tag">'+escH(u.username)+'<span class="gcc-tag-x" onclick="event.stopPropagation();gcRemoveUser(\''+u.id+'\')">&#10005;</span></span>';
  }).join('');
  var btn=document.getElementById('gcCreateBtn');
  if(_gcSelectedUsers.length>=2){
    btn.disabled=false;
    btn.textContent='Create Group ('+(_gcSelectedUsers.length+1)+' members)';
  }else{
    btn.disabled=true;
    btn.textContent='Select at least 2 members';
  }
}

export async function createGroupChat(){
  var name=document.getElementById('gcNameInput').value.trim();
  if(!name){
    // Auto-generate name from members
    var names=[ME.username].concat(_gcSelectedUsers.map(u=>u.username));
    name=names.slice(0,3).join(', ')+(names.length>3?' +'.concat(names.length-3):'');
  }
  if(_gcSelectedUsers.length<2){notify('Select at least 2 members','error');return;}

  document.getElementById('gcCreateBtn').disabled=true;
  document.getElementById('gcCreateBtn').textContent='Creating\u2026';

  try{
    // Insert group
    var{data:gc,error}=await sb.from('group_chats').insert({name:name,icon:'',created_by:ME.id}).select().single();
    if(error)throw error;

    // Insert members (including self)
    var memberRows=[{group_id:gc.id,user_id:ME.id,role:'owner'}];
    _gcSelectedUsers.forEach(function(u){
      memberRows.push({group_id:gc.id,user_id:u.id,role:'member'});
    });
    var{error:memErr}=await sb.from('group_chat_members').insert(memberRows);
    if(memErr)throw memErr;

    notify('Group "'+name+'" created!','success');
    closeGCCreate();

    // Reload and open
    await loadGroupChats();
    var newGC=_myGroupChats.find(g=>g.id===gc.id);
    if(newGC)openGroupChat(newGC);
  }catch(e){
    console.error('createGroupChat:',e);
    notify('Failed to create group: '+e.message,'error');
    document.getElementById('gcCreateBtn').disabled=false;
    document.getElementById('gcCreateBtn').textContent='Create Group';
  }
}

// --- GC Settings (owner only) ---
export function openGCSettings(){
  if(!curGroupChat||curGroupChat.created_by!==ME.id)return;
  var gc=curGroupChat;
  document.getElementById('gcsNameInput').value=gc.name;
  var ini=gc.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  var preview=document.getElementById('gcsIconPreview');
  if(gc.icon){
    preview.innerHTML='<img src="'+escH(gc.icon)+'">';
  }else{
    preview.innerHTML='<span>'+ini+'</span>';
  }
  gcsRenderMembers();
  document.getElementById('gcSettingsOverlay').classList.add('open');
}

export function closeGCSettings(){
  document.getElementById('gcSettingsOverlay').classList.remove('open');
}

export function gcsRenderMembers(){
  var list=document.getElementById('gcsMembersList');
  var gc=curGroupChat;if(!list||!gc)return;
  list.innerHTML='';
  gc.members.forEach(function(m){
    var el=document.createElement('div');
    el.className='gcc-user';
    el.style.cursor='default';
    var isOwner=m.id===gc.created_by;
    var isMe=m.id===ME.id;
    el.innerHTML='<div class="gcc-user-av">'+(m.photo?'<img src="'+escH(m.photo)+'">':'<span>'+escH(m.avatar||'?')+'</span>')+'</div>'
      +'<span class="gcc-user-name">'+escH(m.username)+(isMe?' (you)':'')+'</span>'
      +(isOwner?'<span class="gcs-owner-tag">Owner</span>':'')
      +(!isOwner&&!isMe?'<button class="gcs-remove" onclick="gcsRemoveMember(\''+m.id+'\',\''+escH(m.username)+'\')">Remove</button>':'');
    list.appendChild(el);
  });
}

export async function gcsSaveName(){
  if(!curGroupChat)return;
  var name=document.getElementById('gcsNameInput').value.trim();
  if(!name){notify('Name cannot be empty','error');return;}
  try{
    var{error}=await sb.from('group_chats').update({name:name}).eq('id',curGroupChat.id);
    if(error)throw error;
    curGroupChat.name=name;
    document.getElementById('chatName').textContent=name;
    document.getElementById('msgInput').placeholder='Message '+name+'...';
    // Update icon initials
    var ini=name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    if(!curGroupChat.icon){
      document.getElementById('gcsIconPreview').innerHTML='<span>'+ini+'</span>';
      document.getElementById('chatIcon').innerHTML='<span style="font-size:13px;font-weight:700">'+ini+'</span>';
    }
    renderGCList();
    notify('Group name updated!','success');
  }catch(e){notify('Failed: '+e.message,'error');}
}

export async function gcsUploadIcon(input){
  if(!input.files||!input.files[0]||!curGroupChat)return;
  var file=input.files[0];
  if(file.size>2*1024*1024){notify('Max 2MB','error');return;}
  var ext=file.name.split('.').pop().toLowerCase();
  var path='gc-icons/'+curGroupChat.id+'.'+ext;
  try{
    var{error:upErr}=await sb.storage.from('avatars').upload(path,file,{upsert:true});
    if(upErr)throw upErr;
    var{data:urlData}=sb.storage.from('avatars').getPublicUrl(path);
    var iconUrl=urlData.publicUrl+'?t='+Date.now();
    var{error}=await sb.from('group_chats').update({icon:iconUrl}).eq('id',curGroupChat.id);
    if(error)throw error;
    curGroupChat.icon=iconUrl;
    document.getElementById('gcsIconPreview').innerHTML='<img src="'+escH(iconUrl)+'">';
    document.getElementById('chatIcon').innerHTML='<img src="'+escH(iconUrl)+'" style="width:100%;height:100%;object-fit:cover;border-radius:8px">';
    renderGCList();
    notify('Group icon updated!','success');
  }catch(e){notify('Upload failed: '+e.message,'error');}
  input.value='';
}

export async function gcsClearIcon(){
  if(!curGroupChat)return;
  try{
    var{error}=await sb.from('group_chats').update({icon:''}).eq('id',curGroupChat.id);
    if(error)throw error;
    curGroupChat.icon='';
    var ini=curGroupChat.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    document.getElementById('gcsIconPreview').innerHTML='<span>'+ini+'</span>';
    document.getElementById('chatIcon').innerHTML='<span style="font-size:13px;font-weight:700">'+ini+'</span>';
    renderGCList();
    notify('Icon removed','success');
  }catch(e){notify('Failed: '+e.message,'error');}
}

export async function gcsRemoveMember(uid,username){
  if(!curGroupChat||curGroupChat.created_by!==ME.id)return;
  if(!confirm('Remove '+username+' from the group?'))return;
  try{
    var{error}=await sb.from('group_chat_members').delete().eq('group_id',curGroupChat.id).eq('user_id',uid);
    if(error)throw error;
    curGroupChat.members=curGroupChat.members.filter(m=>m.id!==uid);
    document.getElementById('chatDesc').textContent=curGroupChat.members.length+' members';
    gcsRenderMembers();
    renderGCList();
    notify(username+' removed from group','success');
  }catch(e){notify('Failed: '+e.message,'error');}
}
