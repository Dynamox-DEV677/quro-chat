// ═══════════════════════════════════════
// DM (Direct Messages) Module
// ═══════════════════════════════════════
import { sb } from './config.js';
import { ME, REAL_USERS, curDMUser, setCurDMUser, chatMode, setChatMode, curGroupChat, setCurGroupChat, membersOpen, setMembersOpen, _dmLastMsg, set_dmLastMsg, _usTimeout, set_usTimeout } from './state.js';
import { subscribeAndRender } from './messaging.js';
import { escH, getMsgKey, isMobile, decorRingHTML, notify } from './utils.js';
import { closeDrawer, updateSidebarToggleIcon } from './navigation.js';
import { closeMobileMembers } from './members.js';

export async function fetchDMLastMessages(){
  if(!ME||!REAL_USERS.length)return;
  try{
    var dmKeys=REAL_USERS.map(u=>'dm_'+[ME.id,u.id].sort().join('_'));
    var{data}=await sb.from('messages').select('server_channel,created_at').in('server_channel',dmKeys).order('created_at',{ascending:false}).limit(500);
    set_dmLastMsg({});
    if(data){
      data.forEach(function(m){
        if(!_dmLastMsg[m.server_channel])_dmLastMsg[m.server_channel]=m.created_at;
      });
    }
  }catch(e){console.warn('[Quro] fetchDMLastMessages error:',e.message);}
}

export function buildDMList(){
  const dmEmpty=document.getElementById('dmEmpty');
  const dmSkel=document.getElementById('dmSkeleton');
  if(dmSkel)dmSkel.style.display='none';
  // Sort users: those with recent messages first, then by message time desc
  var sorted=REAL_USERS.slice().sort(function(a,b){
    var ka='dm_'+[ME.id,a.id].sort().join('_');
    var kb='dm_'+[ME.id,b.id].sort().join('_');
    var ta=_dmLastMsg[ka]||'';
    var tb=_dmLastMsg[kb]||'';
    if(ta&&!tb)return -1;
    if(!ta&&tb)return 1;
    if(ta&&tb)return ta>tb?-1:ta<tb?1:0;
    return 0;
  });
  ['dmList','drawerDmList'].forEach(listId=>{
    const list=document.getElementById(listId);if(!list)return;list.innerHTML='';
    if(!sorted.length){if(listId==='dmList'&&dmEmpty)dmEmpty.style.display='flex';return;}
    if(listId==='dmList'&&dmEmpty)dmEmpty.style.display='none';
    sorted.forEach(u=>{
      const el=document.createElement('div');el.className='dm-item';el.dataset.dmid=u.id;
      const dotCls=u.status==='on'?'on':u.status==='idle'?'idle':'off';
      el.innerHTML=`<div class="dm-av" style="position:relative;overflow:visible">${u.photo?`<img src="${escH(u.photo)}">`:`<span>${escH(u.avatar)}</span>`}<div class="dm-dot ${dotCls}"></div>${decorRingHTML(u.decor)}</div><span class="dm-name nf-${u.name_font||'default'}"${u.name_color?' style="color:'+u.name_color+'"':''}>${escH(u.username)}</span>`;
      el.onclick=()=>{openDM(u);closeDrawer();};list.appendChild(el);
    });
  });
}

export function openDM(user){
  setCurDMUser(user);setChatMode('dm');setCurGroupChat(null);
  // Clear DM unread badge
  var dmKey='dm_'+[ME.id,user.id].sort().join('_');
  if(typeof clearDMUnread==='function')clearDMUnread(dmKey);
  document.getElementById('gcSettingsBtn').style.display='none';
  document.getElementById('membersBar').classList.add('hidden');setMembersOpen(false);
  document.querySelectorAll('.ch-item').forEach(e=>e.classList.remove('active'));
  document.querySelectorAll('.dm-item').forEach(e=>e.classList.toggle('active',e.dataset.dmid===user.id));
  const ci=document.getElementById('chatIcon');
  ci.innerHTML=user.photo?`<img src="${escH(user.photo)}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`:`<span style="font-size:13px;font-weight:700">${escH(user.avatar)}</span>`;
  var cn=document.getElementById('chatName');cn.textContent=user.username;cn.className='chat-name nf-'+(user.name_font||'default');
  document.getElementById('chatDesc').textContent='Direct Message';
  document.getElementById('msgInput').placeholder='Message '+user.username+'...';
  document.getElementById('inputArea').style.display='';
  subscribeAndRender();
  if(isMobile()){closeDrawer();closeMobileMembers();document.querySelectorAll('.mob-nav-btn').forEach(b=>b.classList.remove('active'));document.getElementById('mnChat').classList.add('active');updateSidebarToggleIcon();}
}

