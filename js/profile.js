// ═══ PROFILE / CUSTOMIZATION ═══
import { sb } from './config.js';
import { ME } from './state.js';
import { escH, setAvatarEl, getDecorCls, applyUserBarDecor, notify, stk_fmtIN } from './utils.js';
import { buildMembers } from './members.js';
import { buildDMList, openDM } from './dm.js';

export async function saveNameplate(){
  var val=document.getElementById('spNameplate').value.trim();
  var{error}=await sb.from('profiles').update({nameplate:val}).eq('id',ME.id);
  if(error){notify('Failed to save nameplate','error');return;}
  ME.nameplate=val;notify('Nameplate saved!','success');
}

export async function saveAbout(){
  var val=document.getElementById('spAbout').value.trim();
  var{error}=await sb.from('profiles').update({about:val}).eq('id',ME.id);
  if(error){notify('Failed to save about','error');return;}
  ME.about=val;notify('About Me saved!','success');
}

export var BANNERS={
  b1:'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
  b2:'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
  b3:'linear-gradient(135deg,#141e30,#243b55)',
  b4:'linear-gradient(135deg,#000428,#004e92)',
  b5:'linear-gradient(135deg,#200122,#6f0000)',
  b6:'linear-gradient(135deg,#1d2b64,#f8cdda)',
  b7:'linear-gradient(135deg,#2c3e50,#fd746c)',
  b8:'linear-gradient(135deg,#0b486b,#f56217)',
  b9:'linear-gradient(135deg,#0f9b0f,#000000)',
  b10:'linear-gradient(135deg,#4b6cb7,#182848)',
  b11:'linear-gradient(135deg,#c33764,#1d2671)',
  b12:'linear-gradient(135deg,#ee0979,#ff6a00)',
  b13:'linear-gradient(135deg,#7b4397,#dc2430)',
  b14:'linear-gradient(135deg,#11998e,#38ef7d)',
  b15:'linear-gradient(135deg,#fc4a1a,#f7b733)',
  b16:'linear-gradient(135deg,#a8ff78,#78ffd6)'
};

var _spSelectedBanner='b1';
export function set_spSelectedBanner(v){ _spSelectedBanner=v; }

export function buildBannerGrid(){
  var grid=document.getElementById('spBannerGrid');if(!grid)return;
  grid.innerHTML='';
  var isCustom=_spSelectedBanner&&_spSelectedBanner.startsWith('http');
  if(isCustom){
    var cel=document.createElement('div');cel.className='sp-banner-opt active';
    cel.style.background='url('+_spSelectedBanner+') center/cover no-repeat';cel.dataset.banner='custom';
    cel.title='Your uploaded banner';
    cel.onclick=function(){grid.querySelectorAll('.sp-banner-opt').forEach(function(o){o.classList.toggle('active',o.dataset.banner==='custom');});};
    grid.appendChild(cel);
  }
  Object.keys(BANNERS).forEach(function(key){
    var el=document.createElement('div');el.className='sp-banner-opt'+(!isCustom&&key===_spSelectedBanner?' active':'');
    el.style.background=BANNERS[key];el.dataset.banner=key;
    el.onclick=function(){_spSelectedBanner=key;grid.querySelectorAll('.sp-banner-opt').forEach(function(o){o.classList.toggle('active',o.dataset.banner===key);});};
    grid.appendChild(el);
  });
}

export async function saveBanner(){
  var btn=document.getElementById('spBannerSaveBtn');
  btn.disabled=true;btn.textContent='Saving…';
  try{
    var{error}=await sb.from('profiles').update({banner:_spSelectedBanner}).eq('id',ME.id);
    if(error)throw error;
    ME.banner=_spSelectedBanner;
    notify('Banner saved!','success');
  }catch(err){notify('Failed to save: '+(err.message||err),'error');}
  finally{btn.disabled=false;btn.textContent='Save Banner';}
}

export function getBannerStyle(bannerKey){
  if(!bannerKey)return BANNERS.b1;
  if(bannerKey.startsWith('http'))return 'url('+bannerKey+') center/cover no-repeat';
  return BANNERS[bannerKey]||BANNERS.b1;
}

