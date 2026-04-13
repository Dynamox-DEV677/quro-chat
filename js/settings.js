// ═══ SETTINGS PANEL ═══
import { sb } from './config.js?v=49';
import { ME, notifSound, setNotifSound, notifDesktop, setNotifDesktop } from './state.js?v=49';
import { isMobile, setAvatarEl, notify } from './utils.js?v=49';
import { closeDrawer } from './navigation.js?v=49';
import { syncFontPicker, buildColorGrid, syncColorPicker, buildBannerGrid, buildDecorGrid, selectDecor, syncEmailSection, set_spSelectedFont, set_spSelectedColor, set_spSelectedBanner, set_spSelectedDecor, getBannerStyle } from './profile.js?v=49';

export function openSettings(){
  closeDrawer();
  setAvatarEl('spAvatarBtn',ME.avatar,ME.photo||'','spAvatarLetter');
  var spN=document.getElementById('spName');
  spN.textContent=ME.username;
  spN.className='sp-av-name nf-'+(ME.name_font||'default');
  document.getElementById('spEmail').textContent='@'+ME.username;
  document.getElementById('spNameplate').value=ME.nameplate||'';
  document.getElementById('spAbout').value=ME.about||'';
  var isDark=document.documentElement.getAttribute('data-theme')!=='light';
  document.getElementById('darkModeToggle').classList.toggle('on',isDark);
  ['spCurPwd','spNewPwd','spConfPwd'].forEach(function(id){document.getElementById(id).value='';});
  var m=document.getElementById('spPwdMsg');
  m.style.display='none';m.className='sp-pwd-msg';
  set_spSelectedFont(ME.name_font||'default');
  syncFontPicker();
  set_spSelectedColor(ME.name_color||'');
  buildColorGrid();
  syncColorPicker();
  set_spSelectedBanner(ME.banner||'b1');
  buildBannerGrid();
  var bannerEl=document.getElementById('spProfileBanner');
  if(bannerEl)bannerEl.style.background=getBannerStyle(ME.banner||'b1');
  document.getElementById('notifSoundToggle').classList.toggle('on',notifSound);
  document.getElementById('notifDesktopToggle').classList.toggle('on',notifDesktop);
  syncNotifBtn();
  syncEmailSection();
  set_spSelectedDecor(ME.decor||'none');
  buildDecorGrid();
  selectDecor(ME.decor||'none');
  setAvatarEl('spDecorPreview',ME.avatar,ME.photo||'','spDecorLetter');
  var sp=document.getElementById('settingsPanel');
  if(isMobile()){sp.classList.add('sp-nav-mode');}else{sp.classList.remove('sp-nav-mode');}
  document.querySelectorAll('#spNav .sp-nav-item').forEach(function(n,i){n.classList.toggle('active',i===0);});
  document.getElementById('spHeadTitle').textContent='My Account';
  var wrap=document.querySelector('.sp-content-wrap');
  if(wrap)wrap.scrollTop=0;
  sp.classList.add('open');
}

export function closeSettings(){
  ['spCurPwd','spNewPwd','spConfPwd'].forEach(function(id){document.getElementById(id).value='';});
  var m=document.getElementById('spPwdMsg');
  m.style.display='none';m.className='sp-pwd-msg';
  var sp=document.getElementById('settingsPanel');
  sp.classList.remove('open');sp.classList.add('sp-nav-mode');
}

export var _spNavTitles={
  spSecProfile:'My Account',
  spSecNameplate:'Nameplate',
  spSecAbout:'About Me',
  spSecNameStyle:'Name Style',
  spSecNameColor:'Name Color',
  spSecDecor:'Avatar Decor',
  spSecBanner:'Profile Banner',
  spSecAppearance:'Appearance',
  spSecNotif:'Notifications',
  spSecEmail:'Email',
  spSecPassword:'Change Password',
  spSecAdmin:'User Management'
};

export function spNavTo(el){
  var sec=el.dataset.section;if(!sec)return;
  document.querySelectorAll('#spNav .sp-nav-item').forEach(function(n){n.classList.remove('active');});
  el.classList.add('active');
  document.getElementById('spHeadTitle').textContent=_spNavTitles[sec]||'Settings';
  if(isMobile()){document.getElementById('settingsPanel').classList.remove('sp-nav-mode');}
  var target=document.getElementById(sec);
  if(target){var wrap=document.querySelector('.sp-content-wrap');if(wrap)wrap.scrollTop=target.offsetTop;}
}

export function spShowNav(){document.getElementById('settingsPanel').classList.add('sp-nav-mode');}

