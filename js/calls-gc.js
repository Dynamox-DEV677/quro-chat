import { sb } from './config.js?v=49';
import {
  ME,
  callActive,
  _callType, set_callType,
  _callState, set_callState,
  _gcCall, set_gcCall,
  _gcCallId, set_gcCallId,
  _gcPeers, set_gcPeers,
  _gcStreams, set_gcStreams,
  _gcCallMembers, set_gcCallMembers,
  _gcConnectedCount, set_gcConnectedCount,
  _gcIceQueues, set_gcIceQueues,
  _gcSignalChannel, set_gcSignalChannel,
  _rtcConfig,
  REAL_USERS
} from './state.js?v=49';
import { _callConnected } from './calls.js?v=49';

// ═══════════════════════════════════════════════════════
// GC CALL — Mesh WebRTC Functions
// ═══════════════════════════════════════════════════════

export function _setupGCSignaling(){
  return new Promise(function(resolve){
    if(_gcSignalChannel){try{sb.removeChannel(_gcSignalChannel);}catch(e){/* cleanup */}set_gcSignalChannel(null);}
    var chName='gc-call-'+_gcCallId;
    set_gcSignalChannel(sb.channel(chName,{config:{broadcast:{self:false}}}));

    _gcSignalChannel.on('broadcast',{event:'gc-signal'},function(payload){
      var data=payload.payload;
      if(!data||data.from===ME.id)return;

      if(data.type==='gc-join'){
        // A new member joined — we are existing, so WE initiate a peer connection to them
        if(!_gcPeers[data.from]){
          _gcCreatePeer(data.from,true);
        }
        _gcUpdateStatus();
      }else if(data.type==='gc-leave'){
        _gcRemovePeer(data.from);
        _gcUpdateStatus();
      }else if(data.type==='offer'&&data.to===ME.id){
        // Offer targeted at us from an existing member
        if(!_gcPeers[data.from]){
          _gcCreatePeer(data.from,false);
        }
        var peer=_gcPeers[data.from];
        if(peer){
          peer.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(function(){
            // Flush queued ICE
            if(_gcIceQueues[data.from]){
              _gcIceQueues[data.from].forEach(function(c){
                peer.addIceCandidate(new RTCIceCandidate(c)).catch(function(){});
              });
              _gcIceQueues[data.from]=[];
            }
            return peer.createAnswer();
          }).then(function(answer){
            return peer.setLocalDescription(answer);
          }).then(function(){
            _gcSignalChannel.send({type:'broadcast',event:'gc-signal',payload:{
              from:ME.id,to:data.from,type:'answer',sdp:peer.localDescription
            }});
          }).catch(function(e){console.error('[GC] Offer handling failed:',e);});
        }
      }else if(data.type==='answer'&&data.to===ME.id){
        var peer=_gcPeers[data.from];
        if(peer){
          peer.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(function(){
            if(_gcIceQueues[data.from]){
              _gcIceQueues[data.from].forEach(function(c){
                peer.addIceCandidate(new RTCIceCandidate(c)).catch(function(){});
              });
              _gcIceQueues[data.from]=[];
            }
          }).catch(function(e){console.error('[GC] Answer set failed:',e);});
        }
      }else if(data.type==='ice-candidate'&&data.to===ME.id){
        var peer=_gcPeers[data.from];
        if(peer&&peer.remoteDescription&&peer.remoteDescription.type){
          peer.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(function(){});
        }else{
          if(!_gcIceQueues[data.from])_gcIceQueues[data.from]=[];
          _gcIceQueues[data.from].push(data.candidate);
        }
      }
    });

    _gcSignalChannel.subscribe(function(status){
      if(status==='SUBSCRIBED'){
        resolve();
      }
    });
    setTimeout(resolve,3000);
  });
}

export function _gcCreatePeer(userId,isInitiator){
  if(_gcPeers[userId]){try{_gcPeers[userId].close();}catch(e){/* cleanup */}}
  var peer=new RTCPeerConnection(_rtcConfig);
  _gcPeers[userId]=peer;

  // Add local tracks
  if(window._callStream){
    window._callStream.getTracks().forEach(function(track){
      peer.addTrack(track,window._callStream);
    });
  }

  peer.onicecandidate=function(e){
    if(e.candidate&&_gcSignalChannel){
      _gcSignalChannel.send({type:'broadcast',event:'gc-signal',payload:{
        from:ME.id,to:userId,type:'ice-candidate',candidate:e.candidate
      }});
    }
  };

  peer.ontrack=function(e){
    if(e.streams&&e.streams[0]){
      _gcStreams[userId]=e.streams[0];
      // Create or update audio element for this peer
      var audioId='gc-audio-'+userId;
      var audioEl=document.getElementById(audioId);
      if(!audioEl){audioEl=document.createElement('audio');audioEl.id=audioId;document.body.appendChild(audioEl);}
      audioEl.srcObject=e.streams[0];
      audioEl.autoplay=true;
      audioEl.play().catch(function(){});
      // Update video tile if video call
      _gcUpdateTile(userId);
    }
  };

  peer.onconnectionstatechange=function(){
    if(peer.connectionState==='connected'){
      set_gcConnectedCount(_gcConnectedCount+1);
      _gcUpdateStatus();
      if(_callState!=='connected'){
        _callConnected();
      }
    }else if(peer.connectionState==='disconnected'||peer.connectionState==='failed'){
      _gcRemovePeer(userId);
      _gcUpdateStatus();
    }
  };

  peer.oniceconnectionstatechange=function(){
    if(peer.iceConnectionState==='connected'||peer.iceConnectionState==='completed'){
      if(_callState!=='connected')_callConnected();
    }
  };

  if(isInitiator){
    peer.createOffer({offerToReceiveAudio:true,offerToReceiveVideo:_callType==='video'}).then(function(offer){
      return peer.setLocalDescription(offer);
    }).then(function(){
      _gcSignalChannel.send({type:'broadcast',event:'gc-signal',payload:{
        from:ME.id,to:userId,type:'offer',sdp:peer.localDescription,callType:_callType
      }});
    }).catch(function(e){console.error('[GC] Offer creation failed:',e);});
  }
}

