import { sb } from './config.js?v=49';
import {
  ME, chatMode, curDMUser, curGroupChat,
  callActive, setCallActive,
  callSecs, setCallSecs,
  callTick, setCallTick,
  isMuted, setIsMuted,
  isCamOff, setIsCamOff,
  isSpeakerOn, setIsSpeakerOn,
  _callSignalChannel, set_callSignalChannel,
  _rtcPeer, set_rtcPeer,
  _callTarget, set_callTarget,
  _callType, set_callType,
  _incomingOffer, set_incomingOffer,
  _iceCandidateQueue, set_iceCandidateQueue,
  _callState, set_callState,
  _callRinging, set_callRinging,
  _gcCall, set_gcCall,
  _gcCallId, set_gcCallId,
  _gcCallMembers, set_gcCallMembers,
  _rtcConfig,
  REAL_USERS,
  _currentVC, set_currentVC,
  _vcPresenceChannels
} from './state.js?v=49';
import { notify, showDesktopNotif } from './notifications.js?v=49';
import { _startRingTone, _stopRingTone } from './calls-incoming.js?v=49';
import { _setupGCSignaling, _gcBuildGrid, _gcUpdateStatus, _gcCleanup } from './calls-gc.js?v=49';
import { _svgCamOn } from './calls-controls.js?v=49';

// ─── Send call system message in DM chat ───
async function _sendCallMsg(tag, targetUser, type){
  if(!ME||!targetUser)return;
  var key='dm_'+[ME.id,targetUser.id].sort().join('_');
  var label=type==='video'?'video call':'voice call';
  var text=tag==='call-started'
    ?'[call-started] '+ME.username+' started a '+label
    :'[call-missed] Missed '+label+' from '+ME.username;
  try{
    await sb.from('messages').insert({server_channel:key,user_id:ME.id,author:ME.username,avatar:ME.avatar,photo:ME.photo||null,text:text,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),name_font:ME.name_font||'default',name_color:ME.name_color||''});
  }catch(e){console.warn('[Call] System message failed:',e);}
}

// ─── Call state UI helper ───
function _setCallState(state) {
  const card = document.getElementById('callCard');
  const status = document.getElementById('callStatus');
  if (!card || !status) return;
  // Remove all state classes
  card.className = card.className.replace(/call-state-\w+/g, '').trim();
  card.classList.add('call-state-' + state);
  switch(state) {
    case 'ringing': status.textContent = 'Ringing...'; break;
    case 'connecting': status.textContent = 'Connecting...'; break;
    case 'connected': status.textContent = 'Connected'; break;
    case 'reconnecting': status.textContent = 'Reconnecting...'; break;
  }
}

