// ═══════════════════════════════════════════════════════
// Call UI Controls (ES Module)
// ═══════════════════════════════════════════════════════

import {
  callActive, isMuted, setIsMuted, isCamOff, setIsCamOff, isSpeakerOn, setIsSpeakerOn,
  _callType, set_callType,
  _callTarget,
  _gcCall,
  _gcPeers,
  _rtcPeer
} from './state.js';
import { notify } from './notifications.js';
import { _gcBuildGrid } from './calls-gc.js';

// ─── SVG Constants ───
export var _svgCamOn='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>';
export var _svgCamOff='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/></svg>';

// ─── Toggle Mute ───
export function toggleMute(){
  if(!callActive)return;
  setIsMuted(!isMuted);
  if(window._callStream)window._callStream.getAudioTracks().forEach(function(t){t.enabled=!isMuted;});
  document.getElementById('muteIcon').innerHTML=isMuted?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
  document.getElementById('muteLabel').textContent=isMuted?'Unmute':'Mute';
  document.getElementById('muteIcon').classList.toggle('active',isMuted);
}

// ─── Toggle Call Video ───
export function toggleCallVideo(){
  if(!callActive)return;
  if(_callType==='voice'){
    navigator.mediaDevices.getUserMedia({video:true}).then(function(vStream){
      set_callType('video');setIsCamOff(false);
      var vTrack=vStream.getVideoTracks()[0];
      if(window._callStream)window._callStream.addTrack(vTrack);
      if(_gcCall){
        // Add video track to all GC peers
        Object.keys(_gcPeers).forEach(function(uid){
          var sender=_gcPeers[uid].getSenders().find(function(s){return s.track&&s.track.kind==='video';});
          if(sender){sender.replaceTrack(vTrack);}else{_gcPeers[uid].addTrack(vTrack,window._callStream);}
        });
        _gcBuildGrid();
      }else if(_rtcPeer){
        var sender=_rtcPeer.getSenders().find(function(s){return s.track&&s.track.kind==='video';});
        if(sender){sender.replaceTrack(vTrack);}else{_rtcPeer.addTrack(vTrack,window._callStream);}
      }
      if(!_gcCall){
        document.getElementById('callLocalVideo').srcObject=window._callStream;
        document.getElementById('callVideoWrap').style.display='block';
        document.getElementById('callAvatarWrap').style.display='none';
        document.getElementById('callCard').classList.add('video-mode');
      }
      document.getElementById('camIcon').innerHTML=_svgCamOff;document.getElementById('camLabel').textContent='Cam Off';
    }).catch(function(){notify('Camera access denied','error');});
  }else{
    setIsCamOff(!isCamOff);
    if(window._callStream)window._callStream.getVideoTracks().forEach(function(t){t.enabled=!isCamOff;});
    document.getElementById('camIcon').innerHTML=isCamOff?_svgCamOn:_svgCamOff;
    document.getElementById('camLabel').textContent=isCamOff?'Cam On':'Cam Off';
    document.getElementById('camIcon').classList.toggle('active',isCamOff);
  }
}

// ─── Toggle Speaker ───
export function toggleSpeaker(){
  if(!callActive)return;
  setIsSpeakerOn(!isSpeakerOn);
  var ra=document.getElementById('remoteAudio');
  var rv=document.getElementById('callRemoteVideo');
  [ra,rv].forEach(function(el){
    if(el&&el.setSinkId){
      el.setSinkId(isSpeakerOn?'default':'').catch(function(){});
    }
  });
  var svgSpeakerOn='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
  var svgSpeakerOff='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
  document.getElementById('speakerIcon').innerHTML=isSpeakerOn?svgSpeakerOff:svgSpeakerOn;
  document.getElementById('speakerLabel').textContent=isSpeakerOn?'Ear':'Speaker';
  document.getElementById('speakerIcon').classList.toggle('active',isSpeakerOn);
}

// ─── Screen Sharing ───
var _isScreenSharing=false;
var _screenStream=null;

export function toggleScreenShare(){
  if(!callActive)return;
  if(_isScreenSharing){
    stopScreenShare();
    return;
  }
  navigator.mediaDevices.getDisplayMedia({video:true,audio:false}).then(function(stream){
    _screenStream=stream;
    _isScreenSharing=true;
    var screenTrack=stream.getVideoTracks()[0];
    // Replace video track on peer connection(s)
    if(_gcCall){
      Object.keys(_gcPeers).forEach(function(uid){
        var sender=_gcPeers[uid].getSenders().find(function(s){return s.track&&s.track.kind==='video';});
        if(sender){sender.replaceTrack(screenTrack);}else{_gcPeers[uid].addTrack(screenTrack,stream);}
      });
    }else if(_rtcPeer){
      var sender=_rtcPeer.getSenders().find(function(s){return s.track&&s.track.kind==='video';});
      if(sender){sender.replaceTrack(screenTrack);}else{_rtcPeer.addTrack(screenTrack,stream);}
    }
    if(!_gcCall){
      document.getElementById('callLocalVideo').srcObject=stream;
      document.getElementById('callVideoWrap').style.display='block';
      document.getElementById('callAvatarWrap').style.display='none';
      document.getElementById('callCard').classList.add('video-mode');
    }
    document.getElementById('screenIcon').classList.add('active');
    document.getElementById('screenLabel').textContent='Stop';
    screenTrack.onended=function(){stopScreenShare();};
  }).catch(function(e){
    if(e.name!=='NotAllowedError')notify('Screen share failed','error');
  });
}

export function stopScreenShare(){
  _isScreenSharing=false;
  if(_screenStream){_screenStream.getTracks().forEach(function(t){t.stop();});_screenStream=null;}
  // Restore camera track if video call, or remove video if voice
  if(_callType==='video'&&window._callStream){
    var camTrack=window._callStream.getVideoTracks()[0];
    if(_gcCall){
      Object.keys(_gcPeers).forEach(function(uid){
        if(camTrack){
          var sender=_gcPeers[uid].getSenders().find(function(s){return s.track&&s.track.kind==='video';});
          if(sender)sender.replaceTrack(camTrack);
        }
      });
    }else if(_rtcPeer&&camTrack){
      var sender=_rtcPeer.getSenders().find(function(s){return s.track&&s.track.kind==='video';});
      if(sender)sender.replaceTrack(camTrack);
    }
    if(!_gcCall)document.getElementById('callLocalVideo').srcObject=window._callStream;
  }else if(!_gcCall){
    document.getElementById('callVideoWrap').style.display='none';
    document.getElementById('callAvatarWrap').style.display='';
    document.getElementById('callCard').classList.remove('video-mode');
  }
  document.getElementById('screenIcon').classList.remove('active');
  document.getElementById('screenLabel').textContent='Share';
}

// ─── Minimize / Reopen ───
export function minimizeCall(){
  document.getElementById('callOverlay').classList.remove('open');
  if(callActive){
    document.getElementById('miniCallBar').style.display='flex';
    document.getElementById('mcbName').textContent=_callTarget?(_gcCall?_callTarget.username+' (Group)':_callTarget.username):'Call';
  }
}

export function reopenCall(){
  document.getElementById('miniCallBar').style.display='none';
  document.getElementById('callOverlay').classList.add('open');
}