export function startNewDM(){openUserSearch();}

// --- User Search Modal ---
export function openUserSearch(){
  document.getElementById('userSearchOverlay').classList.add('open');
  var inp=document.getElementById('userSearchInput');
  inp.value='';
  document.getElementById('usCount').textContent='';
  document.getElementById('usResults').innerHTML='<div class="us-empty">Type a username to find people</div>';
  setTimeout(function(){inp.focus();},80);
}

export function closeUserSearch(){
  document.getElementById('userSearchOverlay').classList.remove('open');
  clearTimeout(_usTimeout);
}

export function userSearchOverlayClick(e){
  if(e.target===document.getElementById('userSearchOverlay'))closeUserSearch();
}

export function searchUsers(raw){
  clearTimeout(_usTimeout);
  var q=raw.trim().toLowerCase();
  var countEl=document.getElementById('usCount');
  var body=document.getElementById('usResults');
  if(!q){
    countEl.textContent='';
    body.innerHTML='<div class="us-empty">Type a username to find people</div>';
    return;
  }
  // Show local matches instantly
  var local=REAL_USERS.filter(function(u){return u.username.toLowerCase().includes(q);});
  renderUSResults(local,q);
  // Then search DB (catches users not yet in REAL_USERS)
  set_usTimeout(setTimeout(async function(){
    var res=await sb.from('profiles').select('id,username,avatar,photo,last_seen,name_font,name_color,nameplate,about,banner').ilike('username','%'+q+'%').neq('id',ME.id).limit(25);
    if(!res.data)return;
    var now=Date.now();
    var dbUsers=res.data.map(function(u){
      var diff=u.last_seen?now-new Date(u.last_seen).getTime():Infinity;
      return{id:u.id,username:u.username,avatar:u.avatar||u.username.charAt(0).toUpperCase(),photo:u.photo||'',status:diff<90000?'on':diff<300000?'idle':'off',name_font:u.name_font||'default',name_color:u.name_color||'',nameplate:u.nameplate||'',about:u.about||'',banner:u.banner||'b1'};
    });
    renderUSResults(dbUsers,q);
  },320));
}

export function renderUSResults(users,q){
  var countEl=document.getElementById('usCount');
  var body=document.getElementById('usResults');
  var n=users.length;
  if(n===0){
    countEl.textContent='0 users found';
    countEl.style.color='rgba(255,255,255,.18)';
    body.innerHTML='<div class="us-empty">No users found for "<b>'+escH(q)+'</b>"<br><span style="font-size:11px">They may not have signed up yet</span></div>';
    return;
  }
  countEl.textContent=n+' user'+(n===1?'':'s')+' found';
  countEl.style.color='rgba(255,255,255,.4)';
  body.innerHTML=users.map(function(u){
    var dotCls=u.status==='on'?'on':u.status==='idle'?'idle':'off';
    var statusTxt=u.status==='on'?'Online':u.status==='idle'?'Away':'Offline';
    return '<div class="us-item" onclick="selectUserForDM(\''+u.id+'\')">'+
      '<div class="us-av">'+(u.photo?'<img src="'+escH(u.photo)+'">':(escH(u.avatar)))+
      '<div class="us-sdot '+dotCls+'"></div></div>'+
      '<div style="flex:1;min-width:0"><div class="us-uname nf-'+(u.name_font||'default')+'">@'+escH(u.username)+'</div>'+
      '<div class="us-ustatus">'+statusTxt+'</div></div>'+
      '<button class="us-msg-btn" onclick="event.stopPropagation();selectUserForDM(\''+u.id+'\')">Message</button>'+
      '</div>';
  }).join('');
}

export async function selectUserForDM(userId){
  var u=REAL_USERS.find(function(x){return x.id===userId;});
  if(!u){
    var res=await sb.from('profiles').select('id,username,avatar,photo,last_seen,name_font,name_color,nameplate,about,banner').eq('id',userId).single();
    if(res.data){
      var d=res.data,diff=d.last_seen?Date.now()-new Date(d.last_seen).getTime():Infinity;
      u={id:d.id,username:d.username,avatar:d.avatar||d.username.charAt(0).toUpperCase(),photo:d.photo||'',status:diff<90000?'on':diff<300000?'idle':'off',name_font:d.name_font||'default',name_color:d.name_color||'',nameplate:d.nameplate||'',about:d.about||'',banner:d.banner||'b1'};
    }
  }
  if(u){closeUserSearch();closeDrawer();openDM(u);}
}