export async function uploadBannerImage(e){
  var f=e.target.files[0];if(!f||!ME)return;
  if(f.size>5*1024*1024){notify('Image too large (max 5 MB)','error');return;}
  notify('Uploading banner…','info');
  try{
    var ext=f.name.split('.').pop()||'jpg';
    var path=ME.id+'/banner.'+ext;
    var{error:upErr}=await sb.storage.from('avatars').upload(path,f,{upsert:true,cacheControl:'3600'});
    if(upErr)throw upErr;
    var{data:urlData}=sb.storage.from('avatars').getPublicUrl(path);
    var url=urlData.publicUrl+'?t='+Date.now();
    var{error:dbErr}=await sb.from('profiles').update({banner:url}).eq('id',ME.id);
    if(dbErr)throw dbErr;
    ME.banner=url;
    _spSelectedBanner=url;
    buildBannerGrid();
    notify('Banner uploaded!','success');
  }catch(err){notify('Upload failed: '+(err.message||err),'error');}
  e.target.value='';
}

export function openProfilePopup(user){
  var pp=document.getElementById('profilePopup');
  var bannerEl=pp.querySelector('.pp-banner');
  bannerEl.style.background=getBannerStyle(user.banner||'b1');
  var av=document.getElementById('ppAvatar');
  if(user.photo){av.innerHTML='<img src="'+escH(user.photo)+'">';}
  else{av.innerHTML='<span>'+escH(user.avatar||'?')+'</span>';}
  // Add decor ring to profile popup avatar
  var ppWrap=av.parentElement;ppWrap.querySelectorAll('.av-decor-lg').forEach(function(d){d.remove();});
  if(user.decor&&user.decor!=='none'){var dcls=getDecorCls(user.decor);if(dcls){var dring=document.createElement('div');dring.className='av-decor-lg '+dcls;ppWrap.appendChild(dring);}}
  var nameEl=document.getElementById('ppName');nameEl.textContent=user.username;nameEl.className='pp-name nf-'+(user.name_font||'default');nameEl.style.color=user.name_color||'';
  document.getElementById('ppHandle').textContent='@'+user.username;
  var emailEl=document.getElementById('ppEmail');
  if(user.contact_email){emailEl.textContent=user.contact_email;emailEl.style.display='';}
  else{emailEl.style.display='none';}
  var plateEl=document.getElementById('ppPlate');
  if(user.nameplate){plateEl.textContent=user.nameplate;plateEl.style.display='';}
  else{plateEl.style.display='none';}
  var aboutEl=document.getElementById('ppAbout');
  if(user.about){aboutEl.textContent=user.about;aboutEl.className='pp-about-text';}
  else{aboutEl.textContent='No bio yet.';aboutEl.className='pp-about-text pp-no-about';}
  var actEl=document.getElementById('ppActions');
  var dmBtn=document.getElementById('ppDmBtn');
  if(user.id===ME.id){actEl.style.display='none';}
  else{actEl.style.display='flex';dmBtn.onclick=function(){closeProfilePopup();openDM(user);};}

  // Reset trading sections to hidden (will show if data loads)
  document.getElementById('ppPnlHero').style.display='none';
  document.getElementById('ppStatsGrid').style.display='none';
  document.getElementById('ppHoldingsSection').style.display='none';
  document.getElementById('ppActivitySection').style.display='none';
  document.getElementById('ppRankBadge').style.display='none';

  pp.classList.add('open');

  // Async-load trading identity data
  _loadTradingIdentity(user.id);
}

export function closeProfilePopup(){document.getElementById('profilePopup').classList.remove('open');}

