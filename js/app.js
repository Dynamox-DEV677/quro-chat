// ═══ Quro — App Entry Point ═══
// Imports all modules and exposes functions to window for onclick handlers

import { initErrorHandler } from './error-handler.js';
import { sb, EMOJIS } from './config.js';
import * as State from './state.js';
import { escH, getMsgKey, showLoading, isMobile, setAvatarEl, stk_fmtIN, applyUserBarDecor, getDecorCls, notify } from './utils.js';
import { authErr, authOk, clearAuth, updateRegLetter, doRegister, doLogin, loadAndEnterApp, initApp, doLogout } from './auth.js';
import { openDrawer, closeDrawer, syncDrawer, handleSidebarToggle, updateSidebarToggleIcon, goHome, mobileNavTo } from './navigation.js';
import { loadServersIntoBar, openServerBrowser, closeServerBrowser, srvBrowserOverlayClick, loadAllServers, joinServer, createServer, pickServer, pickServerById, addServer, checkServerOwnership, openServerSettings, closeServerSettings, saveServerSettings, uploadServerIcon, copyInviteLink, leaveServer, checkInviteLink, showInviteModal, closeInviteModal } from './servers.js';
import { loadServerChannels, openChannel, addChannel, closeAddChModal, selChType, confirmAddChannel, joinVoiceChannel, leaveVoiceChannel } from './channels.js';
import { _stopPoll, subscribeAndRender, fetchAndRenderMessages, appendMessage, fetchMyMsgCount, sendMsg, inputKey, growInput, renderMsgContent, _plainText, searchMsgs, openSearch, closeSearch, scrollToMsg } from './messaging.js';
import { fetchDMLastMessages, buildDMList, openDM, startNewDM, openUserSearch, closeUserSearch, userSearchOverlayClick, searchUsers, renderUSResults, selectUserForDM } from './dm.js';
import { loadGroupChats, renderGCList, openGroupChat, openGCCreate, closeGCCreate, gcSearchMembers, gcToggleUser, gcRemoveUser, gcUpdateTags, createGroupChat, openGCSettings, closeGCSettings, gcsRenderMembers, gcsSaveName, gcsUploadIcon, gcsClearIcon, gcsRemoveMember } from './groupchat.js';
import { fetchUsers, updatePresence, buildMembers, toggleMembers, mobileToggleMembers, openMobileMembers, closeMobileMembers } from './members.js';
import { startCall, endCall, _cleanupCall, _setupCallUI } from './calls.js';
import { _gcCleanup } from './calls-gc.js';
import { _subscribeCallSignals, acceptIncoming, declineIncoming } from './calls-incoming.js';
import { toggleMute, toggleCallVideo, toggleSpeaker, toggleScreenShare, stopScreenShare, minimizeCall, reopenCall } from './calls-controls.js';
import { openSettings, closeSettings, spNavTo, spShowNav, toggleDarkMode, changePassword, toggleNotifSound, toggleNotifDesktop, requestNotifPermission } from './settings.js';
import { saveNameplate, saveAbout, buildBannerGrid, saveBanner, getBannerStyle, uploadBannerImage, openProfilePopup, closeProfilePopup, syncFontPicker, pickFont, saveNameFont, buildColorGrid, syncColorPicker, pickColor, saveNameColor, buildDecorGrid, selectDecor, saveDecor, pickProfilePic, applyProfilePic, saveContactEmail, unlinkEmail, syncEmailSection } from './profile.js';
import { playNotifSound, showDesktopNotif, updateServerBadge, clearServerUnread, clearDMUnread, clearGCUnread, subscribeGlobalMessages } from './notifications.js';
import { _clearTypingChannel, _setupTypingChannel, _renderTyping, _onInputTyping } from './typing.js';
import { setReply, clearReply, editMsg, deleteMsg, showReactPicker, closeReactPicker, doReact, renderMsgReactions } from './reactions.js';
import { openEmoji, closeEmoji, emojiOverlayClick, insertEmoji } from './emoji.js';
import { handleFileUpload } from './file-upload.js';
import { initDragDrop } from './drag-drop.js';
import { openFriendsPage, closeFriendsPage, fpSwitchTab, fpRender, fpOpenDM } from './friends.js';
import { openLeaderPage, closeLeaderPage, loadLeaderboard } from './leaderboard.js';
import { openStocksPanel, closeStocksPanel, stk_showDetail, closeStkDetail, changeStkRange, changeStkInterval, stkFilter, stkToggleSearch, stkSearchFilter, mobileOpenStocks, stk_startLiveRefresh } from './stocks.js';
import { openTradingPage, closeTradingPage, trd_execute, trd_select, trd_setTab, trd_setMax, trd_setQty, trd_showBottom, trd_filterWatch, trd_updateOrder, trd_resetPortfolio, closeTrdConfirm, confirmTrdExec } from './trading.js';
import { initSplash } from './splash.js';
import { startAuthBubbles, stopAuthBubbles } from './auth-bubbles.js';
import { qConfirm, qPrompt, qAlert } from './modal.js';
import { isAdmin, initAdmin, adminSearchUsers, adminKickUser, adminUnbanUser, checkBanned, showBannedScreen } from './admin.js';

