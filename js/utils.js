import { ME, chatMode, curChannel, curServer, curDMUser, curGroupChat, DECOR_LIST } from './state.js';

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

export function notify(msg,type='info'){const box=document.getElementById('notifBox');const el=document.createElement('div');el.className='notif '+type;el.textContent=msg;box.appendChild(el);setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),350);},3000);}

export function decorRingHTML(decorId){
  if(!decorId||decorId==='none')return '';
  var cls=getDecorCls(decorId);
  return cls?'<div class="av-decor '+cls+'"></div>':'';
}