// ═══ Trading Identity Data Loader ═══
async function _loadTradingIdentity(userId){
  try{
    // Fetch portfolio, holdings, transactions, and all portfolios (for rank) in parallel
    var [pRes,hRes,txRes,allPRes,allHRes]=await Promise.all([
      sb.from('stock_portfolios').select('cash_balance').eq('user_id',userId).maybeSingle(),
      sb.from('stock_holdings').select('symbol,shares,avg_buy_price').eq('user_id',userId),
      sb.from('stock_transactions').select('symbol,stock_name,type,shares,price,total,created_at').eq('user_id',userId).order('created_at',{ascending:false}).limit(50),
      sb.from('stock_portfolios').select('user_id,cash_balance'),
      sb.from('stock_holdings').select('user_id,symbol,shares,avg_buy_price')
    ]);

    var cash=pRes.data?parseFloat(pRes.data.cash_balance)||0:0;
    var holdings=hRes.data||[];
    var txns=txRes.data||[];

    // If user has no portfolio at all, skip trading sections
    if(!pRes.data&&!txns.length) return;

    // ── Compute portfolio value ──
    var investedVal=0,currentVal=0;
    holdings.forEach(function(h){
      var curPrice=(window.trdPrices&&window.trdPrices[h.symbol])?window.trdPrices[h.symbol].price:h.avg_buy_price;
      investedVal+=h.shares*h.avg_buy_price;
      currentVal+=h.shares*curPrice;
    });
    var totalVal=cash+currentVal;
    var totalPnl=totalVal-100000;
    var pnlPct=((totalPnl/100000)*100);
    var pnlUp=totalPnl>=0;

    // ── Show P&L hero ──
    var pnlHero=document.getElementById('ppPnlHero');
    var pnlValueEl=document.getElementById('ppPnlValue');
    var pnlPctEl=document.getElementById('ppPnlPct');
    pnlHero.style.display='';
    var cls=totalPnl===0?'neutral':(pnlUp?'up':'down');
    pnlValueEl.textContent=(pnlUp?'+':'')+'\u20B9'+stk_fmtIN(Math.abs(totalPnl));
    pnlValueEl.className='pp-pnl-value '+cls;
    pnlPctEl.textContent=(pnlUp?'+':'')+pnlPct.toFixed(2)+'%';
    pnlPctEl.className='pp-pnl-pct '+cls;

    // ── Compute stats ──
    var wins=0,losses=0,bestProfit=-Infinity,bestTradeName='';
    // Group sells to compute wins (sells above avg buy)
    txns.forEach(function(t){
      if(t.type==='sell'){
        // Find avg buy from preceding buys of same symbol
        var buyPrices=txns.filter(function(b){return b.symbol===t.symbol&&b.type==='buy'&&new Date(b.created_at)<new Date(t.created_at);});
        var avgBuy=0;
        if(buyPrices.length){var tS=0,tC=0;buyPrices.forEach(function(b){tS+=b.shares;tC+=b.shares*b.price;});avgBuy=tC/tS;}
        else avgBuy=t.price; // no buy history — break even
        var profit=(t.price-avgBuy)*t.shares;
        if(profit>=0)wins++;else losses++;
        if(profit>bestProfit){bestProfit=profit;bestTradeName=t.stock_name||t.symbol;}
      }
    });
    var totalTrades=txns.length;
    var sellCount=wins+losses;
    var winRate=sellCount>0?Math.round((wins/sellCount)*100):0;

    // ── Show stats grid ──
    var statsGrid=document.getElementById('ppStatsGrid');
    statsGrid.style.display='grid';
    document.getElementById('ppWinRate').textContent=sellCount>0?winRate+'%':'--';
    document.getElementById('ppWinRate').className='pp-stat-value'+(winRate>=50?' up':winRate>0?' down':'');
    document.getElementById('ppTradeCount').textContent=totalTrades>0?totalTrades:'--';
    var bestEl=document.getElementById('ppBestTrade');
    if(bestProfit>-Infinity&&bestProfit!==0){
      bestEl.textContent=bestTradeName;bestEl.className='pp-stat-value'+(bestProfit>0?' up':' down');
    }else{bestEl.textContent='--';bestEl.className='pp-stat-value';}
    document.getElementById('ppPortfolioVal').textContent='\u20B9'+stk_fmtIN(totalVal);

    // ── Compute rank ──
    var allHoldsByUser={};
    (allHRes.data||[]).forEach(function(h){
      if(!allHoldsByUser[h.user_id])allHoldsByUser[h.user_id]=[];
      allHoldsByUser[h.user_id].push(h);
    });
    var allTotals=(allPRes.data||[]).map(function(p){
      var c=parseFloat(p.cash_balance)||0;
      var v=0;
      (allHoldsByUser[p.user_id]||[]).forEach(function(h){
        var cp=(window.trdPrices&&window.trdPrices[h.symbol])?window.trdPrices[h.symbol].price:h.avg_buy_price;
        v+=h.shares*cp;
      });
      return{userId:p.user_id,total:c+v};
    });
    allTotals.sort(function(a,b){return b.total-a.total;});
    var userRankIdx=allTotals.findIndex(function(e){return e.userId===userId;});
    var totalTraders=allTotals.length;

    // ── Show rank badge ──
    if(totalTraders>0&&userRankIdx>=0){
      var percentile=((userRankIdx+1)/totalTraders)*100;
      var badgeEl=document.getElementById('ppRankBadge');
      if(percentile<=1&&totalTraders>=5){
        badgeEl.className='pp-rank-badge top1';badgeEl.innerHTML='\u2B50 Top 1%';badgeEl.style.display='';
      }else if(percentile<=10&&totalTraders>=3){
        badgeEl.className='pp-rank-badge top10';badgeEl.innerHTML='\u{1f3c6} Top 10%';badgeEl.style.display='';
      }else if(percentile<=25&&totalTraders>=4){
        badgeEl.className='pp-rank-badge top25';badgeEl.innerHTML='\u{1f4c8} Top 25%';badgeEl.style.display='';
      }else if(userRankIdx<3){
        badgeEl.className='pp-rank-badge top10';badgeEl.innerHTML='#'+(userRankIdx+1)+' Trader';badgeEl.style.display='';
      }
    }

    // ── Mini holdings preview (top 3 by value) ──
    if(holdings.length>0){
      var sortedH=holdings.slice().sort(function(a,b){
        var aP=(window.trdPrices&&window.trdPrices[a.symbol])?window.trdPrices[a.symbol].price:a.avg_buy_price;
        var bP=(window.trdPrices&&window.trdPrices[b.symbol])?window.trdPrices[b.symbol].price:b.avg_buy_price;
        return (b.shares*bP)-(a.shares*aP);
      });
      var top3=sortedH.slice(0,3);
      var listHtml=top3.map(function(h){
        var cp=(window.trdPrices&&window.trdPrices[h.symbol])?window.trdPrices[h.symbol].price:h.avg_buy_price;
        var val=h.shares*cp;var cost=h.shares*h.avg_buy_price;var pl=val-cost;var plUp=pl>=0;
        return '<div class="pp-hold-item">'+
          '<div class="pp-hold-sym">'+escH(h.symbol)+'</div>'+
          '<div class="pp-hold-shares">'+h.shares+' shares</div>'+
          '<div class="pp-hold-pnl '+(plUp?'up':'down')+'">'+(plUp?'+':'')+'\u20B9'+stk_fmtIN(Math.abs(pl))+'</div></div>';
      }).join('');
      if(sortedH.length>3) listHtml+='<div class="pp-hold-more">+'+(sortedH.length-3)+' more</div>';
      document.getElementById('ppHoldingsList').innerHTML=listHtml;
      document.getElementById('ppHoldingsSection').style.display='';
    }

    // ── Recent activity (last 5 trades) ──
    if(txns.length>0){
      var recent=txns.slice(0,5);
      document.getElementById('ppActivityList').innerHTML=recent.map(function(t){
        var isBuy=t.type==='buy';
        var d=new Date(t.created_at);
        var ago=_timeAgo(d);
        return '<div class="pp-act-item">'+
          '<div class="pp-act-badge '+(isBuy?'buy':'sell')+'">'+(isBuy?'B':'S')+'</div>'+
          '<div class="pp-act-info"><div class="pp-act-stock">'+escH(t.stock_name||t.symbol)+'</div>'+
          '<div class="pp-act-detail">'+t.shares+' @ \u20B9'+stk_fmtIN(t.price)+'</div></div>'+
          '<div class="pp-act-time">'+ago+'</div></div>';
      }).join('');
      document.getElementById('ppActivitySection').style.display='';
    }
  }catch(e){
    console.warn('[Quro] Trading identity load failed:',e.message);
  }
}

