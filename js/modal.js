// ═══ Custom Modal System — replaces native confirm() and prompt() ═══

var _modalEl=null;
var _resolve=null;

function _ensureModal(){
  if(_modalEl)return;
  _modalEl=document.createElement('div');
  _modalEl.id='quroModal';
  _modalEl.className='qm-overlay';
  _modalEl.innerHTML='<div class="qm-card"><div class="qm-body"><div class="qm-icon"></div><div class="qm-title"></div><div class="qm-desc"></div><input class="qm-input" type="text" autocomplete="off" spellcheck="false"></div><div class="qm-actions"></div></div>';
  _modalEl.addEventListener('click',function(e){if(e.target===_modalEl)_dismiss();});
  document.body.appendChild(_modalEl);
  // Escape key
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&_modalEl.classList.contains('open'))_dismiss();
  });
}

function _dismiss(){
  if(!_resolve)return;
  _resolve(null);
  _resolve=null;
  _modalEl.classList.remove('open');
}

function _show(opts){
  _ensureModal();
  var card=_modalEl.querySelector('.qm-card');
  var icon=_modalEl.querySelector('.qm-icon');
  var title=_modalEl.querySelector('.qm-title');
  var desc=_modalEl.querySelector('.qm-desc');
  var input=_modalEl.querySelector('.qm-input');
  var actions=_modalEl.querySelector('.qm-actions');

  // Icon
  if(opts.icon){icon.innerHTML=opts.icon;icon.style.display='';}
  else icon.style.display='none';

  title.textContent=opts.title||'';
  desc.textContent=opts.desc||'';
  desc.style.display=opts.desc?'':'none';

  // Input (for prompt mode)
  if(opts.input){
    input.style.display='';
    input.value=opts.inputValue||'';
    input.placeholder=opts.inputPlaceholder||'';
  }else{
    input.style.display='none';
  }

  // Variant class on card
  card.className='qm-card'+(opts.variant?' qm-'+opts.variant:'');

  // Build action buttons
  var html='';
  if(opts.cancelText!==false){
    html+='<button class="qm-btn qm-cancel">'+(opts.cancelText||'Cancel')+'</button>';
  }
  html+='<button class="qm-btn qm-confirm qm-'+(opts.variant||'default')+'">'+(opts.confirmText||'OK')+'</button>';
  actions.innerHTML=html;

  // Wire up buttons
  var cancelBtn=actions.querySelector('.qm-cancel');
  var confirmBtn=actions.querySelector('.qm-confirm');
  if(cancelBtn)cancelBtn.onclick=function(){_dismiss();};
  confirmBtn.onclick=function(){
    if(_resolve){
      if(opts.input){_resolve(input.value);}
      else{_resolve(true);}
      _resolve=null;
    }
    _modalEl.classList.remove('open');
  };

  _modalEl.classList.add('open');

  // Focus
  if(opts.input){
    setTimeout(function(){input.focus();input.select();},50);
    input.onkeydown=function(e){if(e.key==='Enter')confirmBtn.click();};
  }else{
    setTimeout(function(){confirmBtn.focus();},50);
  }
}

// ─── Public API ───

// Returns Promise<boolean>
export function qConfirm(title,desc,opts){
  return new Promise(function(resolve){
    _resolve=resolve;
    _show(Object.assign({title:title,desc:desc||'',variant:'danger',icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',confirmText:'Confirm'},opts||{}));
  });
}

// Returns Promise<string|null>
export function qPrompt(title,defaultValue,opts){
  return new Promise(function(resolve){
    _resolve=resolve;
    _show(Object.assign({title:title,input:true,inputValue:defaultValue||'',variant:'default',confirmText:'Save'},opts||{}));
  });
}

// Returns Promise<boolean> — softer/info style
export function qAlert(title,desc,opts){
  return new Promise(function(resolve){
    _resolve=resolve;
    _show(Object.assign({title:title,desc:desc||'',variant:'info',cancelText:false,confirmText:'OK',icon:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'},opts||{}));
  });
}
