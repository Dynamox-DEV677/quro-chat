// ═══════════════════════════════════════
// MESSAGING Module — performance-optimized
// ═══════════════════════════════════════
import { sb } from './config.js';
import { ME, REAL_USERS, chatMode, curChannel, curDMUser, curGroupChat, realtimeSub, setRealtimeSub, _pollTimer, set_pollTimer, _lastSeenId, set_lastSeenId, _rtConnected, set_rtConnected, myMsgCount, setMyMsgCount, MSG_DAILY_LIMIT, replyTo, _dmLastMsg, msgReactions } from './state.js';
import { escH, getMsgKey, notify, decorRingHTML } from './utils.js';
import { playNotifSound, showDesktopNotif } from './notifications.js';
import { _setupTypingChannel } from './typing.js';
import { clearReply, renderMsgReactions, setReply, editMsg, deleteMsg, showReactPicker } from './reactions.js';
import { openProfilePopup } from './profile.js';
import { buildDMList } from './dm.js';

// ── Perf: track rendered message IDs in a Set instead of DOM queries ──
var _renderedMsgIds=new Set();

export function _stopPoll(){if(_pollTimer){clearInterval(_pollTimer);set_pollTimer(null);}}

export async function _pollNewMsgs(){
  if(!ME)return;
  try{
    const key=getMsgKey();
    let q=sb.from('messages').select('*').eq('server_channel',key).order('created_at',{ascending:true});
    if(_lastSeenId) q=q.gt('id',_lastSeenId);
    else q=q.limit(1);
    const{data}=await q;
    if(data&&data.length){
      data.forEach(m=>{if(!_renderedMsgIds.has(m.id))appendMessage(m);});
      set_lastSeenId(data[data.length-1].id);
    }
  }catch(e){/* poll fail — next interval retries */}
}

export async function subscribeAndRender(){
  _stopPoll(); set_rtConnected(false); set_lastSeenId(null);
  _renderedMsgIds.clear();
  if(realtimeSub){try{await sb.removeChannel(realtimeSub);}catch(e){/* cleanup */}setRealtimeSub(null);}
  _setupTypingChannel(getMsgKey());
  await fetchAndRenderMessages();
  const key=getMsgKey();
  setRealtimeSub(sb.channel('chat:'+key)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`server_channel=eq.${key}`},payload=>{
      const m=payload.new;
      if(!_renderedMsgIds.has(m.id)){appendMessage(m);}
      set_lastSeenId(m.id);
      if(m.user_id!==ME.id&&document.hidden){
        playNotifSound();
        var chLabel=chatMode==='gc'?(curGroupChat?curGroupChat.name:'Group'):chatMode==='dm'?(curDMUser?curDMUser.username:'DM'):'#'+curChannel;
        showDesktopNotif(escH(m.author||'Someone')+' in '+chLabel,(m.text||'').slice(0,100),m.photo||'huddleicon.png');
      }
    })
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'messages',filter:`server_channel=eq.${key}`},payload=>{
      const m=payload.new;
      const el=document.querySelector(`[data-msgid="${m.id}"]`);
      if(el){const t=el.querySelector('.msg-text');if(t)t.innerHTML=renderMsgContent(m.text)+'<span style="font-size:9px;color:rgba(255,255,255,.2);margin-left:6px">(edited)</span>';}
    })
    .on('postgres_changes',{event:'DELETE',schema:'public',table:'messages'},payload=>{
      const el=document.querySelector(`[data-msgid="${payload.old.id}"]`);
      if(el)el.remove();
      _renderedMsgIds.delete(payload.old.id);
    })
    .subscribe(status=>{
      if(status==='SUBSCRIBED'){
        set_rtConnected(true);
        _stopPoll();
      } else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
        set_rtConnected(false);
        if(!_pollTimer) set_pollTimer(setInterval(_pollNewMsgs,3000));
      }
    }));
  // Fallback poll — stop once realtime connects
  if(!_pollTimer) set_pollTimer(setInterval(_pollNewMsgs,3000));
  setTimeout(()=>{if(_rtConnected)_stopPoll();},4000);
}