function _timeAgo(date){
  var s=Math.floor((Date.now()-date.getTime())/1000);
  if(s<60)return 'now';
  var m=Math.floor(s/60);if(m<60)return m+'m';
  var h=Math.floor(m/60);if(h<24)return h+'h';
  var d=Math.floor(h/24);if(d<7)return d+'d';
  return date.toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
}

// ═══ Font Picker ═══
var _spSelectedFont='default';
export function set_spSelectedFont(v){ _spSelectedFont=v; }

export function syncFontPicker(){
  document.querySelectorAll('#spFontGrid .sp-font-opt').forEach(function(el){el.classList.toggle('active',el.dataset.font===_spSelectedFont);});
  var prev=document.getElementById('spFontPreview');prev.textContent=ME.username||'Your Name';prev.className='sp-font-preview nf-'+_spSelectedFont;
}

export function pickFont(f){_spSelectedFont=f;syncFontPicker();}

export async function saveNameFont(){
  var btn=document.getElementById('spFontSaveBtn');
  btn.disabled=true;btn.textContent='Saving…';
  try{
    var{error}=await sb.from('profiles').update({name_font:_spSelectedFont}).eq('id',ME.id);
    if(error)throw error;
    ME.name_font=_spSelectedFont;
    ['myName','drawerMyName'].forEach(function(id){var el=document.getElementById(id);el.className='u-name nf-'+ME.name_font;});
    var spN=document.getElementById('spName');spN.className='sp-av-name nf-'+ME.name_font;
    notify('Name style saved!','success');
  }catch(err){notify('Failed to save: '+(err.message||err),'error');}
  finally{btn.disabled=false;btn.textContent='Save Name Style';}
}

