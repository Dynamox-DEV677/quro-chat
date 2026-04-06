// ═══ FILE UPLOAD ═══
import { sb } from './config.js';
import { ME } from './state.js';
import { getMsgKey } from './utils.js';
import { _plainText } from './messaging.js';
import { notify } from './notifications.js';

export async function handleFileUpload(input){
  const file=input.files[0];
  input.value='';
  if(!file||!ME)return;
  const isImg=file.type.startsWith('image/');
  const isVid=file.type.startsWith('video/');
  const isAudio=file.type.startsWith('audio/');
  // 50 MB for video, 25 MB for audio, 10 MB for everything else
  var MAX=10*1024*1024;
  var maxLabel='10 MB';
  if(isVid){MAX=50*1024*1024;maxLabel='50 MB';}
  else if(isAudio){MAX=25*1024*1024;maxLabel='25 MB';}
  if(file.size>MAX){notify('File too large (max '+maxLabel+')','error');return;}
  // Show upload progress
  var sizeMB=(file.size/1024/1024).toFixed(1);
  notify('Uploading '+file.name+' ('+sizeMB+' MB)…','info');
  const ext=file.name.split('.').pop();
  const path=`${ME.id}/${Date.now()}.${ext}`;
  let msgText=null;
  try{
    const{error:upErr}=await sb.storage.from('uploads').upload(path,file,{cacheControl:'3600',upsert:false});
    if(upErr)throw upErr;
    const{data:urlData}=sb.storage.from('uploads').getPublicUrl(path);
    const url=urlData.publicUrl;
    if(isImg){
      msgText=`[img]${url}[/img]`;
    }else if(isVid){
      msgText=`[vid]${url}[/vid]`;
    }else if(isAudio){
      msgText=`[audio]${file.name}|${url}[/audio]`;
    }else{
      msgText=`[file]${file.name}|${url}[/file]`;
    }
  }catch(e){
    notify('Upload failed. Make sure Supabase Storage bucket "uploads" exists and is set to Public.','error');
    return;
  }
  // Add reply prefix if replying
  var replyPrefix='';
  if(window._replyTo){
    replyPrefix='[reply]'+window._replyTo.author+'|'+_plainText(window._replyTo.text).slice(0,60)+'[/reply]';
    window._replyTo=null;var rb=document.getElementById('replyBar');if(rb)rb.style.display='none';
  }
  const{error}=await sb.from('messages').insert({server_channel:getMsgKey(),user_id:ME.id,author:ME.username,avatar:ME.avatar,photo:ME.photo||null,name_font:ME.name_font||'default',name_color:ME.name_color||'',text:replyPrefix+msgText,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})});
  if(error){notify('Send failed: '+error.message,'error');}else{notify('Sent!','success');}
}