// ─── Start outgoing call ───
export async function startCall(type){
  if(callActive){notify('Already in a call','error');return;}

  // ─── GC CALL ───
  if(chatMode==='gc'&&curGroupChat){
    set_callType(type);
    set_gcCall(true);
    set_gcCallId(curGroupChat.id);
    set_gcCallMembers(curGroupChat.members.filter(function(m){return m.id!==ME.id;}));
    if(!_gcCallMembers.length){notify('No other members in this group','info');set_gcCall(false);return;}
    try{
      var stream=await navigator.mediaDevices.getUserMedia({audio:true,video:type==='video'});
      setCallActive(true);setCallSecs(0);setIsMuted(false);setIsCamOff(false);setIsSpeakerOn(false);
      set_callState('ringing');
      window._callStream=stream;
      // Use GC as target for UI
      set_callTarget({id:_gcCallId,username:curGroupChat.name,photo:curGroupChat.icon||'',avatar:curGroupChat.name.split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase(),name_font:'default'});
      _setupCallUI(_callTarget,type,'Ringing group…');
      _setCallState('ringing');
      document.getElementById('callTimerDisplay').style.display='none';
      document.getElementById('callOverlay').classList.add('open');
      _startRingTone();
      // Setup GC signaling channel
      await _setupGCSignaling();
      // Ring each member's personal channel
      _gcCallMembers.forEach(function(m){
        var ringCh=sb.channel('call-listen-'+m.id,{config:{broadcast:{self:false}}});
        ringCh.subscribe(function(status){
          if(status==='SUBSCRIBED'){
            ringCh.send({type:'broadcast',event:'call-ring',payload:{
              from:ME.id,callerName:ME.username,callerPhoto:ME.photo||'',callerFont:ME.name_font||'default',callType:type,
              gcId:_gcCallId,gcName:curGroupChat.name,gcIcon:curGroupChat.icon||''
            }});
            setTimeout(function(){sb.removeChannel(ringCh);},5000);
          }
        });
      });
      // Build GC video grid with self tile
      _gcBuildGrid();
      notify('Calling '+curGroupChat.name+'…','info');
    }catch(e){notify('Mic/camera access denied: '+e.message,'error');set_gcCall(false);}
    return;
  }

  // ─── DM CALL ───
  if(chatMode!=='dm'||!curDMUser){notify('Open a DM or group chat to call','info');return;}
  set_callType(type);
  set_callTarget(curDMUser);
  set_gcCall(false);

  try{
    var stream=await navigator.mediaDevices.getUserMedia({audio:true,video:type==='video'});
    setCallActive(true);setCallSecs(0);setIsMuted(false);setIsCamOff(false);setIsSpeakerOn(false);
    set_callState('ringing');
    window._callStream=stream;

    _setupCallUI(_callTarget,type,'Ringing…');
    _setCallState('ringing');
    document.getElementById('callTimerDisplay').style.display='none';
    document.getElementById('callOverlay').classList.add('open');
    _startRingTone();
    await _setupSignaling();

    // Ring the callee's personal channel so they know someone is calling
    var ringCh=sb.channel('call-listen-'+_callTarget.id,{config:{broadcast:{self:false}}});
    ringCh.subscribe(function(status){
      if(status==='SUBSCRIBED'){
        ringCh.send({type:'broadcast',event:'call-ring',payload:{
          from:ME.id,callerName:ME.username,callerPhoto:ME.photo||'',callerFont:ME.name_font||'default',callType:type
        }});
        setTimeout(function(){sb.removeChannel(ringCh);},5000);
      }
    });

    var _offerStream=stream;
    window._pendingOfferStream=_offerStream;
    window._callerReadyTimeout=setTimeout(function(){
      if(window._pendingOfferStream&&_callState==='ringing'){
        _createPeerAndOffer(window._pendingOfferStream);
        window._pendingOfferStream=null;
      }
    },4000);

    notify(type==='video'?'Calling '+_callTarget.username+' (video)…':'Calling '+_callTarget.username+'…','info');
    // Send system message in chat
    _sendCallMsg('call-started',_callTarget,type);
  }catch(e){notify('Mic/camera access denied: '+e.message,'error');}
}

// ─── Setup call modal UI ───
export function _setupCallUI(target,type,statusText){
  var typeLabel=type==='video'?'Video Call':'Voice Call';
  if(_gcCall)typeLabel+=' · Group';
  document.getElementById('callTypeLabel').textContent=typeLabel;
  // Name
  var cpn=document.getElementById('callPersonName');
  cpn.textContent=target.username;
  cpn.className='nf-'+(target.name_font||'default');
  // Avatar — clean previous images first
  var av=document.getElementById('callAvatarWrap');
  av.querySelectorAll('img').forEach(function(i){i.remove();});
  var letterEl=av.querySelector('span');
  if(target.photo){
    if(letterEl)letterEl.style.display='none';
    var img=document.createElement('img');
    img.src=target.photo;
    av.appendChild(img);
  }else{
    if(letterEl){letterEl.style.display='';letterEl.textContent=target.avatar||target.username.charAt(0).toUpperCase();}
  }
  // Status
  document.getElementById('callStatus').textContent=statusText;
  document.getElementById('callStatus').style.display='';
  // Reset buttons
  document.getElementById('muteIcon').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
  document.getElementById('muteLabel').textContent='Mute';
  document.getElementById('camIcon').innerHTML=_svgCamOn;
  document.getElementById('camLabel').textContent='Camera';
  document.getElementById('speakerIcon').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
  document.getElementById('speakerLabel').textContent='Speaker';
  document.getElementById('screenIcon').classList.remove('active');
  document.getElementById('screenLabel').textContent='Share';
  // Reset active states on icons
  document.querySelectorAll('.call-act-icon').forEach(function(el){el.classList.remove('active');});
  // Video layout
  var vw=document.getElementById('callVideoWrap');
  var cc=document.getElementById('callCard');
  if(type==='video'){
    vw.style.display='block';
    av.style.display='none';
    cc.classList.add('video-mode');
    if(window._callStream)document.getElementById('callLocalVideo').srcObject=window._callStream;
  }else{
    vw.style.display='none';
    av.style.display='flex';
    cc.classList.remove('video-mode');
  }
  // Add ringing pulse
  av.classList.add('ringing');
}