// ═══ Color Picker ═══
var _spSelectedColor='';
export function set_spSelectedColor(v){ _spSelectedColor=v; }
var _nameColors=['#e05050','#e87040','#e8a040','#e8d040','#a0d840','#50c878','#40c8a0','#40b8d8','#4080e0','#6050e0','#9050d8','#d050b8','#ff6b9d','#ff9eb5','#c8b8ff','#a0e8e0','#78d8f0','#b0f080','#f0d870','#f8a060','#ff7070','#c090ff','#70c8ff','#80ffb8','#ffe070','#ff8888','#88ccff','#b8ff88','#ffbb88','#cc88ff'];

export function buildColorGrid(){
  var grid=document.getElementById('spColorGrid');
  grid.innerHTML='<div class="sp-color-swatch nc-default'+((!_spSelectedColor)?' active':'')+'" onclick="pickColor(\'\')"></div>';
  _nameColors.forEach(function(c){
    grid.innerHTML+='<div class="sp-color-swatch'+(c===_spSelectedColor?' active':'')+'" style="background:'+c+'" onclick="pickColor(\''+c+'\')"></div>';
  });
}

export function syncColorPicker(){
  var prev=document.getElementById('spColorPreview');
  prev.textContent=ME.username||'Your Name';
  prev.className='sp-color-preview nf-'+(_spSelectedFont||ME.name_font||'default');
  prev.style.color=_spSelectedColor||'';
}

export function pickColor(c){
  _spSelectedColor=c;
  document.querySelectorAll('#spColorGrid .sp-color-swatch').forEach(function(el){
    var isDefault=el.classList.contains('nc-default');
    el.classList.toggle('active',isDefault?!c:el.style.backgroundColor&&rgbToHex(el.style.backgroundColor)===c.toLowerCase());
  });
  syncColorPicker();
}

function rgbToHex(rgb){
  if(rgb.charAt(0)==='#')return rgb.toLowerCase();
  var m=rgb.match(/\d+/g);if(!m||m.length<3)return rgb;
  return '#'+((1<<24)+(+m[0]<<16)+(+m[1]<<8)+(+m[2])).toString(16).slice(1);
}