export async function fetchAndRenderMessages(){
  const key=getMsgKey();const wrap=document.getElementById('msgsWrap');
  const msgSkel=document.getElementById('msgSkeleton');const msgEmpty=document.getElementById('msgEmpty');
  if(msgSkel)msgSkel.style.display='';if(msgEmpty)msgEmpty.style.display='none';
  wrap.querySelectorAll('.msg,.empty,.dm-banner').forEach(e=>e.remove());
  _renderedMsgIds.clear();
  const{data:msgs,error}=await sb.from('messages').select('*').eq('server_channel',key).order('created_at',{ascending:true}).limit(200);
  if(msgSkel)msgSkel.style.display='none';
  if(error){wrap.innerHTML=`<div class="empty"><div class="empty-icon" style="opacity:.15"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><div class="empty-title">Could not load</div><div class="empty-sub">${escH(error.message)}</div></div>`;return;}
  if(!msgs||msgs.length===0){
    if(chatMode==='dm'){const u=curDMUser;wrap.innerHTML=`<div class="dm-banner"><div class="dm-banner-av">${u.photo?`<img src="${escH(u.photo)}">`:`<span>${escH(u.avatar)}</span>`}</div><div class="dm-banner-name nf-${u.name_font||'default'}">${escH(u.username)}</div><div class="dm-banner-sub">Start of your conversation with <strong class="nf-${u.name_font||'default'}">${escH(u.username)}</strong>.</div></div>`;}
    else if(chatMode==='gc'&&curGroupChat){var gc=curGroupChat;var ini=gc.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();wrap.innerHTML=`<div class="dm-banner"><div class="dm-banner-av" style="border-radius:10px">${gc.icon?`<img src="${escH(gc.icon)}" style="border-radius:10px">`:`<span>'+ini+'</span>`}</div><div class="dm-banner-name">${escH(gc.name)}</div><div class="dm-banner-sub">Start of <strong>${escH(gc.name)}</strong> — ${gc.members.length} members</div></div>`;}
    else{wrap.innerHTML=`<div class="empty"><div class="empty-icon" style="opacity:.15"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><div class="empty-title">#${escH(curChannel)}</div><div class="empty-sub">Be the first to say something!</div></div>`;}
    return;
  }
  // ── Perf: batch all messages into a DocumentFragment — single DOM write ──
  var frag=document.createDocumentFragment();
  msgs.forEach(m=>_buildMsgEl(m,frag));
  wrap.innerHTML='';
  wrap.appendChild(frag);
  // ── Perf: defer scroll to next frame to avoid forced reflow ──
  requestAnimationFrame(()=>{wrap.scrollTop=wrap.scrollHeight;});
}

