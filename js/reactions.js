// ═══ REPLIES, EDIT/DELETE, REACTIONS ═══
import { sb } from './config.js';
import { ME } from './state.js';
import { notify } from './utils.js';
import { qConfirm, qPrompt } from './modal.js';

// ─── Reply ───
var replyTo=null;

export function setReply(msgId,author,text){
  replyTo={id:msgId,author:author,text:text};
  document.getElementById('rsWho').textContent='Replying to @'+author;
  document.getElementById('rsTxt').textContent=text||'\u2026';
  document.getElementById('replyStrip').classList.add('show');
  document.getElementById('msgInput').focus();
}

export function clearReply(){
  replyTo=null;
  document.getElementById('replyStrip').classList.remove('show');
}

// ─── Edit / Delete ───
export async function editMsg(msgId,currentText){
  var newText=await qPrompt('Edit your message',currentText);
  if(newText===null)return;
  newText=newText.trim();
  if(!newText){var del=await qConfirm('Delete message','This message will be removed permanently.');if(del)deleteMsg(msgId,true);return;}
  sb.from('messages').update({text:newText}).eq('id',msgId).then(function(res){
    if(res.error){notify('Edit failed: '+res.error.message,'error');return;}
    var el=document.querySelector('[data-msgid="'+msgId+'"]');
    if(el){
      var t=el.querySelector('.msg-text');
      if(t)t.innerHTML=renderMsgContent(newText)+'<span style="font-size:9px;color:rgba(255,255,255,.2);margin-left:6px">(edited)</span>';
    }
    notify('Message edited','success');
  });
}

export async function deleteMsg(msgId,skipConfirm){
  if(!skipConfirm){var ok=await qConfirm('Delete message','This message will be removed permanently.');if(!ok)return;}
  sb.from('messages').delete().eq('id',msgId).then(function(res){
    if(res.error){notify('Delete failed: '+res.error.message,'error');return;}
    var el=document.querySelector('[data-msgid="'+msgId+'"]');
    if(el)el.remove();
  });
}

// ─── Reactions (in-memory, per session) ───
var msgReactions={};
export var QUICK_REACTS=['\ud83d\udc4d','\u2764\ufe0f','\ud83d\ude02','\ud83d\udd25','\ud83d\ude2e','\ud83d\ude22','\ud83c\udf89','\u2728','\ud83d\udcaf','\ud83e\udd14'];

export function showReactPicker(msgId,btnEl){
  var picker=document.getElementById('reactPicker');
  picker.innerHTML=QUICK_REACTS.map(function(e){
    return '<button class="rp-btn" onclick="doReact(\''+msgId+'\',\''+e+'\')">'+e+'</button>';
  }).join('');
  var rect=btnEl.getBoundingClientRect();
  var top=rect.top-52;
  if(top<10)top=rect.bottom+5;
  var left=Math.min(rect.left,window.innerWidth-260);
  picker.style.top=top+'px';picker.style.left=Math.max(8,left)+'px';
  picker.classList.add('open');
  picker.dataset.formsgid=msgId;
}

export function closeReactPicker(){
  document.getElementById('reactPicker').classList.remove('open');
}

export function doReact(msgId,emoji){
  closeReactPicker();
  if(!ME)return;
  if(!msgReactions[msgId])msgReactions[msgId]={};
  if(!msgReactions[msgId][emoji])msgReactions[msgId][emoji]=[];
  var arr=msgReactions[msgId][emoji];
  var idx=arr.indexOf(ME.id);
  if(idx===-1)arr.push(ME.id);else arr.splice(idx,1);
  if(!arr.length)delete msgReactions[msgId][emoji];
  var el=document.querySelector('[data-msgid="'+msgId+'"]');
  if(el){var rxnEl=el.querySelector('.msg-reactions');if(rxnEl)renderMsgReactions(msgId,rxnEl);}
}

export function renderMsgReactions(msgId,container){
  var reacts=msgReactions[msgId]||{};
  var html='';
  Object.keys(reacts).forEach(function(emoji){
    var users=reacts[emoji];if(!users.length)return;
    var isMe=users.indexOf(ME.id)!==-1;
    html+='<span class="rxn'+(isMe?' me':'')+'" onclick="doReact(\''+msgId+'\',\''+emoji+'\')">'+emoji+'<span class="rxn-count">'+users.length+'</span></span>';
  });
  container.innerHTML=html;
}

// Close reaction picker when clicking outside
document.addEventListener('click',function(e){
  var picker=document.getElementById('reactPicker');
  if(picker&&picker.classList.contains('open')&&!picker.contains(e.target)){closeReactPicker();}
});