// ═══ Expose all onclick/onchange/oninput/onkeydown functions to window ═══
// This is needed because HTML uses inline event handlers (onclick="fn()")
// In Phase 2, these will be replaced with addEventListener

Object.assign(window, {
  // Auth
  doLogin, doRegister, doLogout, updateRegLetter,
  // Navigation
  goHome, closeDrawer, handleSidebarToggle, mobileNavTo,
  // Servers
  openServerBrowser, closeServerBrowser, srvBrowserOverlayClick,
  joinServer, createServer, addServer,
  openServerSettings, closeServerSettings, saveServerSettings,
  uploadServerIcon, copyInviteLink, leaveServer,
  showInviteModal, closeInviteModal,
  // Channels
  openChannel, addChannel, closeAddChModal, selChType, confirmAddChannel,
  // Messages
  sendMsg, inputKey, growInput, searchMsgs, openSearch, closeSearch, scrollToMsg,
  // DM
  startNewDM, openUserSearch, closeUserSearch, userSearchOverlayClick,
  searchUsers, selectUserForDM,
  // Group Chat
  openGCCreate, closeGCCreate, gcSearchMembers, createGroupChat,
  openGCSettings, closeGCSettings, gcsSaveName, gcsUploadIcon, gcsClearIcon, gcsRemoveMember,
  // Members
  toggleMembers, mobileToggleMembers, closeMobileMembers,
  // Calls
  startCall, endCall, acceptIncoming, declineIncoming,
  toggleMute, toggleCallVideo, toggleSpeaker, toggleScreenShare, minimizeCall, reopenCall,
  // Settings
  openSettings, closeSettings, spNavTo, spShowNav,
  toggleDarkMode, changePassword,
  toggleNotifSound, toggleNotifDesktop, requestNotifPermission,
  // Profile
  saveNameplate, saveAbout, saveBanner, uploadBannerImage,
  openProfilePopup, closeProfilePopup,
  pickFont, saveNameFont, pickColor, saveNameColor,
  selectDecor, saveDecor, pickProfilePic, applyProfilePic,
  saveContactEmail, unlinkEmail,
  // Notifications
  notify,
  // Typing
  _onInputTyping,
  // Reactions
  setReply, clearReply, editMsg, deleteMsg,
  showReactPicker, closeReactPicker, doReact,
  // Emoji
  openEmoji, closeEmoji, emojiOverlayClick, insertEmoji,
  // File Upload
  handleFileUpload,
  // Friends
  openFriendsPage, closeFriendsPage, fpSwitchTab, fpRender,
  // Leaderboard
  openLeaderPage, closeLeaderPage, loadLeaderboard,
  // Stocks
  openStocksPanel, closeStocksPanel, stk_showDetail, closeStkDetail,
  changeStkRange, changeStkInterval, stkFilter, stkToggleSearch, stkSearchFilter, mobileOpenStocks,
  // Trading
  openTradingPage, closeTradingPage, trd_execute, trd_select,
  trd_setTab, trd_setMax, trd_setQty, trd_showBottom,
  trd_filterWatch, trd_updateOrder, trd_resetPortfolio,
  closeTrdConfirm, confirmTrdExec,
  // Modal
  qConfirm, qPrompt, qAlert,
  // Admin
  adminSearchUsers, adminKickUser, adminUnbanUser,
  // Shared utils needed by inline handlers
  escH, getMsgKey, isMobile, setAvatarEl, showLoading,
  // State access (for inline handlers that check state)
  get ME() { return State.ME; },
  get chatMode() { return State.chatMode; },
  get curChannel() { return State.curChannel; },
  get curServer() { return State.curServer; },
  get curDMUser() { return State.curDMUser; },
  get curGroupChat() { return State.curGroupChat; },
  get appMode() { return State.appMode; },
  get callActive() { return State.callActive; },
  get REAL_USERS() { return State.REAL_USERS; },
  get replyTo() { return State.replyTo; },
  get EMOJIS() { return EMOJIS; },
});

