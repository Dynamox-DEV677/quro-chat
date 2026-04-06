// channels.js -- Channel rendering, voice/video channels, add channel modal
// Extracted from index.html — do not modify logic

import { sb } from './config.js';
import {
  ME,
  curServer,
  curChannel, setCurChannel,
  chatMode, setChatMode,
  curGroupChat, setCurGroupChat,
  callActive, setCallActive,
  isMuted, setIsMuted,
  isCamOff, setIsCamOff,
  isSpeakerOn, setIsSpeakerOn,
  membersOpen, setMembersOpen,
  _callType, set_callType,
  callSecs, setCallSecs,
  _callState, set_callState,
  _gcCall, set_gcCall,
  _gcCallId, set_gcCallId,
  _gcCallMembers, set_gcCallMembers,
  _callTarget, set_callTarget,
  _gcSignalChannel
} from './state.js';
import { escH, isMobile, notify } from './utils.js';
import { subscribeAndRender } from './messaging.js';
import { closeMobileMembers } from './members.js';
import { playNotifSound, showDesktopNotif } from './notifications.js';
import { closeDrawer, updateSidebarToggleIcon } from './navigation.js';
import { _setupCallUI, _cleanupCall } from './calls.js';
import { _setupGCSignaling, _gcBuildGrid, _gcCleanup } from './calls-gc.js';
import { _curServerData } from './servers.js';

// ─── VC state ───
export var _vcPresenceChannels={};  // {channelName: supabaseChannel} for VC presence
export var _vcUsers={};             // {channelName: [{id,username,photo,avatar}]}
export var _currentVC=null;         // name of VC we're currently in (or null)
export var _serverChannelsList=[];  // cached channel list for current server

// ─── SVG icon constants ───
export var _svgHashIcon='<svg class="ch-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>';
export var _svgVoiceIcon='<svg class="ch-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
export var _svgVideoChIcon='<svg class="ch-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>';

// ─── Server VC notification channels ───
var _srvNotifChannels=[];

export async function loadServerChannels(serverId){
  var items=document.getElementById('channelItems'),dItems=document.getElementById('drawerChannelItems');
  items.innerHTML='<div style="padding:10px 12px;font-size:12px;color:rgba(255,255,255,.3)">Loading\u2026</div>';
  if(dItems)dItems.innerHTML='';
  // Clean up old VC presence subscriptions
  Object.keys(_vcPresenceChannels).forEach(function(k){
    try{sb.removeChannel(_vcPresenceChannels[k]);}catch(e){/* cleanup */}
  });
  _vcPresenceChannels={};_vcUsers={};
  var res=await sb.from('channels').select('*').eq('server_id',serverId).order('position');
  var channels=(res.data||[]);
  if(!channels.length){
    channels=[{name:'general',type:'text'}];
  }
  _serverChannelsList=channels;
  items.innerHTML='';if(dItems)dItems.innerHTML='';
  var firstText=null;
  channels.forEach(function(ch){
    var chType=ch.type||'text';
    if(chType==='text'){
      if(!firstText)firstText=ch.name;
      _renderTextChannel(ch,items,dItems);
    }else{
      _renderVoiceVideoChannel(ch,chType,items,dItems);
    }
  });
  if(firstText)openChannel(firstText);
}

export function _renderTextChannel(ch,items,dItems){
  function makeEl(container,onclick){
    var el=document.createElement('div');el.className='ch-item';el.dataset.chname=ch.name;el.dataset.chtype='text';
    el.innerHTML=_svgHashIcon+'<span>'+escH(ch.name)+'</span>';
    el.onclick=onclick;container.appendChild(el);
  }
  makeEl(items,function(){openChannel(ch.name);});
  if(dItems)makeEl(dItems,function(){openChannelAndClose(ch.name);});
}

function openChannelAndClose(name){openChannel(name);closeDrawer();}

