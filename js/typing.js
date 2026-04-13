// ═══ TYPING INDICATORS ═══
import { sb } from './config.js?v=48';
import { ME } from './state.js?v=48';

var _typingChannel=null;
var _typingUsers={};
var _typingCleanInt=null;

export function _clearTypingChannel(){
  if(_typingChannel){try{sb.removeChannel(_typingChannel);}catch(e){/* cleanup */}  _typingChannel=null;}
  _typingUsers={};
  if(_typingCleanInt){clearInterval(_typingCleanInt);_typingCleanInt=null;}
  var bar=document.getElementById('typingBar');if(bar)bar.innerHTML='';
}

export function _setupTypingChannel(key){
  _clearTypingChannel();
  _typingChannel=sb.channel('typ:'+key);
  _typingChannel.on('broadcast',{event:'typ'},function(payload){
    if(payload.payload&&ME&&payload.payload.u!==ME.username){
      _typingUsers[payload.payload.u]=Date.now();
      _renderTyping();
    }
  }).subscribe();
  _typingCleanInt=setInterval(_renderTyping,1500);
}

export function _renderTyping(){
  var now=Date.now();
  var active=Object.keys(_typingUsers).filter(function(u){return now-_typingUsers[u]<4000;});
  Object.keys(_typingUsers).forEach(function(u){if(now-_typingUsers[u]>=4000)delete _typingUsers[u];});
  var bar=document.getElementById('typingBar');if(!bar)return;
  if(!active.length){bar.innerHTML='';return;}
  var names=active.slice(0,2).join(', ');
  var verb=active.length===1?' is typing':' are typing';
  bar.innerHTML=names+verb+'&nbsp;<span class="t-dot">\u2022</span><span class="t-dot">\u2022</span><span class="t-dot">\u2022</span>';
}

var _sendTypingThrottle=0;
export function _onInputTyping(){
  if(!_typingChannel||!ME)return;
  var now=Date.now();
  if(now-_sendTypingThrottle<2000)return;
  _sendTypingThrottle=now;
  _typingChannel.send({type:'broadcast',event:'typ',payload:{u:ME.username}});
}