// ─── Supabase Realtime signaling channel ───
export function _setupSignaling(){
  return new Promise(function(resolve){
    // Clean up old channel
    if(_callSignalChannel){try{sb.removeChannel(_callSignalChannel);}catch(e){/* cleanup */}set_callSignalChannel(null);}

    // Channel name: sorted user IDs for consistency
    var ids=[ME.id,_callTarget.id].sort();
    var chName='call-'+ids[0]+'-'+ids[1];

    set_callSignalChannel(sb.channel(chName,{config:{broadcast:{self:false}}}));

    _callSignalChannel.on('broadcast',{event:'call-signal'},function(payload){
      var data=payload.payload;
      if(!data||data.from===ME.id)return;

      if(data.type==='ready'&&_callState==='ringing'&&window._pendingOfferStream){
        // Callee is ready — now send the offer
        clearTimeout(window._callerReadyTimeout);
        _createPeerAndOffer(window._pendingOfferStream);
        window._pendingOfferStream=null;
      }else if(data.type==='offer'&&!callActive){
        _handleIncomingCall(data);
      }else if(data.type==='answer'&&(_callState==='ringing'||_callState==='connecting')){
        _handleCallAccepted(data);
      }else if(data.type==='ice-candidate'){
        _handleRemoteICE(data);
      }else if(data.type==='decline'){
        _handleCallDeclined();
      }else if(data.type==='hangup'){
        _handleRemoteHangup();
      }else if(data.type==='busy'){
        _stopRingTone();
        set_callState('idle');
        notify(_callTarget.username+' is busy','info');
        _sendCallMsg('call-missed',_callTarget,_callType||'voice');
        _cleanupCall(false);
      }
    });

    _callSignalChannel.subscribe(function(status){
      if(status==='SUBSCRIBED'){
        resolve();
      }
    });

    // Fallback if subscribe hangs
    setTimeout(resolve,3000);
  });
}

// ─── Create peer connection + send offer ───
export function _createPeerAndOffer(localStream){
  set_rtcPeer(new RTCPeerConnection(_rtcConfig));

  localStream.getTracks().forEach(function(track){
    _rtcPeer.addTrack(track,localStream);
  });

  _rtcPeer.onicecandidate=function(e){
    if(e.candidate&&_callSignalChannel){
      _callSignalChannel.send({type:'broadcast',event:'call-signal',payload:{from:ME.id,type:'ice-candidate',candidate:e.candidate}});
    }
  };

  _rtcPeer.ontrack=function(e){
    if(e.streams&&e.streams[0]){
      document.getElementById('callRemoteVideo').srcObject=e.streams[0];
      // For voice calls, we still need audio — create hidden audio element
      if(_callType==='voice'){
        var audioEl=document.getElementById('remoteAudio');
        if(!audioEl){audioEl=document.createElement('audio');audioEl.id='remoteAudio';document.body.appendChild(audioEl);}
        audioEl.srcObject=e.streams[0];
        audioEl.autoplay=true;
        audioEl.play().catch(function(err){console.warn('[Call] Audio autoplay blocked:',err);});
      }
    }
  };

  _rtcPeer.onconnectionstatechange=function(){
    if(_rtcPeer.connectionState==='connected'){
      _callConnected();
    }else if(_rtcPeer.connectionState==='disconnected'||_rtcPeer.connectionState==='failed'){
      if(callActive)_handleRemoteHangup();
    }
  };

  _rtcPeer.oniceconnectionstatechange=function(){
    if(_rtcPeer.iceConnectionState==='checking'){
      _setCallState('connecting');
    }else if(_rtcPeer.iceConnectionState==='connected'||_rtcPeer.iceConnectionState==='completed'){
      _setCallState('connected');
      if(_callState!=='connected')_callConnected();
    }else if(_rtcPeer.iceConnectionState==='disconnected'){
      _setCallState('reconnecting');
    }else if(_rtcPeer.iceConnectionState==='failed'){
      console.error('[Call] ICE failed — likely no TURN server reachable or network blocked');
      if(callActive){notify('Connection failed — check your network','error');_handleRemoteHangup();}
    }
  };

  _rtcPeer.createOffer({offerToReceiveAudio:true,offerToReceiveVideo:_callType==='video'}).then(function(offer){
    return _rtcPeer.setLocalDescription(offer);
  }).then(function(){
    _callSignalChannel.send({type:'broadcast',event:'call-signal',payload:{
      from:ME.id,type:'offer',sdp:_rtcPeer.localDescription,
      callType:_callType,callerName:ME.username,callerPhoto:ME.photo||'',callerFont:ME.name_font||'default'
    }});
  }).catch(function(e){notify('Call setup failed: '+e.message,'error');_cleanupCall(true);});
}

