// ═══════════════════════════════════════
// MEMBERS Module
// ═══════════════════════════════════════
import { sb } from './config.js';
import { ME, REAL_USERS, setREAL_USERS, membersOpen, setMembersOpen } from './state.js';
import { escH, decorRingHTML } from './utils.js';
import { openProfilePopup } from './profile.js';

var _failCount=0; // backoff counter for REST failures

export async function fetchUsers(){
  try{
    if(!ME||!ME.id)return;
    if(_failCount>3&&Math.random()>0.3)return; // skip some calls during backoff
    const{data,error}=await sb.from('profiles').select('id,username,avatar,photo,last_seen,name_font,name_color,nameplate,about,banner,contact_email,decor').neq('id',ME.id);
    if(error){_failCount=Math.min(_failCount+1,10);return;}
    _failCount=Math.max(0,_failCount-1);
    if(data){
      const now=Date.now();
      setREAL_USERS(data.map(u=>{
        const diff=u.last_seen?now-new Date(u.last_seen).getTime():Infinity;
        const status=diff<90000?'on':diff<300000?'idle':'off';
        return{id:u.id,username:u.username,avatar:u.avatar||u.username.charAt(0).toUpperCase(),photo:u.photo||'',status,name_font:u.name_font||'default',name_color:u.name_color||'',nameplate:u.nameplate||'',about:u.about||'',banner:u.banner||'b1',contact_email:u.contact_email||'',decor:u.decor||'none'};
      }));
    }
  }catch(e){_failCount=Math.min(_failCount+1,10);}
}

export async function updatePresence(){
  try{
    if(!ME||!ME.id)return;
    if(_failCount>3)return; // skip when connection is down
    const{error}=await sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',ME.id);
    if(error)_failCount=Math.min(_failCount+1,10);
    else _failCount=Math.max(0,_failCount-1);
  }catch(e){_failCount=Math.min(_failCount+1,10);}
}

export function buildMembers(){
  const list=document.getElementById('membersList');
  const meUser={id:ME.id,username:ME.username,avatar:ME.avatar,photo:ME.photo||'',role:'Online',dot:'on',name_font:ME.name_font||'default',name_color:ME.name_color||'',nameplate:ME.nameplate||'',about:ME.about||'',banner:ME.banner||'b1',contact_email:ME.contact_email||'',decor:ME.decor||'none'};
  const all=[meUser,...REAL_USERS.map(u=>({id:u.id,username:u.username,avatar:u.avatar,photo:u.photo||'',role:u.status==='on'?'Online':u.status==='idle'?'Idle':'Offline',dot:u.status,name_font:u.name_font||'default',name_color:u.name_color||'',nameplate:u.nameplate||'',about:u.about||'',banner:u.banner||'b1',contact_email:u.contact_email||'',decor:u.decor||'none'}))];
  list.innerHTML='';var sk=document.getElementById('memberSkeleton');if(sk)sk.remove();
  all.forEach(function(m){
    var el=document.createElement('div');el.className='mb-item';el.style.cursor='pointer';
    el.innerHTML=`<div class="mb-av" style="position:relative;overflow:visible">${m.photo?`<img src="${escH(m.photo)}">`:`<span>${escH(m.avatar)}</span>`}<div class="mb-dot ${m.dot}"></div>${decorRingHTML(m.decor)}</div><div><div class="mb-name nf-${m.name_font}"${m.name_color?' style="color:'+m.name_color+'"':''}>${escH(m.username)}${m.id===ME.id?' (you)':''}</div><div class="mb-role">${escH(m.role)}</div></div>`;
    el.onclick=function(){openProfilePopup(m);};
    list.appendChild(el);
  });
}

export function toggleMembers(){setMembersOpen(!membersOpen);document.getElementById('membersBar').classList.toggle('hidden',!membersOpen);}

// --- Mobile Members Panel ---
export function mobileToggleMembers(){
  var panel=document.getElementById('mobileMembersPanel');
  if(panel.classList.contains('open')){closeMobileMembers();}
  else{openMobileMembers();}
}
export function openMobileMembers(){
  var destList=document.getElementById('mobileMembersList');
  if(!destList)return;
  destList.innerHTML='';
  var meUser={id:ME.id,username:ME.username,avatar:ME.avatar,photo:ME.photo||'',role:'Online',dot:'on',name_font:ME.name_font||'default',name_color:ME.name_color||'',nameplate:ME.nameplate||'',about:ME.about||'',banner:ME.banner||'b1',contact_email:ME.contact_email||'',decor:ME.decor||'none'};
  var all=[meUser].concat(REAL_USERS.map(function(u){return{id:u.id,username:u.username,avatar:u.avatar,photo:u.photo||'',role:u.status==='on'?'Online':u.status==='idle'?'Idle':'Offline',dot:u.status,name_font:u.name_font||'default',name_color:u.name_color||'',nameplate:u.nameplate||'',about:u.about||'',banner:u.banner||'b1',contact_email:u.contact_email||'',decor:u.decor||'none'};}));
  all.forEach(function(m){
    var el=document.createElement('div');el.className='mb-item';el.style.cursor='pointer';
    el.innerHTML='<div class="mb-av" style="position:relative;overflow:visible">'+(m.photo?'<img src="'+escH(m.photo)+'">':'<span>'+escH(m.avatar)+'</span>')+'<div class="mb-dot '+m.dot+'"></div>'+decorRingHTML(m.decor)+'</div><div><div class="mb-name nf-'+m.name_font+'"'+(m.name_color?' style="color:'+m.name_color+'"':'')+'>'+ escH(m.username)+(m.id===ME.id?' (you)':'')+'</div><div class="mb-role">'+escH(m.role)+'</div></div>';
    el.onclick=function(){openProfilePopup(m);};
    destList.appendChild(el);
  });
  document.getElementById('mobileMembersPanel').classList.add('open');
  document.querySelectorAll('.mob-nav-btn').forEach(function(b){b.classList.remove('active');});
  var mn=document.getElementById('mnMembers');if(mn)mn.classList.add('active');
}
export function closeMobileMembers(){
  var panel=document.getElementById('mobileMembersPanel');
  if(panel)panel.classList.remove('open');
}