// ═══ Favicon generation ═══
(function(){
  var img=new Image();
  img.onload=function(){
    var tc=document.createElement('canvas');
    tc.width=img.naturalWidth;tc.height=img.naturalHeight;
    var tctx=tc.getContext('2d');
    tctx.drawImage(img,0,0);
    var d=tctx.getImageData(0,0,tc.width,tc.height).data;
    var top=tc.height,left=tc.width,bottom=0,right=0;
    for(var y=0;y<tc.height;y++){for(var x=0;x<tc.width;x++){if(d[(y*tc.width+x)*4+3]>20){if(y<top)top=y;if(y>bottom)bottom=y;if(x<left)left=x;if(x>right)right=x;}}}
    if(bottom<=top){left=0;top=0;right=tc.width;bottom=tc.height;}
    var cw=right-left+1,ch=bottom-top+1;
    var c=document.createElement('canvas');c.width=64;c.height=64;
    var ctx=c.getContext('2d');
    var pad=4,sz=64-pad*2;
    var scale=Math.min(sz/cw,sz/ch);
    var dw=cw*scale,dh=ch*scale;
    ctx.drawImage(img,left,top,cw,ch,(64-dw)/2,(64-dh)/2,dw,dh);
    document.getElementById('favicon').href=c.toDataURL('image/png');
  };
  img.src='huddleicon.png';
})();

// ═══ Service Worker Registration ═══
var _swReloading = false;
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js').then(function(reg){
    // Check for updates every 60s (not immediately — let page settle first)
    setTimeout(function(){ reg.update(); }, 5000);
    setInterval(function(){ reg.update(); }, 60000);
    reg.onupdatefound=function(){
      var w=reg.installing;
      if(!w) return;
      w.onstatechange=function(){
        if(w.state==='activated' && !_swReloading){
          _swReloading = true;
          // Mark that next load should skip splash
          try { sessionStorage.setItem('quro_sw_reload','1'); } catch(e){}
          window.location.reload();
        }
      };
    };
  }).catch(function(){});
  // Listen for controller change (new SW took over) — single reload guard
  navigator.serviceWorker.addEventListener('controllerchange', function(){
    if(!_swReloading){
      _swReloading = true;
      try { sessionStorage.setItem('quro_sw_reload','1'); } catch(e){}
      window.location.reload();
    }
  });
}

// ═══ Boot ═══
// Show splash intro, then check session
(async function boot() {
  initErrorHandler();

  // If this is a SW-triggered reload, skip the splash entirely
  var _skipSplash = false;
  try {
    if (sessionStorage.getItem('quro_sw_reload')) {
      sessionStorage.removeItem('quro_sw_reload');
      _skipSplash = true;
    }
  } catch(e) {}

  function hideSplashNow() {
    var sp = document.getElementById('splashScreen');
    if (sp) {
      sp.style.transition = 'opacity .4s ease';
      sp.style.opacity = '0';
      setTimeout(function() { sp.classList.add('hidden'); sp.style.display = 'none'; }, 450);
    }
  }

  if (_skipSplash) {
    // SW reload — hide splash instantly, no animation
    var sp = document.getElementById('splashScreen');
    if (sp) { sp.classList.add('hidden'); sp.style.display = 'none'; }
  } else {
    initSplash();
  }
  startAuthBubbles();

  // Safety: force splash away after 10s no matter what
  var _splashTimeout = setTimeout(function() {
    var sp = document.getElementById('splashScreen');
    if (sp && !sp.classList.contains('hidden')) {
      hideSplashNow();
      showLoading(false);
    }
  }, 10000);

  // Check session in background while splash plays
  try {
    var { data: { session } } = await sb.auth.getSession();
    clearTimeout(_splashTimeout);
    if (session && session.user) {
      // User is logged in — hide splash quickly and load app
      hideSplashNow();
      stopAuthBubbles();
      await loadAndEnterApp(session.user);
      // Check if user is banned
      var banned = await checkBanned();
      if (banned) {
        showBannedScreen();
        // Expose signout for banned screen button
        window.bannedSignOut = async function() {
          try { await sb.auth.signOut(); } catch(e) {}
          window.location.reload();
        };
        return;
      }
      // Init admin panel if user is Dynamox
      initAdmin();
      initDragDrop();
    } else {
      showLoading(false);
      // Splash will reveal auth screen when its animation finishes (or skip if SW reload)
      if (_skipSplash) {
        var auth = document.getElementById('authScreen');
        if (auth) { auth.style.display = 'flex'; auth.style.opacity = '1'; }
      }
    }
  } catch(bootErr) {
    clearTimeout(_splashTimeout);
    console.warn('[Quro] Session check failed:', bootErr.message);
    try { await sb.auth.signOut({ scope: 'local' }); } catch(e) {}
    hideSplashNow();
    showLoading(false);
    // Show auth screen on failure
    var auth = document.getElementById('authScreen');
    if (auth) { auth.style.display = 'flex'; auth.style.opacity = '1'; }
  }
})();