// ─── Handle incoming call (we are the receiver) ───
function _handleIncomingCall(data){
  if(callActive){
    // Already in a call — send busy
    _callSignalChannel.send({type:'broadcast',event:'call-signal',payload:{from:ME.id,type:'busy'}});
    return;
  }
  set_incomingOffer(data);
  set_callType(data.callType||'voice');
  // Find the caller in REAL_USERS
  var callerUser=REAL_USERS.find(function(u){return u.id===data.from;});
  set_callTarget(callerUser||{id:data.from,username:data.callerName||'Unknown',photo:data.callerPhoto||'',avatar:(data.callerName||'?').charAt(0).toUpperCase(),name_font:data.callerFont||'default'});

  // Show incoming call UI
  var icAv=document.getElementById('icAvatar');icAv.querySelectorAll('img').forEach(function(i){i.remove();});
  if(_callTarget.photo){
    icAv.querySelector('span').style.display='none';
    var img=document.createElement('img');img.src=_callTarget.photo;icAv.appendChild(img);
  }else{
    icAv.querySelector('span').style.display='';icAv.querySelector('span').textContent=_callTarget.avatar;
  }
  var icn=document.getElementById('icCallerName');icn.textContent=_callTarget.username;icn.className='nf-'+(_callTarget.name_font||'default');
  document.getElementById('icCallType').textContent=_callType==='video'?'Video Call':'Voice Call';
  document.getElementById('incomingCallOverlay').classList.add('open');

  // Play incoming ring
  _startRingTone();

  // Auto-decline after 30 seconds
  window._autoDecline=setTimeout(function(){
    if(document.getElementById('incomingCallOverlay').classList.contains('open')){
      declineIncoming();
      notify('Missed call from '+_callTarget.username,'info');
    }
  },30000);
}

// ─── Handle answer from remote (our outgoing call was accepted) ───
export function _handleCallAccepted(data){
  _stopRingTone();
  set_callState('connecting');
  _setCallState('connecting');
  if(_rtcPeer){
    _rtcPeer.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(function(){
      _iceCandidateQueue.forEach(function(d){
        _rtcPeer.addIceCandidate(new RTCIceCandidate(d.candidate)).catch(function(e){
          console.warn('[Call] Queued ICE add failed:',e);
        });
      });
      set_iceCandidateQueue([]);
    }).catch(function(e){console.error('[Call] setRemoteDescription failed:',e);notify('Connection failed','error');_cleanupCall(true);});
  }
}

// ─── Handle remote ICE candidate ───
export function _handleRemoteICE(data){
  if(_rtcPeer&&_rtcPeer.remoteDescription&&_rtcPeer.remoteDescription.type){
    _rtcPeer.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(function(e){
      console.warn('[Call] ICE candidate failed:',e);
    });
  }else{
    _iceCandidateQueue.push(data);
  }
}

// ─── Call connected — start timer ───
export function _callConnected(){
  set_callState('connected');
  _stopRingTone();
  document.getElementById('callAvatarWrap').classList.remove('ringing');
  if(_gcCall){
    // For GC calls, keep showing participant count
    _gcUpdateStatus();
  }else{
    document.getElementById('callStatus').style.display='none';
  }
  document.getElementById('callTimerDisplay').style.display='';
  if(callSecs===0){
    document.getElementById('callTimerDisplay').textContent='00:00';
    clearInterval(callTick);
    setCallTick(setInterval(function(){
      setCallSecs(callSecs+1);
      var m=String(Math.floor(callSecs/60)).padStart(2,'0');
      var s=String(callSecs%60).padStart(2,'0');
      var t=m+':'+s;
      document.getElementById('callTimerDisplay').textContent=t;
      var mt=document.getElementById('mcbTimer');if(mt)mt.textContent=t;
    },1000));
  }
  notify(_gcCall?'Connected to group call!':'Call connected!','success');
  if(typeof showDesktopNotif==='function')showDesktopNotif('Call Connected','In call with '+(_callTarget?_callTarget.username:''));
}

