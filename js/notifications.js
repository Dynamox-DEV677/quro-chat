// ═══ NOTIFICATIONS ═══
import { sb } from './config.js';
import { ME, chatMode, curDMUser, curGroupChat, curServer, curChannel, appMode, notifSound, notifDesktop } from './state.js';
import { escH } from './utils.js';

export function notify(msg,type='info'){
  const box=document.getElementById('notifBox');
  const el=document.createElement('div');
  el.className='notif '+type;
  el.textContent=msg;
  box.appendChild(el);
  setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),350);},3000);
}

export function showDesktopNotif(title,body,icon){
  if(!notifDesktop)return;
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  try{var n=new Notification(title,{body:body,icon:icon||'huddleicon.png',badge:'huddleicon.png',tag:'quro-msg-'+Date.now()});
    n.onclick=function(){window.focus();n.close();};
    setTimeout(function(){n.close();},5000);
  }catch(e){}
}

// ─── Notification Sound ───
var _notifAudio=null;
export function playNotifSound(){
  if(!notifSound)return;
  try{
    if(!_notifAudio){_notifAudio=new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkJWNhXdqYGFufomTnJSMgHNkWl1rfIqWn5mShXdrX1tie4mVnZiRhXhtYl5peoqXnZqTiX1yZWBmdYaUnp2YkYZ7cGVianmIlZ2bmJCFe3BmZGt7iJWdm5eQhHtwZmRqe4mVnZuXkIR7cGZjanuJlZ6cl5GFe3BmY2p6ipWenJiShXtwZmRqe4qVnpyXkoV7cGZkanuKlZ6cl5KFe3BmZGp6ipWenJeRhXxwZmRqeoqVnpyYkoV7b2ZkanuKlZ+cmJKFe3BnZGp7ipWenJiShXtwZmRqe4qVnpyYkoV7cGZkanuKlZ6cl5KFe3BmZGp6ipWenJeRhXtwZ2VqeoqVnpyYkod8cGdka3uLlp6cmJKHfHFnZGp7i5WenJmTh3xxZ2Vre4uWnpyZk4d8cWdla3uLlp6cmZOHfHFnZWt7i5aenJmTh3xxZ2Vre4uWnpyZk4d8cWdla3uLlp6cmZOHfHFnZWt7i5aenJmTiHxxZ2Vre4uWnpyZk4h8cWdlanqMlp6dmZOIfHFnZWt7jJafnZqTiHxxZ2Vre4yWn52ak4h8cWdla3uMlp+dmpSIfHFoZmt7jJafnZqUiHxxaGZre4yWn52alIh8cmhma3yNlp+dmpSIfHJoZmt8jZafnZqUiXxyaGZrfI2Wn52alIl8cmhma3yNlp+dm5SJfXJoZmt8jZafnZuViX1yaGZrfI2Xn52blYl9cmhma3yNl5+dm5WJfXJpZmt8jZefnZuViX1yaWZrfI2Xn56blYl9cmhma3yOl5+em5aJfXNoZ2x8jpefnpuWin1zaGdsfI6Xn56blop9c2hna32Ol5+empWJfXJoZmt8jZefnpuViX1yaGZrfI2Xn52blYl9cmhma3yNl5+dm5WJfXJoZmt8jZafnZuUiXxyaGZrfI2Wn52alIl8cmhma3yNlp+dmpSJfHJoZmt8jZafnZqUiHxyaGZre4yWn52alIh8cWhma3uMlp+dmpOIfHFoZmt7jJafnZqTiHxxZ2Vre4yWn52ak4h8cWdla3uMlp6dmZOIfHFnZWt7jJaenZmTiHxxZ2Vre4yWnp2Zk4d8cWdla3uLlp6cmZOHfHFnZWt7i5aenJmTh3xxZ2Vre4uWnpyZk4d8cWdla3uLlp6cmZOHfHFnZWt7i5aenJmTh3xxZ2Vre4uWnpyYkoZ8cGdka3uLlZ6cmJKGfHBnZGp7i5WenJiShnxwZmRqe4uVnpyYkoZ8cGZkanuLlZ6cmJKGfHBnZGp7ipWenJiShXtwZmRqe4qVnpyYkoV7cGZkanuKlZ6cl5KFe3BmZGp6ipWenJeShXtwZmRqe4qVnpyXkoV7cGZkanuKlZ6cl5KFe3BmZGp6ipWenJeRhXtwZmRqeoqVnpyXkYV7cGZjanuJlZ6cl5GFe3BmY2p6iZWenJeRhXtwZmNqeomVnpyXkYV8cGZjanuJlZ6cl5GFe3BnZGp6ipWenJeRhXtwZmRqeoqVnpyXkYV7cGZkanuKlZ6cl5KFe3BmZGp7ipWenJeShXtwZg==');}
    _notifAudio.volume=0.3;_notifAudio.currentTime=0;_notifAudio.play().catch(function(){});
  }catch(e){}
}

// ─── Unread Message Tracking ───
var unreadCounts={};  // keyed by server_id
var dmUnreadCounts={};  // keyed by dm channel key (dm_uuid_uuid)
var gcUnreadCounts={};  // keyed by gc channel key (gc_id)
var globalMsgSub=null;
var _myServerIds=[];  // list of server IDs the user is a member of

export function updateServerBadge(serverId){
  var btn=document.querySelector('.srv-btn[data-serverid="'+serverId+'"]');
  if(!btn)return;
  var existing=btn.querySelector('.srv-badge');
  var count=unreadCounts[serverId]||0;
  if(count<=0){if(existing)existing.remove();}
  else{
    if(!existing){existing=document.createElement('div');existing.className='srv-badge';btn.appendChild(existing);}
    existing.textContent=count>99?'99+':count;
  }
  // Also update sidebar badge
  var sbBadge=document.querySelector('.sb-srv-badge[data-badgeid="'+serverId+'"]');
  if(sbBadge){
    if(count<=0){sbBadge.style.display='none';}
    else{sbBadge.style.display='flex';sbBadge.textContent=count>99?'99+':count;}
  }
}

export function clearServerUnread(serverId){
  unreadCounts[serverId]=0;
  updateServerBadge(serverId);
}

// ─── DM / GC Unread Badges ───
export function updateDMBadge(channelKey){
  var count=dmUnreadCounts[channelKey]||0;
  // Find the DM item with matching data-dmid (extract user ID from key)
  // Key format: dm_[sorted uuids joined by _]
  ['dmList','drawerDmList'].forEach(function(listId){
    var list=document.getElementById(listId);if(!list)return;
    list.querySelectorAll('.dm-item').forEach(function(item){
      var existing=item.querySelector('.dm-unread-badge');
      if(count<=0){if(existing)existing.remove();return;}
      if(!existing){existing=document.createElement('div');existing.className='dm-unread-badge';item.appendChild(existing);}
      existing.textContent=count>9?'9+':count;
    });
  });
}

export function updateGCBadge(channelKey){
  var count=gcUnreadCounts[channelKey]||0;
  ['gcList','drawerGcList'].forEach(function(listId){
    var list=document.getElementById(listId);if(!list)return;
    list.querySelectorAll('.gc-item').forEach(function(item){
      if(item.dataset.gckey!==channelKey)return;
      var existing=item.querySelector('.gc-unread-badge');
      if(count<=0){if(existing)existing.remove();return;}
      if(!existing){existing=document.createElement('div');existing.className='gc-unread-badge';item.appendChild(existing);}
      existing.textContent=count>9?'9+':count;
    });
  });
}

export function clearDMUnread(channelKey){
  dmUnreadCounts[channelKey]=0;
  updateDMBadge(channelKey);
}

export function clearGCUnread(channelKey){
  gcUnreadCounts[channelKey]=0;
  updateGCBadge(channelKey);
}

export async function subscribeGlobalMessages(){
  if(globalMsgSub){try{sb.removeChannel(globalMsgSub);}catch(e){}globalMsgSub=null;}
  if(!ME)return;
  // Get all server IDs the user is in
  var res=await sb.from('server_members').select('server_id').eq('user_id',ME.id);
  _myServerIds=(res.data||[]).map(function(m){return m.server_id;});
  if(!_myServerIds.length)return;
  // Subscribe to ALL message inserts globally
  globalMsgSub=sb.channel('global-msg-notify')
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},function(payload){
      var m=payload.new;
      if(!m||m.user_id===ME.id)return; // don't notify own messages
      var sc=m.server_channel||'';

      // ── DM messages ──
      if(sc.startsWith('dm_')){
        // Check if this DM involves us
        if(sc.indexOf(ME.id)===-1)return;
        // Check if we're currently viewing this DM
        if(chatMode==='dm'&&curDMUser){
          var activeKey='dm_'+[ME.id,curDMUser.id].sort().join('_');
          if(sc===activeKey)return;
        }
        dmUnreadCounts[sc]=(dmUnreadCounts[sc]||0)+1;
        updateDMBadge(sc);
        playNotifSound();
        showDesktopNotif(
          escH(m.author||'Someone'),
          (m.text||'').slice(0,100),
          m.photo||'huddleicon.png'
        );
        return;
      }

      // ── GC messages ──
      if(sc.startsWith('gc_')){
        // Check if we're currently viewing this GC
        if(chatMode==='gc'&&curGroupChat&&'gc_'+curGroupChat.id===sc)return;
        gcUnreadCounts[sc]=(gcUnreadCounts[sc]||0)+1;
        updateGCBadge(sc);
        playNotifSound();
        showDesktopNotif(
          escH(m.author||'Someone')+' in group',
          (m.text||'').slice(0,100),
          m.photo||'huddleicon.png'
        );
        return;
      }

      // ── Server messages ──
      var parts=sc.split('_');
      if(parts.length<2)return;
      var srvId=parts.slice(0,-1).join('_');
      if(srvId.length<30)return;
      if(_myServerIds.indexOf(srvId)===-1)return;
      var currentKey=curServer+'_'+curChannel;
      if(appMode==='server'&&sc===currentKey)return;
      unreadCounts[srvId]=(unreadCounts[srvId]||0)+1;
      updateServerBadge(srvId);
      playNotifSound();
      var channelName=parts[parts.length-1];
      showDesktopNotif(
        escH(m.author||'Someone')+' in #'+channelName,
        (m.text||'').slice(0,100),
        m.photo||'huddleicon.png'
      );
    })
    .subscribe();
}
