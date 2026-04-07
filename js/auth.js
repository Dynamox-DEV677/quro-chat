import { sb } from './config.js';
import { ME, setME, chatMode, setChatMode, curDMUser, setCurDMUser, appMode, setAppMode, regPhotoB64, setRegPhotoB64, realtimeSub, setRealtimeSub, _pendingInvite } from './state.js';
import { escH, showLoading, setAvatarEl, applyUserBarDecor, notify } from './utils.js';
import { updateSidebarToggleIcon, goHome, closeDrawer } from './navigation.js';
import { fetchUsers, updatePresence, buildMembers } from './members.js';
import { buildDMList, fetchDMLastMessages } from './dm.js';
import { loadGroupChats } from './groupchat.js';
import { loadServersIntoBar, showInviteModal } from './servers.js';
import { fetchMyMsgCount, _stopPoll } from './messaging.js';
import { subscribeGlobalMessages } from './notifications.js';
import { _subscribeCallSignals } from './calls-incoming.js';
import { _subscribeServerVCNotifications } from './channels.js';
import { initDragDrop } from './drag-drop.js';
import { closeSettings } from './settings.js';
import { initAdmin, hideAdmin, checkBanned, showBannedScreen } from './admin.js';
import { stopAuthBubbles, startAuthBubbles } from './auth-bubbles.js';
import { qConfirm } from './modal.js';

var _presenceInt=null;
var _dataRefreshInt=null;

export function authErr(m){const e=document.getElementById('authErr');e.textContent=m;e.classList.add('show');document.getElementById('authOk').classList.remove('show');setTimeout(()=>e.classList.remove('show'),6000);}

export function authOk(m){const e=document.getElementById('authOk');e.textContent=m;e.classList.add('show');document.getElementById('authErr').classList.remove('show');setTimeout(()=>e.classList.remove('show'),5000);}

export function clearAuth(){document.getElementById('authErr').classList.remove('show');document.getElementById('authOk').classList.remove('show');}

export function updateRegLetter(){}

export async function doRegister(){
  const username=document.getElementById('authUser').value.trim().toLowerCase(),pass=document.getElementById('authPass').value;
  const btn=document.getElementById('registerBtn');
  if(!username||!pass){authErr('Enter a username and password.');return;}
  if(username.length<2){authErr('Username must be at least 2 characters.');return;}
  if(!/^[a-z0-9_]+$/.test(username)){authErr('Username: letters, numbers, underscores only.');return;}
  if(pass.length<6){authErr('Password must be at least 6 characters.');return;}
  btn.disabled=true;btn.textContent='Creating\u2026';showLoading(true);
  const email=username+'@quro.local';
  try{
    const{data:upData,error:upErr}=await sb.auth.signUp({email,password:pass,options:{data:{username,avatar:username.charAt(0).toUpperCase()}}});
    if(upErr){if(upErr.message?.toLowerCase().includes('already registered'))throw new Error('Username already taken.');throw upErr;}
    const{data:siData,error:siErr}=await sb.auth.signInWithPassword({email,password:pass});
    if(siErr) throw siErr;
    await sb.from('profiles').upsert({id:siData.user.id,username,avatar:username.charAt(0).toUpperCase(),photo:null});
    authOk('Account created!');btn.textContent='\u2713';
    setTimeout(async()=>{btn.disabled=false;btn.textContent='Create Account';await loadAndEnterApp(siData.user);await initAdmin();},800);
  }catch(err){showLoading(false);btn.disabled=false;btn.textContent='Create Account';authErr(err.message||'Sign up failed.');}
}

export async function doLogin(){
  const username=document.getElementById('authUser').value.trim().toLowerCase(),pass=document.getElementById('authPass').value;
  const btn=document.getElementById('loginBtn');
  if(!username||!pass){authErr('Enter your username and password.');return;}
  btn.disabled=true;btn.textContent='Signing in\u2026';showLoading(true);
  const email=username+'@quro.local';
  try{
    const{data,error}=await sb.auth.signInWithPassword({email,password:pass});
    if(error) throw error;
    btn.disabled=false;btn.textContent='Sign In';await loadAndEnterApp(data.user);await initAdmin();
  }catch(err){showLoading(false);btn.disabled=false;btn.textContent='Sign In';authErr(err.message?.includes('Invalid login')?'Wrong username or password.':err.message||'Login failed.');}
}

