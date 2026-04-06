import { sb } from './config.js';
import {
  ME,
  callActive,
  callSecs, setCallSecs,
  isMuted, setIsMuted,
  isCamOff, setIsCamOff,
  isSpeakerOn, setIsSpeakerOn,
  setCallActive,
  _callSignalChannel, set_callSignalChannel,
  _rtcPeer, set_rtcPeer,
  _callTarget, set_callTarget,
  _callType, set_callType,
  _incomingOffer, set_incomingOffer,
  _iceCandidateQueue, set_iceCandidateQueue,
  _callRinging, set_callRinging,
  _callState, set_callState,
  _gcCall, set_gcCall,
  _gcCallId, set_gcCallId,
  _gcCallMembers, set_gcCallMembers,
  _gcSignalChannel,
  _rtcConfig,
  REAL_USERS,
  _myGroupChats
} from './state.js';
import { notify } from './notifications.js';
import { _setupCallUI, _setupSignaling, _createPeerAndOffer, _callConnected, _handleRemoteHangup, _cleanupCall } from './calls.js';
import { _setupGCSignaling, _gcBuildGrid, _gcUpdateStatus, _gcCleanup } from './calls-gc.js';

// ─── Ring tone (simple oscillating beep via Web Audio) ───
export function _startRingTone(){
  _stopRingTone();
  try{
    var ac=new (window.AudioContext||window.webkitAudioContext)();
    window._ringCtx=ac;
    function beep(){
      if(!window._ringCtx)return;
      var o=ac.createOscillator();var g=ac.createGain();
      o.connect(g);g.connect(ac.destination);
      o.frequency.value=440;o.type='sine';
      g.gain.setValueAtTime(0.15,ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.6);
      o.start(ac.currentTime);o.stop(ac.currentTime+0.6);
    }
    beep();
    set_callRinging(setInterval(function(){beep();},2000));
  }catch(e){/* Web Audio API unavailable */}
}

export function _stopRingTone(){
  clearInterval(_callRinging);set_callRinging(null);
  if(window._ringCtx){try{window._ringCtx.close();}catch(e){/* cleanup */}window._ringCtx=null;}
}

// ─── Listen for incoming calls globally ───
export function _subscribeCallSignals(){
  if(!ME)return;
  // Subscribe to a personal channel for receiving call offers
  var personalCh=sb.channel('call-listen-'+ME.id,{config:{broadcast:{self:false}}});
  personalCh.on('broadcast',{event:'call-ring'},function(payload){
    var data=payload.payload;
    if(!data||data.from===ME.id)return;

    // ─── GC CALL RING ───
    if(data.gcId){
      if(callActive){return;} // Already in a call, ignore
      set_gcCall(true);
      set_gcCallId(data.gcId);
      set_callType(data.callType||'voice');
      // Find GC from _myGroupChats to get members
      var gc=_myGroupChats?_myGroupChats.find(function(g){return g.id===data.gcId;}):null;
      if(gc){
        set_gcCallMembers(gc.members.filter(function(m){return m.id!==ME.id;}));
      }else{
        set_gcCallMembers([]);
      }
      set_callTarget({id:data.gcId,username:data.gcName||'Group Call',photo:data.gcIcon||'',avatar:(data.gcName||'GC').split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase(),name_font:'default'});

      // Show incoming call UI
      var icAv=document.getElementById('icAvatar');icAv.querySelectorAll('img').forEach(function(i){i.remove();});
      if(_callTarget.photo){
        icAv.querySelector('span').style.display='none';
        var img=document.createElement('img');img.src=_callTarget.photo;icAv.appendChild(img);
      }else{
        icAv.querySelector('span').style.display='';icAv.querySelector('span').textContent=_callTarget.avatar;
      }
      var icn=document.getElementById('icCallerName');icn.textContent=_callTarget.username;icn.className='nf-default';
      document.getElementById('icCallType').textContent=(_callType==='video'?'Video':'Voice')+' · Group Call';
      document.getElementById('incomingCallOverlay').classList.add('open');
      _startRingTone();
      window._autoDecline=setTimeout(function(){
        if(document.getElementById('incomingCallOverlay').classList.contains('open')){
          declineIncoming();
          notify('Missed group call from '+_callTarget.username,'info');
        }
      },30000);
      return;
    }

    // ─── DM CALL RING ───
    if(callActive){
      var ids=[ME.id,data.from].sort();
      var ch=sb.channel('call-'+ids[0]+'-'+ids[1],{config:{broadcast:{self:false}}});
      ch.subscribe(function(status){
        if(status==='SUBSCRIBED'){
          ch.send({type:'broadcast',event:'call-signal',payload:{from:ME.id,type:'busy'}});
          setTimeout(function(){sb.removeChannel(ch);},2000);
        }
      });
      return;
    }
    set_callTarget({id:data.from,username:data.callerName||'Unknown',photo:data.callerPhoto||'',avatar:(data.callerName||'?').charAt(0).toUpperCase(),name_font:data.callerFont||'default'});
    _setupSignaling().then(function(){
      if(_callSignalChannel){
        _callSignalChannel.send({type:'broadcast',event:'call-signal',payload:{from:ME.id,type:'ready'}});
      }
    });
  });
  personalCh.subscribe();
  window._callListenCh=personalCh;
}

