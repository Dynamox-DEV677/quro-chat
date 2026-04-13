// ═══ EMOJI PICKER ═══
import { EMOJIS } from './config.js?v=49';

export function openEmoji(){document.getElementById('emojiGrid').innerHTML=EMOJIS.map(e=>`<button class="emoji-btn" onclick="insertEmoji('${e}')">${e}</button>`).join('');document.getElementById('emojiModal').classList.add('open');}
export function closeEmoji(){document.getElementById('emojiModal').classList.remove('open');}
export function emojiOverlayClick(e){if(e.target===document.getElementById('emojiModal'))closeEmoji();}
export function insertEmoji(em){const inp=document.getElementById('msgInput');const p=inp.selectionStart,v=inp.value;inp.value=v.slice(0,p)+em+v.slice(p);inp.selectionStart=inp.selectionEnd=p+em.length;inp.focus();closeEmoji();}