export async function saveNameColor(){
  var btn=event.target;btn.disabled=true;btn.textContent='Saving…';
  try{
    var{error}=await sb.from('profiles').update({name_color:_spSelectedColor}).eq('id',ME.id);
    if(error)throw error;
    ME.name_color=_spSelectedColor;
    notify('Name color saved!','success');
    buildMembers();
  }catch(err){notify('Failed to save: '+(err.message||err),'error');}
  finally{btn.disabled=false;btn.textContent='Save Name Color';}
}

// ═══ AVATAR DECOR ═══
export var DECOR_LIST=[
  {id:'none',name:'None',cls:''},
  {id:'flame',name:'Flame',cls:'decor-flame'},
  {id:'ice',name:'Ice',cls:'decor-ice'},
  {id:'toxic',name:'Toxic',cls:'decor-toxic'},
  {id:'royal',name:'Royal',cls:'decor-royal'},
  {id:'gold',name:'Gold',cls:'decor-gold'},
  {id:'blood',name:'Blood',cls:'decor-blood'},
  {id:'shadow',name:'Shadow',cls:'decor-shadow'},
  {id:'rainbow',name:'Rainbow',cls:'decor-rainbow'},
  {id:'sakura',name:'Sakura',cls:'decor-sakura'},
  {id:'electric',name:'Zap',cls:'decor-electric'},
  {id:'phantom',name:'Phantom',cls:'decor-phantom'}
];

var _spSelectedDecor='none';
export function set_spSelectedDecor(v){ _spSelectedDecor=v; }

export function buildDecorGrid(){
  var grid=document.getElementById('spDecorGrid');if(!grid)return;
  grid.innerHTML=DECOR_LIST.map(function(d){
    return '<div class="sp-decor-item'+(d.id===_spSelectedDecor?' active':'')+'" onclick="selectDecor(\''+d.id+'\')">'
      +'<div class="sp-decor-thumb">'+(d.cls?'<div class="av-decor '+d.cls+'"></div>':'')+'<span style="font-size:12px">U</span></div>'
      +'<div class="sp-decor-name">'+d.name+'</div></div>';
  }).join('');
}

export function selectDecor(id){
  _spSelectedDecor=id;
  buildDecorGrid();
  // Update preview
  var prev=document.getElementById('spDecorPreview');
  if(prev){
    var old=prev.querySelector('.av-decor-lg');if(old)old.remove();
    if(id!=='none'){var cls=getDecorCls(id);if(cls){var ring=document.createElement('div');ring.className='av-decor-lg '+cls;prev.appendChild(ring);}}
  }
}

export async function saveDecor(){
  if(!ME)return;
  ME.decor=_spSelectedDecor;
  try{
    await sb.from('profiles').update({decor:_spSelectedDecor}).eq('id',ME.id);
    notify('Decor saved!','success');
    // Refresh avatars that show decor
    buildDMList();buildMembers();
    // Update user bar decor
    applyUserBarDecor();
  }catch(e){notify('Failed to save decor','error');}
}

export function pickProfilePic(){document.getElementById('spAvatarFile').click();}

export async function applyProfilePic(e){
  const f=e.target.files[0];if(!f||!ME)return;
  if(f.size>5*1024*1024){notify('Image too large (max 5 MB)','error');return;}
  notify('Uploading photo…','info');
  // Upload to Supabase Storage avatars bucket
  const ext=f.name.split('.').pop()||'jpg';
  const path=ME.id+'/avatar.'+ext;
  const{error:upErr}=await sb.storage.from('avatars').upload(path,f,{upsert:true,cacheControl:'3600'});
  if(upErr){notify('Upload failed: '+upErr.message,'error');return;}
  const{data:urlData}=sb.storage.from('avatars').getPublicUrl(path);
  const url=urlData.publicUrl+'?t='+Date.now(); // cache-bust
  ME.photo=url;
  ['spAvatarBtn','myAvatarBtn','drawerAvatarBtn'].forEach(function(id,i){
    setAvatarEl(id,ME.avatar,url,['spAvatarLetter','myAvatarLetter','drawerAvatarLetter'][i]);
  });
  buildMembers();
  await sb.from('profiles').upsert({id:ME.id,username:ME.username,avatar:ME.avatar,photo:url});
  notify('Profile picture updated!','success');
}