export function _renderVoiceVideoChannel(ch,chType,items,dItems){
  var icon=chType==='voice'?_svgVoiceIcon:_svgVideoChIcon;
  function makeBlock(container,isDrawer){
    var wrap=document.createElement('div');wrap.dataset.vcblock=ch.name;
    var el=document.createElement('div');el.className='ch-item';el.dataset.chname=ch.name;el.dataset.chtype=chType;
    el.innerHTML=icon+'<span>'+escH(ch.name)+'</span>';
    el.onclick=function(){
      if(isDrawer)closeDrawer();
      joinVoiceChannel(ch.name,chType);
    };
    wrap.appendChild(el);
    // Users container
    var usersDiv=document.createElement('div');usersDiv.className='vc-users';usersDiv.id=(isDrawer?'drawer-':'')+'vc-users-'+ch.name;
    wrap.appendChild(usersDiv);
    container.appendChild(wrap);
  }
  makeBlock(items,false);
  if(dItems)makeBlock(dItems,true);
  // Subscribe to presence for this VC
  _subscribeVCPresence(ch.name);
}

export function _subscribeVCPresence(chName){
  if(_vcPresenceChannels[chName])return;
  var presKey='vc-presence-'+curServer+'-'+chName;
  var channel=sb.channel(presKey,{config:{presence:{key:ME.id}}});
  _vcPresenceChannels[chName]=channel;
  _vcUsers[chName]=[];

  channel.on('presence',{event:'sync'},function(){
    var state=channel.presenceState();
    var users=[];
    Object.keys(state).forEach(function(key){
      var presences=state[key];
      if(presences&&presences.length>0){
        users.push(presences[0]);
      }
    });
    _vcUsers[chName]=users;
    _renderVCUsers(chName);
  });

  channel.subscribe(function(status){
    if(status==='SUBSCRIBED'){
      // If we're currently in this VC, track our presence
      if(_currentVC===chName){
        channel.track({id:ME.id,username:ME.username,photo:ME.photo||'',avatar:ME.avatar||ME.username.charAt(0).toUpperCase(),name_font:ME.name_font||'default',decor:ME.decor||'none'});
      }
    }
  });
}

export function _renderVCUsers(chName){
  var users=_vcUsers[chName]||[];
  ['','drawer-'].forEach(function(prefix){
    var container=document.getElementById(prefix+'vc-users-'+chName);
    if(!container)return;
    container.innerHTML='';
    if(!users.length)return;
    // Show "Connected" label
    var label=document.createElement('div');label.className='vc-connected';
    label.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="5" fill="currentColor" stroke="none"/></svg> '+users.length+' connected';
    container.appendChild(label);
    // Show user avatars
    var avRow=document.createElement('div');avRow.style.cssText='display:flex;flex-wrap:wrap;gap:5px;margin-top:2px';
    users.forEach(function(u){
      var av=document.createElement('div');av.className='vc-user-av';av.title=u.username||'User';
      if(u.photo){
        av.innerHTML='<img src="'+escH(u.photo)+'">';
      }else{
        av.innerHTML='<span class="vc-av-letter">'+escH(u.avatar||(u.username||'?').charAt(0).toUpperCase())+'</span>';
      }
      avRow.appendChild(av);
    });
    container.appendChild(avRow);
  });
}