export function _gcRemovePeer(userId){
  if(_gcPeers[userId]){try{_gcPeers[userId].close();}catch(e){/* cleanup */}delete _gcPeers[userId];}
  if(_gcStreams[userId])delete _gcStreams[userId];
  if(_gcIceQueues[userId])delete _gcIceQueues[userId];
  // Remove audio element
  var audioEl=document.getElementById('gc-audio-'+userId);if(audioEl)audioEl.remove();
  // Remove video tile
  var tile=document.getElementById('gc-tile-'+userId);if(tile)tile.remove();
  set_gcConnectedCount(Object.keys(_gcPeers).length);
  // If no peers left and we're the only one, keep call alive (waiting for others)
}

export function _gcUpdateStatus(){
  var connected=0;
  Object.keys(_gcPeers).forEach(function(uid){
    var p=_gcPeers[uid];
    if(p.connectionState==='connected'||p.iceConnectionState==='connected'||p.iceConnectionState==='completed')connected++;
  });
  set_gcConnectedCount(connected);
  var total=_gcCallMembers.length;
  var st=document.getElementById('callStatus');
  if(st){
    if(connected>0){
      st.textContent=connected+' of '+total+' connected';
      st.style.display='';
    }else if(_callState==='ringing'){
      st.textContent='Ringing group…';
      st.style.display='';
    }else{
      st.textContent='Waiting for members…';
      st.style.display='';
    }
  }
}

export function _gcBuildGrid(){
  var grid=document.getElementById('gcVideoGrid');
  if(!grid)return;
  grid.innerHTML='';
  if(_callType==='video'){
    grid.style.display='grid';
    // Self tile
    var selfTile=document.createElement('div');
    selfTile.className='gc-vid-tile gc-tile-self';
    selfTile.id='gc-tile-self';
    var selfVid=document.createElement('video');
    selfVid.muted=true;selfVid.autoplay=true;selfVid.playsInline=true;
    if(window._callStream)selfVid.srcObject=window._callStream;
    selfTile.appendChild(selfVid);
    var selfLabel=document.createElement('div');selfLabel.className='gc-tile-name';selfLabel.textContent='You';
    selfTile.appendChild(selfLabel);
    grid.appendChild(selfTile);
    // Hide the 1-on-1 video wrap for GC
    document.getElementById('callVideoWrap').style.display='none';
    document.getElementById('callAvatarWrap').style.display='none';
  }else{
    grid.style.display='none';
    document.getElementById('callAvatarWrap').style.display='flex';
    document.getElementById('callVideoWrap').style.display='none';
  }
}

export function _gcUpdateTile(userId){
  var grid=document.getElementById('gcVideoGrid');
  if(!grid||_callType!=='video')return;
  grid.style.display='grid';
  var tileId='gc-tile-'+userId;
  var tile=document.getElementById(tileId);
  if(!tile){
    tile=document.createElement('div');
    tile.className='gc-vid-tile';
    tile.id=tileId;
    grid.appendChild(tile);
  }
  tile.innerHTML='';
  var stream=_gcStreams[userId];
  if(stream&&stream.getVideoTracks().length>0){
    var vid=document.createElement('video');
    vid.autoplay=true;vid.playsInline=true;
    vid.srcObject=stream;
    tile.appendChild(vid);
  }else{
    // Avatar fallback
    var avDiv=document.createElement('div');avDiv.className='gc-tile-av';
    var user=REAL_USERS[userId];
    avDiv.textContent=user?(user.username||'?').charAt(0).toUpperCase():'?';
    tile.appendChild(avDiv);
  }
  var label=document.createElement('div');label.className='gc-tile-name';
  var user=REAL_USERS[userId];
  label.textContent=user?user.username:'User';
  tile.appendChild(label);
}

export function _gcCleanup(){
  // Send leave signal
  if(_gcSignalChannel){
    try{_gcSignalChannel.send({type:'broadcast',event:'gc-signal',payload:{from:ME.id,type:'gc-leave'}});}catch(e){/* best-effort leave signal */}
  }
  // Close all peer connections
  Object.keys(_gcPeers).forEach(function(uid){
    try{_gcPeers[uid].close();}catch(e){/* cleanup */}
    var audioEl=document.getElementById('gc-audio-'+uid);if(audioEl)audioEl.remove();
  });
  set_gcPeers({});set_gcStreams({});set_gcIceQueues({});set_gcConnectedCount(0);set_gcCallMembers([]);
  // Remove signaling channel
  if(_gcSignalChannel){try{sb.removeChannel(_gcSignalChannel);}catch(e){/* cleanup */}set_gcSignalChannel(null);}
  // Clear grid
  var grid=document.getElementById('gcVideoGrid');
  if(grid){grid.innerHTML='';grid.style.display='none';}
  set_gcCall(false);set_gcCallId(null);
}