// ═══ Email Linking ═══
export async function saveContactEmail(){
  var input=document.getElementById('spContactEmail');
  var email=input.value.trim();
  var msgEl=document.getElementById('spEmailMsg');
  var btn=document.getElementById('spEmailSaveBtn');
  msgEl.style.display='none';msgEl.className='sp-pwd-msg';
  if(!email){msgEl.textContent='Please enter an email address.';msgEl.classList.add('err');msgEl.style.display='block';return;}
  // Basic email validation
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msgEl.textContent='Please enter a valid email address.';msgEl.classList.add('err');msgEl.style.display='block';return;}
  btn.disabled=true;btn.textContent='Saving…';
  try{
    var{error}=await sb.from('profiles').update({contact_email:email}).eq('id',ME.id);
    if(error)throw error;
    ME.contact_email=email;
    msgEl.textContent='Email linked successfully!';msgEl.classList.add('ok');msgEl.style.display='block';
    notify('Email linked: '+email,'success');
    syncEmailSection();
    // Send welcome email via Edge Function
    sb.functions.invoke('send-inactivity-emails',{body:{welcome:true,to:email,username:ME.username}}).then(function(res){
      if(res.error){console.error('Edge Function error:',res.error);notify('Email linked but confirmation email failed to send','error');}
      else if(res.data&&res.data.error){console.error('Edge Function returned error:',res.data.error);notify('Email linked but confirmation email failed: '+res.data.error,'error');}
      else{notify('\u{1f4e8} Confirmation email sent to '+email+'!','success');}
    }).catch(function(err){console.error('Edge Function invoke failed:',err);notify('Email linked but could not send confirmation email. Check if Edge Function is deployed.','error');});
  }catch(e){
    msgEl.textContent='Failed to save: '+(e.message||e);msgEl.classList.add('err');msgEl.style.display='block';
  }finally{btn.disabled=false;btn.textContent='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Link Email';}
}

export async function unlinkEmail(){
  try{
    await sb.from('profiles').update({contact_email:null}).eq('id',ME.id);
    ME.contact_email='';
    notify('Email unlinked.','info');
    syncEmailSection();
  }catch(e){notify('Failed to unlink','error');}
}

export function syncEmailSection(){
  var area=document.getElementById('emailLinkArea');if(!area)return;
  if(ME.contact_email){
    area.innerHTML='<div class="sp-email-linked"><span style="font-size:16px">\u2705</span><div><div style="font-weight:600">'+escH(ME.contact_email)+'</div><div style="font-size:10px;color:rgba(255,255,255,.35);margin-top:2px">Email linked to your profile</div></div></div>'+
      '<div style="display:flex;gap:6px;margin-top:0"><input type="email" class="form-input" id="spContactEmail" placeholder="Change email address" style="margin-bottom:0;flex:1" aria-label="Contact email"><button class="btn-logout" onclick="saveContactEmail()" style="font-size:11px;padding:10px;min-height:38px;margin-bottom:0">Update</button></div>'+
      '<button class="btn-logout" onclick="unlinkEmail()" style="font-size:11px;padding:10px;min-height:38px;margin-top:6px;border-color:rgba(237,66,69,.2);color:rgba(237,66,69,.6)">Unlink Email</button>';
  }else{
    area.innerHTML='<input type="email" class="form-input" id="spContactEmail" placeholder="Enter your email address" style="margin-bottom:8px" aria-label="Contact email">'+
      '<div class="sp-pwd-msg" id="spEmailMsg" style="display:none"></div>'+
      '<button class="btn-logout" id="spEmailSaveBtn" onclick="saveContactEmail()" style="font-size:11px;padding:10px;min-height:38px;margin-bottom:0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;vertical-align:-2px"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Link Email</button>';
  }
}