export async function joinVoiceChannel(chName,chType){
  // If already in this VC, leave it
  if(_currentVC===chName){
    leaveVoiceChannel();
    return;
  }
  // If in a different VC, leave it first
  if(_currentVC){
    leaveVoiceChannel();
  }
  // If in a call already, block
  if(callActive){notify('Already in a call \u2014 hang up first','error');return;}

  _currentVC=chName;
  // Track presence
  var presCh=_vcPresenceChannels[chName];
  if(presCh){
    presCh.track({id:ME.id,username:ME.username,photo:ME.photo||'',avatar:ME.avatar||ME.username.charAt(0).toUpperCase(),name_font:ME.name_font||'default',decor:ME.decor||'none'});
  }
  // Highlight the channel
  document.querySelectorAll('.ch-item').forEach(function(el){el.classList.remove('active');});
  document.querySelectorAll('.ch-item[data-chname="'+chName+'"]').forEach(function(el){el.classList.add('active');});

  // Start the actual call (voice or video)
  set_callType(chType==='video'?'video':'voice');
  try{
    var stream=await navigator.mediaDevices.getUserMedia({audio:true,video:chType==='video'});
    // Use setters for all state module bindings
    setCallActive(true);setCallSecs(0);setIsMuted(false);setIsCamOff(false);setIsSpeakerOn(false);
    set_callState('connecting');
    window._callStream=stream;
    set_gcCall(true);
    set_gcCallId(curServer+'-vc-'+chName);
    // Get all server members as potential VC members (we'll connect to whoever joins)
    set_gcCallMembers([]);
    var target={id:curServer+'-vc-'+chName,username:chName,photo:'',avatar:chName.charAt(0).toUpperCase(),name_font:'default'};
    set_callTarget(target);
    _setupCallUI(target,chType==='video'?'video':'voice','In voice channel\u2026');
    document.getElementById('callTimerDisplay').style.display='none';
    document.getElementById('callOverlay').classList.add('open');

    // Setup GC signaling on a VC-specific channel
    set_gcCallId(curServer+'-vc-'+chName);
    await _setupGCSignaling();
    _gcBuildGrid();

    // Announce join so existing participants connect to us
    _gcSignalChannel.send({type:'broadcast',event:'gc-signal',payload:{from:ME.id,type:'gc-join'}});

    // Send notification only if we're the first one (nobody else in VC)
    var existingUsers=_vcUsers[chName]||[];
    if(existingUsers.filter(function(u){return u.id!==ME.id;}).length===0){
      _notifyVCStarted(chName,chType);
    }

    notify('Joined '+chName,'success');
  }catch(e){
    notify('Mic/camera access denied: '+e.message,'error');
    _currentVC=null;set_gcCall(false);
    if(presCh)presCh.untrack();
  }
}

export function leaveVoiceChannel(){
  if(!_currentVC)return;
  var chName=_currentVC;
  // Untrack presence
  var presCh=_vcPresenceChannels[chName];
  if(presCh){presCh.untrack();}
  // End the call
  if(callActive&&_gcCall){
    _gcCleanup();
    _cleanupCall(true);
  }
  _currentVC=null;
  // Remove active highlight from VC channels
  document.querySelectorAll('.ch-item[data-chtype="voice"],.ch-item[data-chtype="video"]').forEach(function(el){el.classList.remove('active');});
  notify('Left voice channel','info');
}

export function _notifyVCStarted(chName,chType){
  // Send a system message to the server's general text channel so members see a notification
  if(!curServer||!ME)return;
  // Find the first text channel to post the notification
  var textCh=_serverChannelsList.find(function(c){return (c.type||'text')==='text';});
  if(!textCh)return;
  var key=curServer+'_'+textCh.name;
  var label=chType==='video'?'video':'voice';
  var msg='[vc-started] '+ME.username+' started a '+label+' session in '+chName+' \u2014 join in!';
  sb.from('messages').insert({
    server_channel:key,
    user_id:ME.id,
    author:ME.username,
    avatar:ME.avatar,
    photo:ME.photo||'',
    name_font:ME.name_font||'default',
    name_color:ME.name_color||'',
    text:msg,
    time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
  }).then(function(){});
  // Also send desktop notification to all server members via broadcast
  var notifCh=sb.channel('srv-notify-'+curServer,{config:{broadcast:{self:false}}});
  notifCh.subscribe(function(status){
    if(status==='SUBSCRIBED'){
      notifCh.send({type:'broadcast',event:'vc-started',payload:{
        from:ME.id,username:ME.username,channel:chName,callType:chType,
        serverName:_curServerData?_curServerData.name:'Server'
      }});
      setTimeout(function(){sb.removeChannel(notifCh);},3000);
    }
  });
}