// ─── Handle call declined by remote ───
export function _handleCallDeclined(){
  _stopRingTone();
  notify((_callTarget?_callTarget.username:'User')+' declined the call','info');
  // Send missed call message
  if(_callTarget&&!_gcCall)_sendCallMsg('call-missed',_callTarget,_callType||'voice');
  _cleanupCall(true);
}

// ─── Handle remote hangup ───
export function _handleRemoteHangup(){
  _stopRingTone();
  var dur=document.getElementById('callTimerDisplay').textContent;
  notify('Call ended'+(dur&&dur!=='00:00'?' — '+dur:''),'info');
  _cleanupCall(true);
}

// ─── End call (user pressed end) ───
export function endCall(){
  if(!callActive&&!document.getElementById('incomingCallOverlay').classList.contains('open'))return;
  if(_gcCall){
    var dur=document.getElementById('callTimerDisplay').textContent;
    // If in a server voice channel, also leave VC presence
    if(_currentVC){
      var presCh=_vcPresenceChannels[_currentVC];
      if(presCh)presCh.untrack();
      document.querySelectorAll('.ch-item[data-chtype="voice"],.ch-item[data-chtype="video"]').forEach(function(el){el.classList.remove('active');});
      set_currentVC(null);
    }
    _gcCleanup();
    _cleanupCall(true);
    notify('Left group call'+(dur&&dur!=='00:00'?' — '+dur:''),'info');
    return;
  }
  // DM call — send hangup signal
  if(_callSignalChannel){
    _callSignalChannel.send({type:'broadcast',event:'call-signal',payload:{from:ME.id,type:'hangup'}});
  }
  var dur=document.getElementById('callTimerDisplay').textContent;
  _cleanupCall(true);
  notify('Call ended'+(dur&&dur!=='00:00'?' — '+dur:''),'info');
}

// ─── Cleanup everything ───
export function _cleanupCall(closeUI){
  _stopRingTone();
  clearInterval(callTick);setCallTick(null);
  setCallActive(false);set_callState('idle');
  clearTimeout(window._callerReadyTimeout);
  window._pendingOfferStream=null;

  // Stop local stream
  if(window._callStream){window._callStream.getTracks().forEach(function(t){t.stop();});window._callStream=null;}

  // Close peer connection
  if(_rtcPeer){try{_rtcPeer.close();}catch(e){/* cleanup */}set_rtcPeer(null);}

  // Remove remote audio element
  var ra=document.getElementById('remoteAudio');if(ra)ra.remove();

  // Clear video elements
  var rv=document.getElementById('callRemoteVideo');if(rv)rv.srcObject=null;
  var lv=document.getElementById('callLocalVideo');if(lv)lv.srcObject=null;

  // Remove signaling channel
  if(_callSignalChannel){try{sb.removeChannel(_callSignalChannel);}catch(e){/* cleanup */}set_callSignalChannel(null);}

  set_incomingOffer(null);set_iceCandidateQueue([]);

  // Clean up GC state if still active
  if(_gcCall)_gcCleanup();

  if(closeUI){
    document.getElementById('callOverlay').classList.remove('open');
    document.getElementById('incomingCallOverlay').classList.remove('open');
    document.getElementById('miniCallBar').style.display='none';
    var avWrap=document.getElementById('callAvatarWrap');
    avWrap.style.display='flex';
    avWrap.classList.remove('ringing');
    avWrap.querySelectorAll('img').forEach(function(i){i.remove();});
    var avLetter=avWrap.querySelector('span');if(avLetter)avLetter.style.display='';
    document.getElementById('callVideoWrap').style.display='none';
    var callCard=document.getElementById('callCard');
    callCard.classList.remove('video-mode');
    callCard.className=callCard.className.replace(/call-state-\w+/g,'').trim();
    document.getElementById('callTimerDisplay').style.display='none';
    document.getElementById('callStatus').textContent='';
    var gcGrid=document.getElementById('gcVideoGrid');
    if(gcGrid){gcGrid.innerHTML='';gcGrid.style.display='none';}
  }
}

// ─── Lazy import for declineIncoming (avoid circular) ───
import { declineIncoming } from './calls-incoming.js?v=49';
