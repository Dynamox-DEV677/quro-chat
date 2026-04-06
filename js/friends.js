// ═══ FRIENDS PAGE ═══
import { REAL_USERS, appMode } from './state.js';
import { escH } from './utils.js';
import { goHome } from './navigation.js';
import { openDM } from './dm.js';

var _fpTab='all';
var _fpUserMap={};

export function openFriendsPage(){
  document.getElementById('friendsPage').classList.add('open');
  document.getElementById('srvFriendsBtn').classList.add('active');
  document.querySelectorAll('.sb-nav-item').forEach(function(n){n.classList.remove('active');});
  document.getElementById('navFriends').classList.add('active');
  document.getElementById('fpSearch').value='';
  fpRender();
}

export function closeFriendsPage(){
  document.getElementById('friendsPage').classList.remove('open');
  document.getElementById('srvFriendsBtn').classList.remove('active');
  // Restore nav active to home if in home mode
  if(appMode==='home'){document.querySelectorAll('.sb-nav-item').forEach(function(n){n.classList.remove('active');});document.getElementById('navHome').classList.add('active');}
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
    body.innerHTML='<div class="fp-empty">'+(REAL_USERS.length===0?'No one else on Quro yet.<br>Invite friends!':'No users found.')+'</div>';
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
