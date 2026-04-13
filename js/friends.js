// ═══ FRIENDS PAGE ═══
import { REAL_USERS, appMode } from './state.js?v=49';
import { escH } from './utils.js?v=49';
import { goHome } from './navigation.js?v=49';
import { openDM } from './dm.js?v=49';

var _fpTab='all';
var _fpUserMap={};

export function openFriendsPage(){
  document.getElementById('friendsPage').classList.add('open');
  document.getElementById('srvFriendsBtn').classList.add('active');
  document.querySelectorAll('.sb-nav-item').forEach(function(n){n.classList.remove('active');});
  document.getElementById('navFriends').classList.add('active');
  document.getElementById('fpSearch').value='';
  if(typeof window.setActiveOverlay==='function') window.setActiveOverlay('friends');
  if(typeof window.syncMobileNav==='function') window.syncMobileNav('friends');
  fpRender();
}

// silent=true when called from navigation.js _closeOverlaySilent
export function closeFriendsPage(silent){
  document.getElementById('friendsPage').classList.remove('open');
  document.getElementById('srvFriendsBtn').classList.remove('active');
  if(typeof window.setActiveOverlay==='function') window.setActiveOverlay(null);

  if(silent) return;

  if(typeof window.navigateBack==='function'){
    window.navigateBack();
  } else {
    if(appMode==='home'){document.querySelectorAll('.sb-nav-item').forEach(function(n){n.classList.remove('active');});document.getElementById('navHome').classList.add('active');}
    if(typeof window.syncMobileNav==='function') window.syncMobileNav('chats');
  }
}

export function fpSwitchTab(tab){
  _fpTab=tab;
  document.getElementById('fpTabAll').classList.toggle('active',tab==='all');
  document.getElementById('fpTabOnline').classList.toggle('active',tab==='online');
  fpRender();
}

export function fpRender(){
  _fpUserMap={};
  REAL_USERS.forEach(function(u){_fpUserMap[u.id]=u;});
  var q=(document.getElementById('fpSearch').value||'').trim().toLowerCase();
  var users=REAL_USERS.slice();
  if(_fpTab==='online')users=users.filter(function(u){return u.status==='on'||u.status==='idle';});
  if(q)users=users.filter(function(u){return u.username.toLowerCase().includes(q);});
  var body=document.getElementById('fpList');
  if(!users.length){
    body.innerHTML='<div class="empty-state" style="padding:var(--sp-10) var(--sp-5)">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' +
      '<h3>'+(REAL_USERS.length===0?'No one here yet':'No users found')+'</h3>' +
      '<p>'+(REAL_USERS.length===0?'Share Quro with friends to start chatting together':'Try a different search or check back later')+'</p>' +
      '</div>';
    return;
  }
  var onlineCount=REAL_USERS.filter(function(u){return u.status==='on';}).length;
  body.innerHTML='<div style="font-size:10px;color:rgba(255,255,255,.22);letter-spacing:1px;margin-bottom:10px;font-weight:700">'+
    REAL_USERS.length+' USERS &nbsp;·&nbsp; '+onlineCount+' ONLINE</div>'+
    users.map(function(u){
      var st=u.status==='on'?'Online':u.status==='idle'?'Away':'Offline';
      return '<div class="fp-user">'+
        '<div class="fp-uav">'+(u.photo?'<img src="'+escH(u.photo)+'">':escH(u.avatar||u.username.charAt(0).toUpperCase()))+
        '<div class="fp-dot '+u.status+'"></div></div>'+
        '<div class="fp-uinfo"><div class="fp-uname nf-'+(u.name_font||'default')+'">@'+escH(u.username)+'</div><div class="fp-ustatus">'+st+'</div></div>'+
        '<button class="fp-ubtn" onclick="event.stopPropagation();closeFriendsPage();fpOpenDM(\''+u.id+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:-1px"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> DM</button>'+
        '</div>';
    }).join('');
}

export function fpOpenDM(userId){
  var u=_fpUserMap[userId]||REAL_USERS.find(function(x){return x.id===userId;});
  if(u){goHome();openDM(u);}
}