export async function loadAndEnterApp(authUser){
  try{
    const{data:prof}=await sb.from('profiles').select('*').eq('id',authUser.id).single();
    const uname=prof?.username||authUser.user_metadata?.username||authUser.email.split('@')[0];
    setME({id:authUser.id,email:authUser.email,username:uname,avatar:prof?.avatar||uname.charAt(0).toUpperCase(),photo:prof?.photo||'',name_font:prof?.name_font||'default',name_color:prof?.name_color||'',nameplate:prof?.nameplate||'',about:prof?.about||'',banner:prof?.banner||'b1',contact_email:prof?.contact_email||'',decor:prof?.decor||'none'});
    showLoading(false);initApp();
  }catch(e){
    showLoading(false);
    try{await sb.auth.signOut({scope:'local'});}catch(ex){/* cleanup */}
    const auth=document.getElementById('authScreen');auth.style.display='flex';auth.style.opacity='1';
  }
}

export async function initApp(){
  ['myAvatarBtn','drawerAvatarBtn'].forEach((id,i)=>setAvatarEl(id,ME.avatar,ME.photo,['myAvatarLetter','drawerAvatarLetter'][i]));
  setAvatarEl('spAvatarBtn',ME.avatar,ME.photo,'spAvatarLetter');
  applyUserBarDecor();
  updateSidebarToggleIcon();
  ['myName','drawerMyName'].forEach(id=>{var el=document.getElementById(id);el.textContent=ME.username;el.className='u-name nf-'+(ME.name_font||'default');});
  var spN=document.getElementById('spName');spN.textContent=ME.username;spN.className='sp-av-name nf-'+(ME.name_font||'default');
  document.getElementById('spEmail').textContent='@'+ME.username;
  await fetchUsers();await fetchDMLastMessages();buildDMList();buildMembers();loadGroupChats();
  await loadServersIntoBar();
  fetchMyMsgCount();
  updatePresence();
  // Presence + data refresh intervals (saved so they can be stopped on logout)
  if(_presenceInt)clearInterval(_presenceInt);
  if(_dataRefreshInt)clearInterval(_dataRefreshInt);
  _presenceInt=setInterval(function(){if(!navigator.onLine)return;updatePresence();},30000);
  _dataRefreshInt=setInterval(async function(){
    if(!navigator.onLine)return;
    try{await fetchUsers();await fetchDMLastMessages();buildDMList();buildMembers();loadGroupChats();}
    catch(e){console.warn('[Quro] refresh cycle failed:',e.message);}
  },30000);
  subscribeGlobalMessages();
  _subscribeCallSignals();
  _subscribeServerVCNotifications();
  stopAuthBubbles();
  const auth=document.getElementById('authScreen');
  auth.style.transition='opacity .3s';auth.style.opacity='0';
  setTimeout(()=>{auth.style.display='none';document.getElementById('appScreen').classList.add('visible');goHome();initDragDrop();notify('Welcome, '+ME.username+'!','success');if(_pendingInvite)setTimeout(showInviteModal,500);},320);
}

export async function doLogout(){
  var ok=await qConfirm('Sign out','Are you sure you want to sign out?',{confirmText:'Sign Out'});if(!ok)return;
  _stopPoll();
  if(_presenceInt){clearInterval(_presenceInt);_presenceInt=null;}
  if(_dataRefreshInt){clearInterval(_dataRefreshInt);_dataRefreshInt=null;}
  if(realtimeSub){try{await sb.removeChannel(realtimeSub);}catch(e){/* cleanup */}setRealtimeSub(null);}
  try{await sb.auth.signOut({scope:'local'});}catch(e){/* cleanup */}setME(null);setChatMode('channel');setCurDMUser(null);setAppMode('home');
  hideAdmin();closeSettings();closeDrawer();
  try{document.getElementById('authUser').value='';document.getElementById('authPass').value='';}catch(e){/* DOM element may not exist */}
  setRegPhotoB64('');
  document.getElementById('appScreen').classList.remove('visible');
  document.getElementById('srvList').innerHTML='';
  var auth=document.getElementById('authScreen');auth.style.opacity='0';auth.style.display='flex';
  startAuthBubbles();
  requestAnimationFrame(function(){auth.style.transition='opacity .3s';auth.style.opacity='1';});
  notify('Signed out!','info');
}