export async function _subscribeServerVCNotifications(){
  // Clean old
  _srvNotifChannels.forEach(function(ch){try{sb.removeChannel(ch);}catch(e){/* cleanup */}});
  _srvNotifChannels=[];
  if(!ME)return;
  var res=await sb.from('server_members').select('server_id, servers(id,name)').eq('user_id',ME.id);
  if(!res.data)return;
  res.data.forEach(function(m){
    var srv=m.servers;if(!srv)return;
    var ch=sb.channel('srv-notify-'+srv.id,{config:{broadcast:{self:false}}});
    ch.on('broadcast',{event:'vc-started'},function(payload){
      var d=payload.payload;if(!d||d.from===ME.id)return;
      var srvName=d.serverName||srv.name||'Server';
      var label=d.callType==='video'?'video':'voice';
      notify(d.username+' started a '+label+' call in '+srvName+' #'+d.channel,'info');
      if(typeof showDesktopNotif==='function'){
        showDesktopNotif('Call Started in '+srvName,d.username+' started a '+label+' session in #'+d.channel);
      }
      playNotifSound();
    });
    ch.subscribe();
    _srvNotifChannels.push(ch);
  });
}

export function openChannel(name){
  setChatMode('channel');setCurChannel(name);setCurGroupChat(null);
  document.getElementById('membersBar').classList.remove('hidden');setMembersOpen(true);
  document.getElementById('gcSettingsBtn').style.display='none';
  document.querySelectorAll('.dm-item').forEach(e=>e.classList.remove('active'));
  // Mark this text channel active, keep VC channels highlighted only if we're in them
  document.querySelectorAll('.ch-item').forEach(function(el){
    if(el.dataset.chtype==='text'){
      el.classList.toggle('active',el.dataset.chname===name);
    }
    // VC channels keep their active state only if _currentVC matches
    if(el.dataset.chtype==='voice'||el.dataset.chtype==='video'){
      el.classList.toggle('active',_currentVC===el.dataset.chname);
    }
  });
  document.getElementById('chatIcon').innerHTML=_svgHashIcon;
  var cn=document.getElementById('chatName');cn.textContent=name;cn.className='chat-name nf-default';
  document.getElementById('chatDesc').textContent='Messages in #'+name;
  document.getElementById('msgInput').placeholder='Message #'+name+'\u2026';
  document.getElementById('inputArea').style.display='';
  subscribeAndRender();
  if(isMobile()){closeDrawer();closeMobileMembers();document.querySelectorAll('.mob-nav-btn').forEach(b=>b.classList.remove('active'));document.getElementById('mnChats').classList.add('active');updateSidebarToggleIcon();}
}

var _addChType='text';

export function addChannel(){
  if(!curServer){notify('Select a server first','error');return;}
  if(!_curServerData||_curServerData.owner_id!==ME.id){notify('Only the server owner can add channels','error');return;}
  _addChType='text';
  document.querySelectorAll('.addch-type').forEach(function(el){el.classList.toggle('sel',el.dataset.chtype==='text');});
  document.getElementById('addChNameInput').value='';
  document.getElementById('addChModal').classList.add('open');
  setTimeout(function(){document.getElementById('addChNameInput').focus();},100);
}
export function closeAddChModal(){document.getElementById('addChModal').classList.remove('open');}
export function selChType(t){
  _addChType=t;
  document.querySelectorAll('.addch-type').forEach(function(el){el.classList.toggle('sel',el.dataset.chtype===t);});
}
export async function confirmAddChannel(){
  var name=document.getElementById('addChNameInput').value;
  if(!name||!name.trim()){notify('Enter a channel name','error');return;}
  var clean=name.trim().toLowerCase().replace(/\s+/g,'-');
  var res=await sb.from('channels').insert({server_id:curServer,name:clean,type:_addChType,position:999});
  if(res.error){notify('Failed: '+res.error.message,'error');return;}
  closeAddChModal();
  loadServerChannels(curServer);
  notify((_addChType==='text'?'#':'')+ clean+' created','success');
}