// Scroll spy IIFE
(function(){
  var wrap=null;
  function spScrollSpy(){
    if(!wrap)wrap=document.querySelector('.sp-content-wrap');
    if(!wrap||isMobile())return;
    var body=document.getElementById('spBody');if(!body)return;
    var anchors=body.querySelectorAll('.sp-section-anchor');
    var current='';var scrollTop=wrap.scrollTop;
    anchors.forEach(function(a){if(a.offsetTop<=scrollTop+60)current=a.id;});
    if(!current&&anchors.length)current=anchors[0].id;
    document.querySelectorAll('#spNav .sp-nav-item').forEach(function(n){
      n.classList.toggle('active',n.dataset.section===current);
    });
    if(current)document.getElementById('spHeadTitle').textContent=_spNavTitles[current]||'Settings';
  }
  setTimeout(function(){
    wrap=document.querySelector('.sp-content-wrap');
    if(wrap)wrap.addEventListener('scroll',spScrollSpy,{passive:true});
  },500);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){var sp=document.getElementById('settingsPanel');if(sp&&sp.classList.contains('open'))closeSettings();}});
})();

export function toggleDarkMode(){
  var el=document.getElementById('darkModeToggle');
  var isCurrentlyDark=document.documentElement.getAttribute('data-theme')!=='light';
  if(isCurrentlyDark){
    document.documentElement.setAttribute('data-theme','light');
    localStorage.setItem('quro-theme','light');
    var tc=document.querySelector('meta[name="theme-color"]');if(tc)tc.content='#f5f5f5';
    el.classList.remove('on');
  }else{
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('quro-theme','dark');
    var tc=document.querySelector('meta[name="theme-color"]');if(tc)tc.content='#080808';
    el.classList.add('on');
  }
}

export async function changePassword(){
  var curPwd=document.getElementById('spCurPwd').value;
  var newPwd=document.getElementById('spNewPwd').value;
  var confPwd=document.getElementById('spConfPwd').value;
  var msgEl=document.getElementById('spPwdMsg');
  var btn=document.getElementById('spPwdBtn');
  msgEl.style.display='none';msgEl.className='sp-pwd-msg';
  function showErr(m){msgEl.textContent=m;msgEl.classList.add('err');msgEl.style.display='block';}
  function showOk(m){msgEl.textContent=m;msgEl.classList.add('ok');msgEl.style.display='block';}
  if(!curPwd||!newPwd||!confPwd){showErr('Please fill in all fields.');return;}
  if(newPwd.length<6){showErr('New password must be at least 6 characters.');return;}
  if(newPwd!==confPwd){showErr('New passwords do not match.');return;}
  if(curPwd===newPwd){showErr('New password must be different from current.');return;}
  btn.disabled=true;btn.textContent='Updating…';
  try{
    var email=ME.email;
    var r=await sb.auth.signInWithPassword({email:email,password:curPwd});
    if(r.error)throw new Error('Current password is incorrect.');
    var u=await sb.auth.updateUser({password:newPwd});
    if(u.error)throw u.error;
    showOk('Password updated successfully!');
    document.getElementById('spCurPwd').value='';
    document.getElementById('spNewPwd').value='';
    document.getElementById('spConfPwd').value='';
  }catch(err){showErr(err.message||'Failed to update password.');}
  finally{btn.disabled=false;btn.textContent='Update Password';}
}

export function toggleNotifSound(){
  setNotifSound(!notifSound);
  localStorage.setItem('quro-notif-sound',notifSound?'on':'off');
  document.getElementById('notifSoundToggle').classList.toggle('on',notifSound);
}

export function toggleNotifDesktop(){
  setNotifDesktop(!notifDesktop);
  localStorage.setItem('quro-notif-desktop',notifDesktop?'on':'off');
  document.getElementById('notifDesktopToggle').classList.toggle('on',notifDesktop);
}

export function requestNotifPermission(){
  if(!('Notification' in window)){notify('Browser does not support notifications','error');return;}
  if(Notification.permission==='granted'){notify('Notifications already enabled!','success');return;}
  Notification.requestPermission().then(function(perm){
    if(perm==='granted'){notify('Notifications enabled!','success');syncNotifBtn();}
    else{notify('Notification permission denied','error');}
  });
}

export function syncNotifBtn(){
  var btn=document.getElementById('notifPermBtn');if(!btn)return;
  if('Notification' in window && Notification.permission==='granted'){
    btn.textContent='Notifications Enabled';btn.classList.add('granted');
  }else{
    btn.textContent='Enable Browser Notifications';btn.classList.remove('granted');
  }
}
