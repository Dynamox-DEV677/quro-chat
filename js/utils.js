import { ME, chatMode, curChannel, curServer, curDMUser, curGroupChat, DECOR_LIST } from './state.js?v=49';

export function escH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

export function getMsgKey(){
  if(chatMode==='gc'&&curGroupChat)return 'gc_'+curGroupChat.id;
  return chatMode==='dm'?'dm_'+[ME.id,curDMUser.id].sort().join('_'):curServer+'_'+curChannel;
}

export function showLoading(on){document.getElementById('loadingOverlay').classList.toggle('show',on);}

export function isMobile(){return window.innerWidth<=767;}

export function setAvatarEl(wrapId,letter,photo,letterId){
  const wrap=document.getElementById(wrapId);if(!wrap)return;
  const lEl=document.getElementById(letterId);
  wrap.querySelectorAll('img.av-img').forEach(i=>i.remove());
  if(photo){const img=document.createElement('img');img.src=photo;img.className='av-img';img.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:50%;position:absolute;inset:0';wrap.appendChild(img);if(lEl)lEl.style.display='none';}
  else{if(lEl){lEl.textContent=letter;lEl.style.display='';}}
}

export function stk_fmtIN(n){
  if(isNaN(n))return '\u2014';
  return Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
}

export function applyUserBarDecor(){
  ['myAvatarBtn','drawerAvatarBtn'].forEach(function(id){
    var el=document.getElementById(id);if(!el)return;
    el.querySelectorAll('.av-decor').forEach(function(d){d.remove();});
    if(ME.decor&&ME.decor!=='none'){
      var cls=getDecorCls(ME.decor);
      if(cls){var ring=document.createElement('div');ring.className='av-decor '+cls;el.appendChild(ring);}
    }
  });
}

export function getDecorCls(decorId){var d=DECOR_LIST.find(function(x){return x.id===decorId;});return d?d.cls:'';}

export function notify(msg,type='info'){
  var box=document.getElementById('notifBox');if(!box)return;
  var el=document.createElement('div');
  el.className='notif '+type;
  // Icon based on type
  var icons={
    success:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    error:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
  var icon=icons[type]||icons.info;
  el.innerHTML='<span class="notif-icon">'+icon+'</span><span class="notif-text">'+escH(msg)+'</span>';
  // Progress bar for auto-dismiss
  var bar=document.createElement('div');bar.className='notif-progress';el.appendChild(bar);
  box.appendChild(el);
  // Dismiss timeout
  var dur=type==='error'?4000:3000;
  setTimeout(function(){el.classList.add('out');setTimeout(function(){el.remove();},300);},dur);
  // Click to dismiss
  el.addEventListener('click',function(){el.classList.add('out');setTimeout(function(){el.remove();},300);});
}

export function decorRingHTML(decorId){
  if(!decorId||decorId==='none')return '';
  var cls=getDecorCls(decorId);
  return cls?'<div class="av-decor '+cls+'"></div>':'';
}

// ─── Indian Market Hours Check ───
// NSE/BSE: Mon–Fri, 9:15 AM – 3:30 PM IST (UTC+5:30)
export function isIndianMarketOpen(){
  var now=new Date();
  // Convert to IST
  var utc=now.getTime()+now.getTimezoneOffset()*60000;
  var ist=new Date(utc+5.5*3600000);
  var day=ist.getDay(); // 0=Sun,6=Sat
  if(day===0||day===6) return false;
  var h=ist.getHours(), m=ist.getMinutes(), t=h*60+m;
  // 9:15 AM = 555 min, 3:30 PM = 930 min
  return t>=555&&t<=930;
}

export function getMarketStatusInfo(){
  var now=new Date();
  var utc=now.getTime()+now.getTimezoneOffset()*60000;
  var ist=new Date(utc+5.5*3600000);
  var day=ist.getDay(), h=ist.getHours(), m=ist.getMinutes(), t=h*60+m;

  if(day===0||day===6){
    // Weekend — calculate next Monday 9:15 AM
    var daysUntilMon=day===0?1:2;
    return {open:false, reason:'Weekend', hint:'Markets reopen Monday at 9:15 AM IST', daysAway:daysUntilMon};
  }
  if(t<555){
    var minsLeft=555-t;
    var hh=Math.floor(minsLeft/60), mm=minsLeft%60;
    return {open:false, reason:'Pre-market', hint:'Opens in '+(hh>0?hh+'h ':'')+mm+'m (9:15 AM IST)'};
  }
  if(t>930){
    return {open:false, reason:'Market closed', hint:'Reopens tomorrow at 9:15 AM IST'};
  }
  return {open:true, reason:'Market open'};
}
