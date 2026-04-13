// navigation.js -- Drawer, sidebar toggle, home, mobile nav
// Mobile-first: drawer is the primary view on phones
// ═══ Navigation Stack — "back" always returns to previous screen ═══

import { sb } from './config.js?v=48';
import {
  ME,
  appMode, setAppMode,
  chatMode,
  curChannel,
  curDMUser,
  realtimeSub, setRealtimeSub
} from './state.js?v=48';
import { isMobile, escH, setAvatarEl, notify } from './utils.js?v=48';
import { _stopPoll } from './messaging.js?v=48';
import { _clearTypingChannel } from './typing.js?v=48';
import { clearReply } from './reactions.js?v=48';
import { openChannel } from './channels.js?v=48';
import { closeMobileMembers } from './members.js?v=48';
import { openStocksPanel } from './stocks.js?v=48';

// ═══ Navigation Stack ═══
// Tracks where the user "came from" so close operations return correctly.
// Stack entries are tab names: 'chats', 'chat', 'trade', 'stocks', 'leaderboard', 'settings', 'profile'
var _navStack = [];
var _activeOverlay = null; // currently open full-screen overlay name (or null)

export function getActiveOverlay() { return _activeOverlay; }
export function setActiveOverlay(name) {
  _activeOverlay = name;
  // Sync body class so CSS can hide mobile nav when overlays are open
  if (name) {
    document.body.classList.add('overlay-open');
  } else {
    document.body.classList.remove('overlay-open');
  }
}

export function navPush(destination) {
  // Push current state before navigating away
  var current = _activeOverlay || (isDrawerOpen() ? 'chats' : 'chat');
  // Don't push if we're going to the same place
  if (current === destination) return;
  // Limit stack depth to prevent memory leaks
  if (_navStack.length > 10) _navStack.splice(0, _navStack.length - 10);
  _navStack.push(current);
}

export function navPop() {
  return _navStack.length > 0 ? _navStack.pop() : null;
}

export function navClear() {
  _navStack = [];
}

// Push a specific value directly (used when the caller knows exactly what to push)
export function navStackPushRaw(val) {
  if (_navStack.length > 10) _navStack.splice(0, _navStack.length - 10);
  _navStack.push(val);
}

/* ─── Mobile nav active state sync ─── */
export function syncMobileNav(activeTab) {
  if (!isMobile()) return;
  document.querySelectorAll('.mob-nav-btn').forEach(function(b) { b.classList.remove('active'); });
  var idMap = {
    chats: 'mnChats', chat: 'mnChats', home: 'mnChats',
    trade: 'mnTrade',
    leaderboard: 'mnLeaderboard',
    profile: 'mnProfile',
    settings: 'mnSettings',
    stocks: 'mnChats',       // stocks isn't a bottom nav tab, highlight chats
    friends: 'mnChats'       // friends isn't a bottom nav tab, highlight chats
  };
  var btnId = idMap[activeTab] || 'mnChats';
  var btn = document.getElementById(btnId);
  if (btn) btn.classList.add('active');
}

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
  mobileNavTo('chats');
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
// ── Perf: debounced resize handler — fires once per 150ms instead of 100x/sec ──
var _resizeTimer=0;
window.addEventListener('resize',function(){clearTimeout(_resizeTimer);_resizeTimer=setTimeout(updateSidebarToggleIcon,150);},{passive:true});

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
  if(realtimeSub){try{sb.removeChannel(realtimeSub);}catch(e){/* cleanup */}setRealtimeSub(null);}

  // On mobile, auto-open the drawer when going home
  if(isMobile()){
    openDrawer();
  }
}

export function goBackToNav(){
  goHome();
}

/* ─── Close a specific overlay silently (no nav stack manipulation) ─── */
function _closeOverlaySilent(name) {
  if (name === 'trade') {
    var tp = document.getElementById('tradingPage');
    if (tp && tp.classList.contains('open') && typeof window.closeTradingPage === 'function') window.closeTradingPage(true);
  } else if (name === 'stocks') {
    var sp = document.getElementById('stocksPage');
    if (sp && sp.classList.contains('open') && typeof window.closeStocksPanel === 'function') window.closeStocksPanel(true);
  } else if (name === 'leaderboard') {
    var lp = document.getElementById('leaderPage');
    if (lp && lp.classList.contains('open') && typeof window.closeLeaderPage === 'function') window.closeLeaderPage(true);
  } else if (name === 'settings') {
    var st = document.getElementById('settingsPanel');
    if (st && st.classList.contains('open') && typeof window.closeSettings === 'function') window.closeSettings();
  } else if (name === 'friends') {
    if (typeof window.closeFriendsPage === 'function') window.closeFriendsPage(true);
  } else if (name === 'profile') {
    var pp = document.getElementById('profilePopup');
    if (pp && pp.style.display !== 'none' && pp.style.display !== '') {
      if (typeof window.closeProfilePopup === 'function') window.closeProfilePopup();
    }
  }
}

/* ─── Close all overlay pages ─── */
function _closeAllOverlays(except){
  var overlays = ['trade', 'stocks', 'leaderboard', 'settings', 'friends', 'profile'];
  for (var i = 0; i < overlays.length; i++) {
    if (overlays[i] !== except) _closeOverlaySilent(overlays[i]);
  }
  setActiveOverlay(except || null);
}

/* ─── Navigate back (stack-aware) ─── */
export function navigateBack() {
  var prev = navPop();
  if (prev) {
    mobileNavTo(prev, true); // skipStack=true to avoid re-pushing
  } else {
    // Default: go to chats
    mobileNavTo('chats', true);
  }
}

/* ─── Mobile navigation ─── */
export function mobileNavTo(tab, skipStack){
  closeMobileMembers();

  // Push current state to stack before navigating (unless skipStack)
  if (!skipStack && _activeOverlay && _activeOverlay !== tab) {
    navPush(tab); // this pushes current _activeOverlay
  }

  // Close ALL overlays except the one we're opening
  var isOverlay = ['trade', 'stocks', 'leaderboard', 'settings', 'friends', 'profile'].indexOf(tab) >= 0;
  _closeAllOverlays(isOverlay ? tab : null);

  // Sync mobile nav highlight
  syncMobileNav(tab);

  if(tab==='chats'||tab==='home'){
    setActiveOverlay(null);
    navClear(); // reset stack when going home
    openDrawer();
    var ds=document.getElementById('drawerScroll');
    if(ds)ds.scrollTop=0;
  }
  else if(tab==='chat'){
    setActiveOverlay(null);
    closeDrawer();
  }
  else if(tab==='trade'){
    closeDrawer();
    setActiveOverlay('trade');
    if(typeof window.openTradingPage==='function')window.openTradingPage(true); // silent=true
  }
  else if(tab==='leaderboard'){
    closeDrawer();
    setActiveOverlay('leaderboard');
    if(typeof window.openLeaderPage==='function')window.openLeaderPage();
  }
  else if(tab==='profile'){
    closeDrawer();
    setActiveOverlay('profile');
    if(typeof window.openProfilePopup==='function'&&ME)window.openProfilePopup(ME);
  }
  else if(tab==='settings'){
    closeDrawer();
    setActiveOverlay('settings');
    if(typeof window.openSettings==='function')window.openSettings();
  }
  // Legacy
  else if(tab==='stocks'){
    closeDrawer();
    setActiveOverlay('stocks');
    openStocksPanel();
  }
  else if(tab==='members'){
    closeDrawer();
    if(typeof window.mobileToggleMembers==='function')window.mobileToggleMembers();
  }
}
