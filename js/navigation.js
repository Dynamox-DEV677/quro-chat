// navigation.js -- Drawer, sidebar toggle, home, mobile nav
// Mobile-first: drawer is the primary view on phones

import { sb } from './config.js';
import {
  ME,
  appMode, setAppMode,
  chatMode,
  curChannel,
  curDMUser,
  realtimeSub, setRealtimeSub
} from './state.js';
import { isMobile, escH, setAvatarEl, notify } from './utils.js';
import { _stopPoll } from './messaging.js';
import { _clearTypingChannel } from './typing.js';
import { clearReply } from './reactions.js';
import { openChannel } from './channels.js';
import { closeMobileMembers } from './members.js';
import { openStocksPanel } from './stocks.js';

/* ─── Drawer open / close ─── */
export function openDrawer(){
  var overlay=document.getElementById('sidebarOverlay');
  var drawer=document.getElementById('sidebarDrawer');
  // On mobile: no overlay at all (drawer is full-screen)
  if(overlay && !isMobile()){
    overlay.classList.add('open');
  }
  if(drawer)drawer.classList.add('open');
  document.body.classList.add('drawer-open');
  syncDrawer();
}
export function closeDrawer(){
  var overlay=document.getElementById('sidebarOverlay');
  var drawer=document.getElementById('sidebarDrawer');
  if(overlay)overlay.classList.remove('open');
  if(drawer)drawer.classList.remove('open');
  document.body.classList.remove('drawer-open');
}
export function isDrawerOpen(){
  var drawer=document.getElementById('sidebarDrawer');
  return drawer&&drawer.classList.contains('open');
}

export function syncDrawer(){
  var label=document.getElementById('drawerServerLabel');
  if(label)label.textContent=appMode==='home'?'Quro':(document.getElementById('serverLabel')?.textContent||'Server');
  var chSec=document.getElementById('drawerChannelSection');
  if(chSec)chSec.style.display=appMode==='server'?'block':'none';
  if(ME){
    setAvatarEl('drawerAvatarBtn',ME.avatar,ME.photo,'drawerAvatarLetter');
    var dn=document.getElementById('drawerMyName');
    if(dn){dn.textContent=ME.username;dn.className='u-name nf-'+(ME.name_font||'default');}
  }
  document.querySelectorAll('#drawerChannelItems .ch-item').forEach(function(el){
    var n=el.textContent.trim().replace(/^#/,'');
    el.classList.toggle('active',chatMode==='channel'&&n===curChannel);
  });
  document.querySelectorAll('#drawerDmList .dm-item').forEach(function(el){
    el.classList.toggle('active',chatMode==='dm'&&curDMUser&&el.dataset.dmid===curDMUser.id);
  });
}

export function openChannelAndClose(name){openChannel(name);closeDrawer();}

/* ─── Mobile back button / sidebar toggle ─── */
export function handleSidebarToggle(){
  if(!isMobile()){
    // Desktop: toggle drawer overlay
    if(isDrawerOpen())closeDrawer();else openDrawer();
    return;
  }
  // Mobile: back arrow opens the drawer (primary navigation view)
  mobileNavTo('home');
}

export function updateSidebarToggleIcon(){
  var iconEl=document.getElementById('sidebarToggleIcon');
  if(!iconEl)return;
  if(isMobile()){
    // Back arrow on mobile
    iconEl.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><polyline points="15 18 9 12 15 6"/></svg>';
  }else{
    iconEl.textContent='\u2630';
  }
}
window.addEventListener('resize',updateSidebarToggleIcon);

/* ─── Mode: Home (DMs) ─── */
export function goHome(){
  setAppMode('home');
  document.querySelectorAll('.srv-btn').forEach(function(b){b.classList.remove('active');});
  var srvHome=document.getElementById('srvHome');
  if(srvHome)srvHome.classList.add('active');
  // Show DM panel, hide server panel
  var hp=document.getElementById('homePanel');if(hp)hp.style.display='flex';
  var sp=document.getElementById('serverPanel');if(sp)sp.style.display='none';
  var dcs=document.getElementById('drawerChannelSection');if(dcs)dcs.style.display='none';
  var dsl=document.getElementById('drawerServerLabel');if(dsl)dsl.textContent='Quro';
  var ia=document.getElementById('inputArea');if(ia)ia.style.display='none';
  var ci=document.getElementById('chatIcon');
  if(ci)ci.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var cn=document.getElementById('chatName');if(cn)cn.textContent='Direct Messages';
  var cd=document.getElementById('chatDesc');if(cd)cd.textContent='Select a conversation';
  var mw=document.getElementById('msgsWrap');
  if(mw)mw.innerHTML='<div class="empty"><div class="empty-icon" style="opacity:.09"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:56px;height:56px"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><div class="empty-title">Your Messages</div><div class="empty-sub">Select a DM to start chatting,<br>or join a server with the + button.</div></div>';
  var mb=document.getElementById('membersBar');if(mb)mb.classList.add('hidden');
  // Update sidebar nav active state
  document.querySelectorAll('.sb-nav-item').forEach(function(n){n.classList.remove('active');});
  var nh=document.getElementById('navHome');if(nh)nh.classList.add('active');
  document.querySelectorAll('.sb-srv-item').forEach(function(s){s.classList.remove('active');});
  _stopPoll();_clearTypingChannel();clearReply();
  if(realtimeSub){try{sb.removeChannel(realtimeSub);}catch(e){}setRealtimeSub(null);}

  // On mobile, auto-open the drawer when going home
  if(isMobile()){
    openDrawer();
  }
}

export function goBackToNav(){
  goHome();
}

/* ─── Mobile navigation ─── */
export function mobileNavTo(tab){
  closeMobileMembers();
  document.querySelectorAll('.mob-nav-btn').forEach(b=>b.classList.remove('active'));
  var btn=document.getElementById('mn'+tab.charAt(0).toUpperCase()+tab.slice(1));
  if(btn)btn.classList.add('active');

  if(tab==='home'){
    // Full-screen drawer — shows DMs, channels, servers
    openDrawer();
    var ds=document.getElementById('drawerScroll');
    if(ds)ds.scrollTop=0;
  }
  else if(tab==='chat'){
    // Close drawer — reveal current chat
    closeDrawer();
  }
  else if(tab==='trade'){
    closeDrawer();
    if(typeof window.openTradingPage==='function')window.openTradingPage();
  }
  else if(tab==='stocks'){
    closeDrawer();
    openStocksPanel();
  }
  else if(tab==='members'){
    closeDrawer();
    if(typeof window.mobileToggleMembers==='function')window.mobileToggleMembers();
  }
}