// Build message element without appending (for batching)
function _buildMsgEl(m,container){
  const isOwn=m.user_id===ME.id;const el=document.createElement('div');el.className='msg'+(isOwn?' msg-own':'');if(m.id){el.dataset.msgid=m.id;_renderedMsgIds.add(m.id);}
  var mid=m.id||'';
  var plain=_plainText(m.text||'');
  var safeAuthor=escH(m.author||'');
  var safePlain=plain.slice(0,80).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  var actBtns='<div class="msg-acts">'+
    '<button class="msg-act" onclick="showReactPicker(\''+mid+'\',this)" title="React"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:-1px"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> React</button>'+
    '<button class="msg-act" onclick="setReply(\''+mid+'\',\''+safeAuthor.replace(/'/g,"\\'")+'\',' +'\''+safePlain+'\')" title="Reply"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:-1px"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg> Reply</button>'+
    (isOwn&&mid?'<button class="msg-act" onclick="editMsg(\''+mid+'\',\''+safePlain+'\')" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:-1px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button>'+
    '<button class="msg-act del" onclick="deleteMsg(\''+mid+'\')" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:-1px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Delete</button>':'')+'</div>';
  var fontCls='nf-'+(m.name_font||'default');
  var nameStyle='cursor:pointer'+(m.name_color?';color:'+m.name_color:'');
  var _msgDecor='none';if(m.user_id===ME.id){_msgDecor=ME.decor||'none';}else{var _du=REAL_USERS.find(function(x){return x.id===m.user_id;});if(_du)_msgDecor=_du.decor||'none';}
  el.innerHTML=`<div class="msg-av" style="cursor:pointer;overflow:visible" data-uid="${m.user_id||''}">${m.photo?`<img src="${escH(m.photo)}" loading="lazy">`:`<span>${escH(m.avatar||'?')}</span>`}${decorRingHTML(_msgDecor)}</div><div class="msg-body"><div class="msg-meta"><span class="msg-author ${fontCls}" style="${nameStyle}" data-uid="${m.user_id||''}">${escH(m.author)}</span><span class="msg-time">${escH(m.time||'')}</span></div><div class="msg-text">${renderMsgContent(m.text)}</div><div class="msg-reactions" id="rxn_${mid}"></div>${actBtns}</div>`;
  el.querySelectorAll('[data-uid]').forEach(function(e){e.onclick=function(ev){ev.stopPropagation();var uid=e.dataset.uid;if(!uid)return;if(uid===ME.id){openProfilePopup(ME);return;}var u=REAL_USERS.find(function(x){return x.id===uid;});if(u){openProfilePopup(u);}else{openProfilePopup({id:uid,username:m.author||'Unknown',avatar:m.avatar||'?',photo:m.photo||'',name_font:'default',name_color:'',nameplate:'',about:'',banner:'b1',decor:'none',contact_email:''});}};});
  if(mid&&msgReactions[mid]){var rxnEl=el.querySelector('.msg-reactions');if(rxnEl)renderMsgReactions(mid,rxnEl);}
  container.appendChild(el);
  return el;
}

export function appendMessage(m,scroll=true){
  const wrap=document.getElementById('msgsWrap');
  const empty=wrap.querySelector('.empty,.dm-banner');if(empty)empty.remove();
  const msgSkel=document.getElementById('msgSkeleton');if(msgSkel)msgSkel.style.display='none';
  const msgEmpty=document.getElementById('msgEmpty');if(msgEmpty)msgEmpty.style.display='none';
  if(m.id)_renderedMsgIds.add(m.id);
  _buildMsgEl(m,wrap);
  // ── Perf: defer scrollTop to avoid forced sync reflow ──
  if(scroll)requestAnimationFrame(()=>{wrap.scrollTop=wrap.scrollHeight;});
}

export async function fetchMyMsgCount(){
  if(!ME)return;
  var todayStart=new Date();todayStart.setHours(0,0,0,0);
  var res=await sb.from('messages').select('id',{count:'exact',head:true}).eq('user_id',ME.id).gte('created_at',todayStart.toISOString());
  setMyMsgCount(res.count||0);
}

var _sendingMsg=false;
export async function sendMsg(){
  if(!ME||_sendingMsg)return;
  var input=document.getElementById('msgInput');var text=input.value.trim();if(!text)return;
  if(myMsgCount>=MSG_DAILY_LIMIT){
    notify('Daily limit reached ('+MSG_DAILY_LIMIT+' messages/day). Try again tomorrow!','error');
    return;
  }
  _sendingMsg=true;
  var sendBtn=document.getElementById('sendBtn');if(sendBtn)sendBtn.disabled=true;
  input.value='';input.style.height='auto';
  if(replyTo){
    var preview=replyTo.text.slice(0,60);
    text='[reply]'+replyTo.author+'|'+preview+'[/reply]'+text;
    clearReply();
  }
  const{error}=await sb.from('messages').insert({server_channel:getMsgKey(),user_id:ME.id,author:ME.username,avatar:ME.avatar,photo:ME.photo||null,text,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),name_font:ME.name_font||'default',name_color:ME.name_color||''});
  _sendingMsg=false;if(sendBtn)sendBtn.disabled=false;
  if(error){notify('Send failed: '+error.message,'error');input.value=text.replace(/^\[reply\][^\[]*\[\/reply\]/,'');}
  else{
    setMyMsgCount(myMsgCount+1);
    if(chatMode==='dm'||chatMode==='gc'){var mk=getMsgKey();_dmLastMsg[mk]=new Date().toISOString();buildDMList();}
    var left=MSG_DAILY_LIMIT-myMsgCount;
    if(left<=10&&left>0)notify(left+' messages left today','info');
    if(left===0)notify('Daily limit reached! No more messages today.','error');
  }
}
export function inputKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}

// ── Perf: debounced growInput — avoids forced reflow on every keystroke ──
var _growRaf=0;
export function growInput(el){
  cancelAnimationFrame(_growRaf);
  _growRaf=requestAnimationFrame(()=>{el.style.height='auto';el.style.height=Math.min(el.scrollHeight,100)+'px';});
}