// ─── Accept incoming call ───
export async function acceptIncoming(){
  clearTimeout(window._autoDecline);
  _stopRingTone();
  document.getElementById('incomingCallOverlay').classList.remove('open');

  // ─── GC CALL ACCEPT ───
  if(_gcCall&&_gcCallId){
    try{
      var stream=await navigator.mediaDevices.getUserMedia({audio:true,video:_callType==='video'});
      setCallActive(true);setCallSecs(0);setIsMuted(false);setIsCamOff(false);setIsSpeakerOn(false);
      set_callState('connecting');
      window._callStream=stream;

      _setupCallUI(_callTarget,_callType,'Joining group…');
      document.getElementById('callTimerDisplay').style.display='none';
      document.getElementById('callOverlay').classList.add('open');

      // Setup GC signaling channel
      await _setupGCSignaling();

      // Build video grid
      _gcBuildGrid();

      // Announce our join — existing members will send us offers
      _gcSignalChannel.send({type:'broadcast',event:'gc-signal',payload:{
        from:ME.id,type:'gc-join'
      }});

      _gcUpdateStatus();
    }catch(e){
      console.error('[GC] Accept failed:',e);
      notify('Failed to join call: '+e.message,'error');
      _gcCleanup();
      _cleanupCall(true);
    }
    return;
  }

  // ─── DM CALL ACCEPT ───
  try{
    var stream=await navigator.mediaDevices.getUserMedia({audio:true,video:_callType==='video'});
    setCallActive(true);setCallSecs(0);setIsMuted(false);setIsCamOff(false);setIsSpeakerOn(false);
    set_callState('connecting');
    window._callStream=stream;

    _setupCallUI(_callTarget,_callType,'Connecting…');
    document.getElementById('callTimerDisplay').style.display='none';
    document.getElementById('callOverlay').classList.add('open');

    // Ensure signaling is set up and ready
    if(!_callSignalChannel)await _setupSignaling();

    // Create peer connection for answering
    set_rtcPeer(new RTCPeerConnection(_rtcConfig));

    stream.getTracks().forEach(function(track){
      _rtcPeer.addTrack(track,stream);
    });

    _rtcPeer.onicecandidate=function(e){
      if(e.candidate&&_callSignalChannel){
        _callSignalChannel.send({type:'broadcast',event:'call-signal',payload:{from:ME.id,type:'ice-candidate',candidate:e.candidate}});
      }
    };

    _rtcPeer.ontrack=function(e){
      if(e.streams&&e.streams[0]){
        document.getElementById('callRemoteVideo').srcObject=e.streams[0];
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
      if(_rtcPeer.iceConnectionState==='connected'||_rtcPeer.iceConnectionState==='completed'){
        if(_callState!=='connected')_callConnected();
      }else if(_rtcPeer.iceConnectionState==='failed'){
        console.error('[Call] Callee ICE failed');
        if(callActive){notify('Connection failed — check your network','error');_handleRemoteHangup();}
      }
    };

    // Set remote offer, create answer
    await _rtcPeer.setRemoteDescription(new RTCSessionDescription(_incomingOffer.sdp));
    for(var i=0;i<_iceCandidateQueue.length;i++){
      await _rtcPeer.addIceCandidate(new RTCIceCandidate(_iceCandidateQueue[i].candidate)).catch(function(){});
    }
    set_iceCandidateQueue([]);
    var answer=await _rtcPeer.createAnswer();
    await _rtcPeer.setLocalDescription(answer);
    _callSignalChannel.send({type:'broadcast',event:'call-signal',payload:{
      from:ME.id,type:'answer',sdp:_rtcPeer.localDescription
    }});

  }catch(e){
    console.error('[Call] Accept failed:',e);
    notify('Failed to accept call: '+e.message,'error');
    _cleanupCall(true);
  }
}

// ─── Decline incoming call ───
export function declineIncoming(){
  clearTimeout(window._autoDecline);
  _stopRingTone();
  document.getElementById('incomingCallOverlay').classList.remove('open');
  if(_gcCall){
    // GC decline — just reset state, no need to signal since we never joined
    set_gcCall(false);set_gcCallId(null);set_gcCallMembers([]);
    set_callTarget(null);
    return;
  }
  if(_callSignalChannel){
    _callSignalChannel.send({type:'broadcast',event:'call-signal',payload:{from:ME.id,type:'decline'}});
  }
  set_incomingOffer(null);set_callTarget(null);set_iceCandidateQueue([]);
}