// ── Perf: pre-compiled tag patterns for renderMsgContent ──
var _tagDefs=[
  {tag:'img',open:'[img]',close:'[/img]'},
  {tag:'vid',open:'[vid]',close:'[/vid]'},
  {tag:'audio',open:'[audio]',close:'[/audio]'},
  {tag:'file',open:'[file]',close:'[/file]'}
];

export function renderMsgContent(raw){
  if(!raw) return '';
  // VC started system message
  if(raw.indexOf('[vc-started]')===0){
    var vcText=raw.replace('[vc-started] ','');
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(61,168,122,.08);border:1px solid rgba(61,168,122,.15);border-radius:8px;font-size:13px;color:rgba(61,168,122,.9)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;flex-shrink:0"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>'+escH(vcText)+'</div>';
  }
  if(raw.indexOf('[call-started]')===0){
    var csText=raw.replace('[call-started] ','');
    return '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(61,168,122,.08);border:1px solid rgba(61,168,122,.15);border-radius:10px;font-size:13px;color:rgba(61,168,122,.9)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;flex-shrink:0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'+escH(csText)+'</div>';
  }
  // Trade feed message
  if(raw.indexOf('[trade]')===0 && raw.indexOf('[/trade]')!==-1){
    var tradeInner=raw.slice(7,raw.indexOf('[/trade]'));
    var tp=tradeInner.split('|');
    // action|symbol|stockName|shares|price|pnl
    var tAction=tp[0]||'buy', tSym=tp[1]||'', tName=tp[2]||tSym, tShares=tp[3]||'0', tPrice=tp[4]||'0', tPnl=tp[5]||'';
    var isBuy=tAction==='buy';
    var pnlHtml='';
    if(tPnl){
      var pnlUp=parseFloat(tPnl)>=0;
      pnlHtml='<div class="trade-pnl '+(pnlUp?'up':'down')+'">'+(pnlUp?'\u25B2':'\u25BC')+' P&L: \u20B9'+escH(tPnl.replace(/^[+-]/,''))+'</div>';
    }
    return '<div class="msg-trade '+(isBuy?'buy':'sell')+'">'+
      '<div class="trade-badge '+(isBuy?'buy':'sell')+'">'+(isBuy?'BUY':'SELL')+'</div>'+
      '<div class="trade-info">'+
        '<div class="trade-stock"><span class="trade-sym">'+escH(tSym)+'</span> <span class="trade-name">'+escH(tName)+'</span></div>'+
        '<div class="trade-details">'+escH(tShares)+' shares @ \u20B9'+escH(tPrice)+'</div>'+
        pnlHtml+
      '</div>'+
      '<div class="trade-total">\u20B9'+escH((parseFloat(tShares)*parseFloat(tPrice)).toLocaleString('en-IN'))+'</div>'+
    '</div>';
  }
  if(raw.indexOf('[call-missed]')===0){
    var cmText=raw.replace('[call-missed] ','');
    return '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(224,80,80,.08);border:1px solid rgba(224,80,80,.15);border-radius:10px;font-size:13px;color:rgba(224,80,80,.9)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;flex-shrink:0"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>'+escH(cmText)+'</div>';
  }
  var replyHtml='';
  raw=raw.replace(/^\[reply\]([^\[]*)\[\/reply\]/,function(m,inner){
    var pipe=inner.indexOf('|');
    var who=pipe!==-1?inner.slice(0,pipe):inner;
    var txt=pipe!==-1?inner.slice(pipe+1):'';
    replyHtml='<div class="reply-quote"><div class="rq-who">\u21a9 @'+escH(who)+'</div><div class="rq-text">'+escH(txt)+'</div></div>';
    return '';
  });
  raw=raw.trim();
  let result=replyHtml, rem=raw;
  while(rem.length){
    // ── Perf: reuse tag defs instead of allocating new arrays each iteration ──
    var bestTag=null,bestPos=Infinity;
    for(var ti=0;ti<_tagDefs.length;ti++){
      var pos=rem.indexOf(_tagDefs[ti].open);
      if(pos!==-1&&pos<bestPos){bestPos=pos;bestTag=_tagDefs[ti];}
    }
    if(!bestTag){result+=escH(rem);break;}
    result+=escH(rem.slice(0,bestPos));
    rem=rem.slice(bestPos);
    var end=rem.indexOf(bestTag.close);
    if(end===-1){result+=escH(rem);break;}
    var inner=rem.slice(bestTag.open.length,end);
    if(bestTag.tag==='img'){
      result+=`<img src="${escH(inner)}" class="msg-img" onclick="window.open(this.src,'_blank')" loading="lazy">`;
    }else if(bestTag.tag==='vid'){
      result+=`<video src="${escH(inner)}" class="msg-vid" controls preload="metadata" playsinline onclick="event.stopPropagation()"></video>`;
    }else if(bestTag.tag==='audio'){
      var pipe=inner.indexOf('|');
      var aName=pipe!==-1?inner.slice(0,pipe):'Audio';
      var aUrl=pipe!==-1?inner.slice(pipe+1):inner;
      result+=`<div style="margin-top:6px"><div style="font-size:12px;color:rgba(255,255,255,.45);margin-bottom:3px;display:flex;align-items:center;gap:5px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>${escH(aName)}</div><audio src="${escH(aUrl)}" class="msg-audio" controls preload="metadata"></audio></div>`;
    }else{
      var pipe=inner.indexOf('|');
      var name=pipe!==-1?inner.slice(0,pipe):inner;
      var url=pipe!==-1?inner.slice(pipe+1):'#';
      var ext=(name.split('.').pop()||'').toLowerCase();
      var _fIcons={'pdf':'\ud83d\udcc4','doc':'\ud83d\udcdd','docx':'\ud83d\udcdd','txt':'\ud83d\udcc4','zip':'\ud83d\udce6','rar':'\ud83d\udce6','7z':'\ud83d\udce6','csv':'\ud83d\udcca','xlsx':'\ud83d\udcca','pptx':'\ud83d\udcca','apk':'\ud83d\udcf1','py':'\ud83d\udcbb','js':'\ud83d\udcbb','html':'\ud83d\udcbb','css':'\ud83d\udcbb','json':'\ud83d\udcbb'};
      var icon=_fIcons[ext]||'\ud83d\udcce';
      result+=`<a href="${escH(url)}" target="_blank" download="${escH(name)}" class="msg-file"><span class="msg-file-icon">${icon}</span>${escH(name)}</a>`;
    }
    rem=rem.slice(end+bestTag.close.length);
  }
  return result;
}

export function _plainText(raw){return (raw||'').replace(/^\[reply\][^\[]*\[\/reply\]/,'').replace(/\[img\][^\[]*\[\/img\]/g,'[image]').replace(/\[vid\][^\[]*\[\/vid\]/g,'[video]').replace(/\[audio\][^\[]*\[\/audio\]/g,'[audio]').replace(/\[file\][^\[]*\[\/file\]/g,'[file]').replace(/\[trade\][^\[]*\[\/trade\]/g,'[trade]').trim();}

let _searchTimer = null;

export function openSearch() {
  const panel = document.getElementById('searchPanel');
  panel.classList.add('open');
  document.getElementById('searchInput').focus();
}

export function closeSearch() {
  const panel = document.getElementById('searchPanel');
  panel.classList.remove('open');
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').innerHTML = '';
}

export async function searchMsgs(query) {
  clearTimeout(_searchTimer);
  const results = document.getElementById('searchResults');
  if (!query || query.length < 2) { results.innerHTML = ''; return; }
  _searchTimer = setTimeout(async () => {
    const key = getMsgKey();
    const { data, error } = await sb.from('messages').select('*')
      .eq('server_channel', key)
      .ilike('text', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error || !data) { results.innerHTML = '<div class="sr-empty">Search failed</div>'; return; }
    if (!data.length) { results.innerHTML = '<div class="sr-empty">No results found</div>'; return; }
    results.innerHTML = `<div class="sr-count">${data.length} result${data.length !== 1 ? 's' : ''}</div>` +
      data.map(m => {
        const safeText = escH(m.text || '').replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>');
        return `<div class="sr-item" onclick="scrollToMsg('${m.id}')"><div><span class="sr-author">${escH(m.author)}</span><span class="sr-time">${new Date(m.created_at).toLocaleString()}</span></div><div class="sr-text">${safeText}</div></div>`;
      }).join('');
  }, 300);
}

export function scrollToMsg(id) {
  const el = document.querySelector(`[data-msgid="${id}"]`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.background = 'var(--primary-dim)';
    setTimeout(() => { el.style.background = ''; }, 2000);
  }
  closeSearch();
}
