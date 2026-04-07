// ═══════════════════════════════════════
// Stocks Module
// Extracted from index.html <script> block (lines 5709-6279)
// ═══════════════════════════════════════
import { SUPABASE_URL, SUPABASE_ANON } from './config.js';
import { isIndianMarketOpen, getMarketStatusInfo } from './utils.js';

// ─── Data constants ───
export var STK_STOCKS=[
  {s:'RELIANCE.NS',n:'Reliance',sec:'Energy',b:2900},
  {s:'TCS.NS',n:'TCS',sec:'IT',b:3800},
  {s:'HDFCBANK.NS',n:'HDFC Bank',sec:'Banking',b:1700},
  {s:'INFY.NS',n:'Infosys',sec:'IT',b:1560},
  {s:'ICICIBANK.NS',n:'ICICI Bank',sec:'Banking',b:1200},
  {s:'HINDUNILVR.NS',n:'HUL',sec:'FMCG',b:2600},
  {s:'ITC.NS',n:'ITC',sec:'FMCG',b:430},
  {s:'SBIN.NS',n:'State Bank',sec:'Banking',b:800},
  {s:'BHARTIARTL.NS',n:'Airtel',sec:'Telecom',b:1700},
  {s:'KOTAKBANK.NS',n:'Kotak Bank',sec:'Banking',b:1800},
  {s:'LT.NS',n:'L&T',sec:'Infra',b:3400},
  {s:'BAJFINANCE.NS',n:'Bajaj Finance',sec:'NBFC',b:7200},
  {s:'WIPRO.NS',n:'Wipro',sec:'IT',b:540},
  {s:'HCLTECH.NS',n:'HCL Tech',sec:'IT',b:1700},
  {s:'ASIANPAINT.NS',n:'Asian Paints',sec:'Consumer',b:2800},
  {s:'MARUTI.NS',n:'Maruti',sec:'Auto',b:12500},
  {s:'AXISBANK.NS',n:'Axis Bank',sec:'Banking',b:1100},
  {s:'SUNPHARMA.NS',n:'Sun Pharma',sec:'Pharma',b:1750},
  {s:'TITAN.NS',n:'Titan',sec:'Consumer',b:3500},
  {s:'ULTRACEMCO.NS',n:'UltraTech',sec:'Cement',b:10500},
  {s:'TECHM.NS',n:'Tech Mahindra',sec:'IT',b:1600},
  {s:'POWERGRID.NS',n:'Power Grid',sec:'Utilities',b:320},
  {s:'NTPC.NS',n:'NTPC',sec:'Energy',b:370},
  {s:'ONGC.NS',n:'ONGC',sec:'Energy',b:280},
  {s:'JSWSTEEL.NS',n:'JSW Steel',sec:'Metal',b:930},
  {s:'TATAMOTORS.NS',n:'Tata Motors',sec:'Auto',b:980},
  {s:'TATASTEEL.NS',n:'Tata Steel',sec:'Metal',b:160},
  {s:'ADANIPORTS.NS',n:'Adani Ports',sec:'Infra',b:1350},
  {s:'NESTLEIND.NS',n:'Nestle',sec:'FMCG',b:2400},
  {s:'BAJAJFINSV.NS',n:'Bajaj Finserv',sec:'NBFC',b:1700},
  {s:'DRREDDY.NS',n:'Dr Reddys',sec:'Pharma',b:1200},
  {s:'CIPLA.NS',n:'Cipla',sec:'Pharma',b:1500},
  {s:'EICHERMOT.NS',n:'Eicher Motors',sec:'Auto',b:4700},
  {s:'BPCL.NS',n:'BPCL',sec:'Energy',b:650},
  {s:'COALINDIA.NS',n:'Coal India',sec:'Mining',b:480},
  {s:'BRITANNIA.NS',n:'Britannia',sec:'FMCG',b:5200},
  {s:'HEROMOTOCO.NS',n:'Hero Moto',sec:'Auto',b:4800},
  {s:'APOLLOHOSP.NS',n:'Apollo Hosp',sec:'Healthcare',b:7200},
  {s:'TATACONSUM.NS',n:'Tata Consumer',sec:'FMCG',b:1100},
  {s:'INDUSINDBK.NS',n:'IndusInd Bank',sec:'Banking',b:1000},
  {s:'HINDALCO.NS',n:'Hindalco',sec:'Metal',b:680},
  {s:'SBILIFE.NS',n:'SBI Life',sec:'Insurance',b:1600},
  {s:'HDFCLIFE.NS',n:'HDFC Life',sec:'Insurance',b:730},
  {s:'ADANIENT.NS',n:'Adani Ent.',sec:'Diversified',b:2900},
  {s:'BEL.NS',n:'BEL',sec:'Defense',b:280},
  {s:'TRENT.NS',n:'Trent',sec:'Retail',b:6000},
  {s:'BAJAJ-AUTO.NS',n:'Bajaj Auto',sec:'Auto',b:9500},
  {s:'GRASIM.NS',n:'Grasim',sec:'Diversified',b:2700},
  {s:'DIVISLAB.NS',n:'Divis Lab',sec:'Pharma',b:5700},
  {s:'SHRIRAMFIN.NS',n:'Shriram Fin',sec:'NBFC',b:2800}
];

export var STK_INDICES=[
  {s:'^NSEI',n:'NIFTY 50',b:22000},
  {s:'^BSESN',n:'SENSEX',b:73000},
  {s:'^NSEBANK',n:'BANK NIFTY',b:47000}
];

// ─── Module-level state ───
var stkQuotes={}, stkCurFilter='all', stkDetailSym='', stkDetailRange='1d', stkDetailInterval='5m', _stkSearchOpen=false;

export function stk_fmtIN(n){
  if(isNaN(n))return '—';
  return Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
}

export function stk_simPts(base,count){
  var pts=[base],d=base*.003;
  for(var i=1;i<count;i++){pts.push(Math.max(base*.5,pts[i-1]+(Math.random()-.48)*d));}
  return pts;
}

export function stk_draw(cv,pts,up,h){
  if(!cv||!pts||pts.length<2)return;
  var dpr=window.devicePixelRatio||1;
  var W=cv.offsetWidth||cv.width/dpr||80;
  var H=h||cv.offsetHeight||36;
  cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
  var ctx=cv.getContext('2d'); ctx.scale(dpr,dpr);
  var mn=pts[0],mx=pts[0];
  for(var i=1;i<pts.length;i++){if(pts[i]<mn)mn=pts[i];if(pts[i]>mx)mx=pts[i];}
  var rng=mx-mn||1, p=2;
  var col=up?'#3da87a':'#e05050';
  var grd=ctx.createLinearGradient(0,0,0,H);
  grd.addColorStop(0,up?'rgba(61,168,122,.25)':'rgba(224,80,80,.25)');
  grd.addColorStop(1,'rgba(0,0,0,0)');
  function px(i){return p+(i/(pts.length-1))*(W-p*2);}
  function py(v){return H-p-((v-mn)/rng)*(H-p*2);}
  ctx.beginPath();
  for(var j=0;j<pts.length;j++){j===0?ctx.moveTo(px(j),py(pts[j])):ctx.lineTo(px(j),py(pts[j]));}
  ctx.lineTo(px(pts.length-1),H);ctx.lineTo(px(0),H);ctx.closePath();
  ctx.fillStyle=grd;ctx.fill();
  ctx.beginPath();
  for(var j=0;j<pts.length;j++){j===0?ctx.moveTo(px(j),py(pts[j])):ctx.lineTo(px(j),py(pts[j]));}
  ctx.strokeStyle=col;ctx.lineWidth=1.8;ctx.lineJoin='round';ctx.stroke();
}

var _stkProxyUrl=SUPABASE_URL+'/functions/v1/stock-proxy';
var _stkLiveRefreshInt=null;
var _stkHasRealData=false;

export async function stk_fetchChart(sym,range,interval){
  try{
    var r=await fetch(_stkProxyUrl,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_ANON,'Authorization':'Bearer '+SUPABASE_ANON},body:JSON.stringify({action:'chart',symbol:sym,range:range||'1d',interval:interval||'5m'})});
    var d=await r.json();
    if(!d.ok)throw new Error(d.error);
    return{closes:d.closes,price:d.price,prev:d.prev};
  }catch(e){console.warn('stk_fetchChart proxy fail:',e);return null;}
}

export function stk_updateLivePill(){
  var pill=document.getElementById('stkLivePill');
  var dot=document.getElementById('stkLiveDot');
  var txt=document.getElementById('stkLiveText');
  if(!pill)return;
  if(_stkHasRealData){
    pill.classList.remove('simulated');
    txt.textContent='LIVE';
  }else{
    pill.classList.add('simulated');
    txt.textContent='SIMULATED';
  }
}

export async function stk_fetchQuotes(){
  try{
    var syms=STK_STOCKS.map(function(s){return s.s;}).join(',');
    var r=await fetch(_stkProxyUrl,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_ANON,'Authorization':'Bearer '+SUPABASE_ANON},body:JSON.stringify({action:'quotes',symbols:syms})});
    var d=await r.json();
    if(!d.ok)throw new Error(d.error);
    var gotReal=false;
    (d.data||[]).forEach(function(q){
      if(q.regularMarketPrice){
        stkQuotes[q.symbol]={price:q.regularMarketPrice,chg:q.regularMarketChange||0,pct:q.regularMarketChangePercent||0,high:q.regularMarketDayHigh,low:q.regularMarketDayLow,open:q.regularMarketOpen,vol:q.regularMarketVolume,w52h:q.fiftyTwoWeekHigh,w52l:q.fiftyTwoWeekLow,pts:q.closes&&q.closes.length>2?q.closes:undefined};
        gotReal=true;
      }
    });
    return gotReal;
  }catch(e){console.warn('stk_fetchQuotes proxy fail:',e);return false;}
}

export async function stk_fetchIndexQuotes(){
  try{
    var syms=STK_INDICES.map(function(s){return s.s;}).join(',');
    var r=await fetch(_stkProxyUrl,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_ANON,'Authorization':'Bearer '+SUPABASE_ANON},body:JSON.stringify({action:'quotes',symbols:syms})});
    var d=await r.json();
    if(!d.ok)throw new Error(d.error);
    return d.data||[];
  }catch(e){console.warn('stk_fetchIndexQuotes proxy fail:',e);return[];}
}

export function openStocksPanel(){
  document.getElementById('stocksPage').classList.add('open');
  document.getElementById('srvStocksBtn').classList.add('active');
  document.querySelectorAll('.sb-nav-item').forEach(function(n){n.classList.remove('active');});
  document.getElementById('navStocks').classList.add('active');

  // Check Indian market hours
  var status=getMarketStatusInfo();
  var overlay=document.getElementById('stkMarketClosed');
  if(!status.open){
    if(overlay) overlay.classList.add('show');
    _updateMarketClosedUI('stkMarketClosed',status);
    stk_stopLiveRefresh();
    return;
  }
  if(overlay) overlay.classList.remove('show');
  stk_loadAll();
  stk_startLiveRefresh();
}

export function closeStocksPanel(){
  document.getElementById('stocksPage').classList.remove('open');
  document.getElementById('srvStocksBtn').classList.remove('active');
  stk_stopLiveRefresh();
  var mn=document.getElementById('mnChats');
  if(mn)mn.classList.add('active');
  if(window.appMode==='home'){document.querySelectorAll('.sb-nav-item').forEach(function(n){n.classList.remove('active');});document.getElementById('navHome').classList.add('active');}
}

export function mobileOpenStocks(){
  var btns=document.querySelectorAll('.mob-nav-btn');
  for(var i=0;i<btns.length;i++)btns[i].classList.remove('active');
  var msBtn=document.getElementById('mnChats');if(msBtn)msBtn.classList.remove('active');
  openStocksPanel();
}

export async function stk_loadAll(){
  stk_loadIndices();
  stk_loadStocks();
}

export function stk_renderIndex(i,pts,price,chg,pct,idx){
  var up=chg>=0;
  document.getElementById('idx'+i+'price').textContent=stk_fmtIN(price);
  var chgEl=document.getElementById('idx'+i+'chg');
  chgEl.textContent=(up?'▲ +':'▼ ')+Math.abs(chg).toFixed(2)+' ('+(up?'+':'')+pct.toFixed(2)+'%)';
  chgEl.className='idx-chg '+(up?'up':'down');
  var badge=document.getElementById('idx'+i+'badge');
  badge.textContent=(up?'+':'')+pct.toFixed(2)+'%';
  badge.className='idx-badge '+(up?'up':'down');
  var card=document.getElementById('idx'+i);
  card.style.borderTop='2px solid '+(up?'rgba(61,168,122,.5)':'rgba(224,80,80,.45)');
  var cv=document.getElementById('idx'+i+'cv');
  stk_draw(cv,pts,up);
  (function(sym,n,pr,ch,pc){card.onclick=function(){stk_showDetail(sym,n,pr,ch,pc,'Index');};})(idx.s,idx.n,price,chg,pct);
}

export async function stk_loadIndices(){
  // Show base placeholder until real data arrives
  for(var i=0;i<STK_INDICES.length;i++){
    (function(idx,i){
      stk_renderIndex(i,[idx.b],idx.b,0,0,idx);
    })(STK_INDICES[i],i);
  }
  // Fetch real index data via proxy
  for(var i=0;i<STK_INDICES.length;i++){
    (function(idx,i){
      stk_fetchChart(idx.s).then(function(data){
        if(data&&data.closes&&data.closes.length>=2){
          var prev=data.prev,ch=data.price-prev,pc=(ch/prev)*100;
          stk_renderIndex(i,data.closes,data.price,ch,pc,idx);
        }
      });
    })(STK_INDICES[i],i);
  }
}

export async function stk_loadStocks(){
  // Show base prices as placeholder until real data arrives
  STK_STOCKS.forEach(function(stk){
    if(!stkQuotes[stk.s]){
      stkQuotes[stk.s]={price:stk.b,chg:0,pct:0,high:stk.b,low:stk.b,open:stk.b,vol:0,w52h:stk.b*1.3,w52l:stk.b*.7,pts:[stk.b]};
    }
  });
  stk_renderGrid();
  stk_updateLivePill();
  // Fetch real data via Edge Function proxy
  var gotReal=await stk_fetchQuotes();
  if(gotReal){
    _stkHasRealData=true;
    stk_renderGrid();
    stk_updateLivePill();
    // Sync real prices to trading module
    _syncTradingPrices();
  }
}

// ─── Auto-refresh live prices every 3 seconds ───
var _stkRefreshCycle=0;
export function stk_startLiveRefresh(){
  if(_stkLiveRefreshInt)return;
  _stkRefreshCycle=0;
  _stkLiveRefreshInt=setInterval(async function(){
    // Run if stocks page OR trading page is open
    var stocksOpen=document.getElementById('stocksPage')&&document.getElementById('stocksPage').classList.contains('open');
    var tradingOpen=document.getElementById('tradingPage')&&document.getElementById('tradingPage').classList.contains('open');
    if(!stocksOpen&&!tradingOpen)return;
    _stkRefreshCycle++;
    var gotReal=await stk_fetchQuotes();
    if(gotReal){
      _stkHasRealData=true;
      if(stocksOpen){stk_renderGrid();stk_updateLivePill();}
      // Sync real prices to trading module
      _syncTradingPrices();
    }
    // Refresh indices every 3rd cycle (9s)
    if(_stkRefreshCycle%3===0&&stocksOpen){
      for(var i=0;i<STK_INDICES.length;i++){
        (function(idx,i){
          stk_fetchChart(idx.s).then(function(data){
            if(data&&data.closes&&data.closes.length>=2){
              var prev=data.prev,ch=data.price-prev,pc=(ch/prev)*100;
              stk_renderIndex(i,data.closes,data.price,ch,pc,idx);
            }
          });
        })(STK_INDICES[i],i);
      }
    }
  },3000);
}

function _syncTradingPrices(){
  STK_STOCKS.forEach(function(stk){
    var q=stkQuotes[stk.s];
    if(q&&q.price&&window.trdPrices){
      if(!window.trdPrices[stk.s]){
        window.trdPrices[stk.s]={price:q.price,prev:q.price-(q.chg||0),name:stk.n,sec:stk.sec,base:stk.b};
      }else{
        window.trdPrices[stk.s].price=q.price;
        window.trdPrices[stk.s].prev=q.price-(q.chg||0);
      }
      if(window.trdHistory){
        if(!window.trdHistory[stk.s])window.trdHistory[stk.s]=[];
        var hist=window.trdHistory[stk.s];
        // Only push if price actually changed
        if(hist.length===0||hist[hist.length-1]!==q.price){
          hist.push(q.price);
          if(hist.length>80)hist.shift();
        }
      }
    }
  });
}

export function stk_stopLiveRefresh(){
  if(_stkLiveRefreshInt){clearInterval(_stkLiveRefreshInt);_stkLiveRefreshInt=null;}
}

export function stkFilter(f,btn){
  stkCurFilter=f;
  var btns=document.querySelectorAll('.stp-filter');
  for(var i=0;i<btns.length;i++)btns[i].classList.remove('active');
  btn.classList.add('active');
  stk_renderGrid();
}

var _stkSearchQuery='';

export function stkToggleSearch(){
  _stkSearchOpen=!_stkSearchOpen;
  var bar=document.getElementById('stkSearchBar');
  if(bar){
    bar.style.display=_stkSearchOpen?'flex':'none';
    if(_stkSearchOpen){
      var inp=document.getElementById('stkSearchInput');
      if(inp){inp.value='';inp.focus();}
      _stkSearchQuery='';
    } else {
      _stkSearchQuery='';
      stk_renderGrid();
    }
  }
}

export function stkSearchFilter(q){
  _stkSearchQuery=q.trim().toLowerCase();
  stk_renderGrid();
}

export function stk_renderGrid(){
  var stocks=STK_STOCKS.slice();
  // Apply search filter
  if(_stkSearchQuery){
    stocks=stocks.filter(function(s){return s.n.toLowerCase().indexOf(_stkSearchQuery)!==-1||s.s.toLowerCase().indexOf(_stkSearchQuery)!==-1||s.sec.toLowerCase().indexOf(_stkSearchQuery)!==-1;});
  }
  if(stkCurFilter==='gain')stocks=stocks.filter(function(s){return(stkQuotes[s.s]&&stkQuotes[s.s].chg>=0);});
  if(stkCurFilter==='loss')stocks=stocks.filter(function(s){return(stkQuotes[s.s]&&stkQuotes[s.s].chg<0);});
  stocks.sort(function(a,b){
    var pa=stkQuotes[a.s]?stkQuotes[a.s].pct:0;
    var pb=stkQuotes[b.s]?stkQuotes[b.s].pct:0;
    return stkCurFilter==='loss'?pa-pb:pb-pa;
  });
  var html='';
  stocks.forEach(function(stk){
    var q=stkQuotes[stk.s];
    var up=q?q.chg>=0:true;
    var price=q?stk_fmtIN(q.price):'—';
    var chgStr=q?(up?'+':'')+q.chg.toFixed(2)+'  ('+(up?'+':'')+q.pct.toFixed(2)+'%)':'—';
    var ico=stk.n.substring(0,2).toUpperCase();
    html+='<div class="stk-card '+(up?'gain':'loss')+'" data-sym="'+stk.s+'" onclick="stk_showDetail(\''+stk.s+'\',\''+stk.n+'\','+(q?q.price:0)+','+(q?q.chg:0)+','+(q?q.pct:0)+',\''+stk.sec+'\')">';
    html+='<div class="stk-icon">'+ico+'</div>';
    html+='<div class="stk-info"><div class="stk-name">'+stk.n+'</div><div class="stk-sector">'+stk.sec+'</div></div>';
    html+='<div class="stk-nums"><span class="stk-price">'+price+'</span><span class="stk-chg '+(up?'up':'down')+'">'+chgStr+'</span></div>';
    html+='<canvas class="stk-spark" id="spark_'+stk.s.replace(/[^a-zA-Z0-9]/g,'_')+'"></canvas>';
    html+='</div>';
  });
  document.getElementById('stkGrid').innerHTML=html;
  setTimeout(function(){
    stocks.forEach(function(stk){
      var q=stkQuotes[stk.s];
      if(!q)return;
      var up=q.chg>=0;
      var pts=q.pts||[stk.b,stk.b];
      var cv=document.getElementById('spark_'+stk.s.replace(/[^a-zA-Z0-9]/g,'_'));
      if(cv)stk_draw(cv,pts,up,36);
    });
  },50);
}

export async function stk_showDetail(sym,name,price,chg,pct,sector){
  stkDetailSym=sym; stkDetailRange='1d';
  document.getElementById('stkDetailOverlay').classList.add('open');
  document.getElementById('stkdName').textContent=name;
  document.getElementById('stkdSub').textContent=sector+' · NSE';
  document.getElementById('stkdPrice').textContent=stk_fmtIN(price);
  var up=chg>=0;
  document.getElementById('stkdArrow').textContent=up?'▲':'▼';
  document.getElementById('stkdArrow').style.color=up?'#3da87a':'#e05050';
  document.getElementById('stkdChg').textContent=(up?'+':'')+Number(chg).toFixed(2);
  document.getElementById('stkdChg').className='stkd-chg '+(up?'up':'down');
  document.getElementById('stkdPct').textContent='('+(up?'+':'')+Number(pct).toFixed(2)+'%)';
  document.getElementById('stkdPct').className='stkd-chg '+(up?'up':'down');
  var ranges=document.querySelectorAll('.stkd-range');
  for(var i=0;i<ranges.length;i++)ranges[i].classList.toggle('active',i===0);
  document.getElementById('stkdStats').innerHTML='';
  stk_loadDetailChart(sym,'1d');
}

// ─── Candlestick engine ───
var stkLiveInterval=null;
var stkCurrentCandles=[];
var stkCurrentBase=0;

// ─── Crosshair state ───
var _crosshairState={};  // keyed by canvas id

export function genOHLC(base,count,vol,intSec){
  vol=vol||0.009;
  var candles=[],price=base;
  var now=Math.floor(Date.now()/1000);
  intSec=intSec||5*60;
  for(var i=0;i<count;i++){
    var o=price;
    var change=o*vol*(Math.random()*2-0.97);
    var c=Math.max(base*0.35,o+change);
    var br=Math.abs(c-o);
    var h=Math.max(o,c)+br*(Math.random()*0.7+0.05);
    var l=Math.min(o,c)-br*(Math.random()*0.7+0.05);
    l=Math.max(l,base*0.35);
    var v=Math.floor((0.3+Math.random()*0.7)*base*180);
    candles.push({o:o,h:h,l:l,c:c,v:v,t:now-(count-i)*intSec});
    price=c;
  }
  return candles;
}

// ─── Nice Y-axis tick calculation ───
function _niceSteps(minV,maxV,targetTicks){
  var range=maxV-minV;
  if(range<=0)return[minV];
  var roughStep=range/(targetTicks||5);
  var mag=Math.pow(10,Math.floor(Math.log10(roughStep)));
  var norm=roughStep/mag;
  var niceNorm=norm<1.5?1:norm<3?2:norm<7?5:10;
  var step=niceNorm*mag;
  var start=Math.ceil(minV/step)*step;
  var ticks=[];
  for(var v=start;v<=maxV+step*0.01;v+=step){ticks.push(v);}
  return ticks;
}

export function drawCandlestick(cv,candles){
  if(!cv||!candles||candles.length<2)return;
  var dpr=window.devicePixelRatio||1;
  var W=cv.offsetWidth||600,H=cv.offsetHeight||300;
  cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);
  var ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
  var PL=6,PR=66,PT=14,PB=26;
  var VOL_H=Math.max(36,Math.floor(H*0.17));
  var cH=H-PT-PB-VOL_H-8,cW=W-PL-PR;
  var volTop=PT+cH+8;

  // Price range
  var minP=Infinity,maxP=-Infinity;
  for(var i=0;i<candles.length;i++){if(candles[i].l<minP)minP=candles[i].l;if(candles[i].h>maxP)maxP=candles[i].h;}
  var pR=maxP-minP||1,pad=pR*0.055;
  var pMin=minP-pad,pMax=maxP+pad;
  var maxVol=0;
  for(var i=0;i<candles.length;i++){if((candles[i].v||0)>maxVol)maxVol=candles[i].v;}
  if(!maxVol)maxVol=1;
  var cW2=cW/candles.length,bW=Math.max(1,Math.min(cW2*0.65,16));
  function cx(i){return PL+(i+0.5)*cW2;}
  function cy(p){return PT+(1-(p-pMin)/(pMax-pMin))*cH;}

  // Store chart geometry for crosshair lookups
  var cid=cv.id||'_cv';
  _crosshairState[cid]={candles:candles,PL:PL,PR:PR,PT:PT,PB:PB,cH:cH,cW:cW,cW2:cW2,W:W,H:H,pMin:pMin,pMax:pMax,volTop:volTop,VOL_H:VOL_H,maxVol:maxVol,bW:bW,cx:cx,cy:cy};

  // Background
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);

  // Compute nice Y-axis ticks
  var yTicks=_niceSteps(pMin,pMax,6);

  // Horizontal grid + price labels (nice ticks)
  for(var g=0;g<yTicks.length;g++){
    var gp=yTicks[g];
    var gy=cy(gp);
    if(gy<PT-2||gy>PT+cH+2)continue;
    ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=1;
    ctx.setLineDash([2,3]);
    ctx.beginPath();ctx.moveTo(PL,gy);ctx.lineTo(W-PR,gy);ctx.stroke();
    ctx.setLineDash([]);
    // Price label on right axis with Indian formatting
    ctx.fillStyle='rgba(255,255,255,0.45)';
    ctx.font='9.5px "Courier New",monospace';ctx.textAlign='left';
    ctx.fillText('\u20B9'+stk_fmtIN(gp),W-PR+5,gy+3.5);
  }

  // Vertical grid + time labels
  var vStep=Math.max(1,Math.floor(candles.length/7));
  for(var vi=0;vi<candles.length;vi+=vStep){
    var vx=cx(vi);
    ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=1;
    ctx.setLineDash([2,3]);
    ctx.beginPath();ctx.moveTo(vx,PT);ctx.lineTo(vx,PT+cH);ctx.stroke();
    ctx.setLineDash([]);
    if(candles[vi]&&candles[vi].t){
      var d=new Date(candles[vi].t*1000);
      ctx.fillStyle='rgba(255,255,255,0.28)';ctx.font='8.5px "Courier New",monospace';ctx.textAlign='center';
      ctx.fillText(d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),vx,H-PB+13);
    }
  }

  // Volume bars
  for(var i=0;i<candles.length;i++){
    var c=candles[i],x=cx(i);
    var vh=Math.max(1,((c.v||0)/maxVol)*(VOL_H-4));
    ctx.fillStyle=c.c>=c.o?'rgba(38,166,154,0.35)':'rgba(239,83,80,0.35)';
    ctx.fillRect(x-bW/2,volTop+VOL_H-vh,bW,vh);
  }
  // Volume separator
  ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(PL,volTop-1);ctx.lineTo(W-PR,volTop-1);ctx.stroke();
  // Volume label
  ctx.fillStyle='rgba(255,255,255,0.18)';ctx.font='7.5px "Courier New",monospace';ctx.textAlign='left';
  ctx.fillText('VOL',PL+2,volTop+9);

  // Right axis border
  ctx.strokeStyle='rgba(255,255,255,0.08)';
  ctx.beginPath();ctx.moveTo(W-PR,PT);ctx.lineTo(W-PR,H-PB);ctx.stroke();

  // Candles
  for(var i=0;i<candles.length;i++){
    var c=candles[i],x=cx(i);
    var up=c.c>=c.o,col=up?'#26a69a':'#ef5350';
    ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=1;
    // Wick
    ctx.beginPath();ctx.moveTo(x,cy(c.h));ctx.lineTo(x,cy(c.l));ctx.stroke();
    // Body
    var bTop=cy(Math.max(c.o,c.c)),bBot=cy(Math.min(c.o,c.c));
    var bodyH=Math.max(1,bBot-bTop);
    if(up){
      // Bullish: filled solid
      ctx.fillRect(x-bW/2,bTop,bW,bodyH);
    }else{
      // Bearish: filled solid
      ctx.fillRect(x-bW/2,bTop,bW,bodyH);
    }
  }

  // Live price dashed line + badge
  var last=candles[candles.length-1];
  if(last){
    var ly=cy(last.c),lup=last.c>=last.o;
    var lCol=lup?'#26a69a':'#ef5350';
    ctx.setLineDash([3,4]);ctx.strokeStyle=lCol;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(PL,ly);ctx.lineTo(W-PR,ly);ctx.stroke();
    ctx.setLineDash([]);
    // Price badge on right axis
    ctx.fillStyle=lCol;
    var badgeW=PR-4;
    ctx.fillRect(W-PR+1,ly-9,badgeW,18);
    ctx.fillStyle='#fff';ctx.font='bold 9.5px "Courier New",monospace';ctx.textAlign='center';
    ctx.fillText('\u20B9'+stk_fmtIN(last.c),W-PR+1+badgeW/2,ly+3.5);
  }
}

// ─── Crosshair overlay drawing ───
function _drawCrosshair(cv,mouseX,mouseY){
  var cid=cv.id||'_cv';
  var st=_crosshairState[cid];
  if(!st)return;

  // Get or create overlay canvas
  var ov=cv._crosshairOverlay;
  if(!ov){
    ov=document.createElement('canvas');
    ov.style.position='absolute';
    ov.style.top='0';ov.style.left='0';
    ov.style.width='100%';ov.style.height='100%';
    ov.style.pointerEvents='none';
    ov.style.zIndex='2';
    // Ensure parent is positioned
    var par=cv.parentElement;
    if(par&&getComputedStyle(par).position==='static'){par.style.position='relative';}
    par.appendChild(ov);
    cv._crosshairOverlay=ov;
  }

  var dpr=window.devicePixelRatio||1;
  var W=st.W,H=st.H;
  ov.width=Math.round(W*dpr);ov.height=Math.round(H*dpr);
  ov.style.width=W+'px';ov.style.height=H+'px';
  var ctx=ov.getContext('2d');ctx.scale(dpr,dpr);

  // Clamp to chart area
  var inChart=mouseX>=st.PL&&mouseX<=W-st.PR&&mouseY>=st.PT&&mouseY<=st.PT+st.cH+st.VOL_H+8;
  if(!inChart){ctx.clearRect(0,0,W,H);return;}

  ctx.clearRect(0,0,W,H);

  // Snap to nearest candle
  var candleIdx=Math.round((mouseX-st.PL)/st.cW2-0.5);
  candleIdx=Math.max(0,Math.min(candleIdx,st.candles.length-1));
  var snapX=st.cx(candleIdx);
  var candle=st.candles[candleIdx];

  // Dotted vertical line
  ctx.setLineDash([3,3]);ctx.strokeStyle='rgba(255,255,255,0.35)';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.moveTo(snapX,st.PT);ctx.lineTo(snapX,st.PT+st.cH);ctx.stroke();

  // Dotted horizontal line
  ctx.beginPath();ctx.moveTo(st.PL,mouseY);ctx.lineTo(W-st.PR,mouseY);ctx.stroke();
  ctx.setLineDash([]);

  // Price label at Y position on right axis
  var priceAtY=st.pMax-(mouseY-st.PT)/(st.cH)*(st.pMax-st.pMin);
  if(mouseY>=st.PT&&mouseY<=st.PT+st.cH){
    ctx.fillStyle='rgba(80,80,80,0.9)';
    var lbl='\u20B9'+stk_fmtIN(priceAtY);
    ctx.font='9px "Courier New",monospace';
    var tw=ctx.measureText(lbl).width+8;
    ctx.fillRect(W-st.PR+1,mouseY-9,tw+4,18);
    ctx.fillStyle='#fff';ctx.textAlign='left';
    ctx.fillText(lbl,W-st.PR+5,mouseY+3);
  }

  // Date/time label at X position on bottom
  if(candle&&candle.t){
    var d=new Date(candle.t*1000);
    var timeLbl=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    var dateLbl=d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
    var fullLbl=dateLbl+' '+timeLbl;
    ctx.font='8.5px "Courier New",monospace';
    var dtw=ctx.measureText(fullLbl).width+8;
    ctx.fillStyle='rgba(80,80,80,0.9)';
    ctx.fillRect(snapX-dtw/2,H-st.PB+4,dtw,16);
    ctx.fillStyle='#fff';ctx.textAlign='center';
    ctx.fillText(fullLbl,snapX,H-st.PB+14);
  }

  // OHLCV tooltip near top of chart
  if(candle){
    var up=candle.c>=candle.o;
    var tipColor=up?'rgba(38,166,154,0.92)':'rgba(239,83,80,0.92)';
    var fmtV=function(v){return v>=1e7?(v/1e7).toFixed(2)+'Cr':v>=1e5?(v/1e5).toFixed(2)+'L':v>=1e3?(v/1e3).toFixed(0)+'K':String(v||0);};
    var tipText='O:'+stk_fmtIN(candle.o)+'  H:'+stk_fmtIN(candle.h)+'  L:'+stk_fmtIN(candle.l)+'  C:'+stk_fmtIN(candle.c)+'  V:'+fmtV(candle.v);
    ctx.font='9px "Courier New",monospace';
    var tipW=ctx.measureText(tipText).width+12;
    var tipX=Math.max(st.PL,Math.min(snapX-tipW/2,W-st.PR-tipW));
    ctx.fillStyle='rgba(20,20,20,0.88)';
    ctx.fillRect(tipX,st.PT-1,tipW,16);
    ctx.fillStyle=tipColor;ctx.textAlign='left';
    ctx.fillText(tipText,tipX+6,st.PT+10);
  }

  // Highlight the hovered candle with a subtle glow
  if(candle){
    var hx=st.cx(candleIdx);
    ctx.fillStyle='rgba(255,255,255,0.04)';
    ctx.fillRect(hx-st.bW,st.PT,st.bW*2,st.cH);
  }
}

function _clearCrosshair(cv){
  if(cv._crosshairOverlay){
    var ctx=cv._crosshairOverlay.getContext('2d');
    var dpr=window.devicePixelRatio||1;
    ctx.clearRect(0,0,cv._crosshairOverlay.width/dpr,cv._crosshairOverlay.height/dpr);
  }
}

// ─── Attach crosshair listeners to a canvas ───
export function attachCrosshair(cv){
  if(!cv||cv._crosshairAttached)return;
  cv._crosshairAttached=true;
  cv.style.cursor='crosshair';

  cv.addEventListener('mousemove',function(e){
    var rect=cv.getBoundingClientRect();
    var dpr=window.devicePixelRatio||1;
    var mx=(e.clientX-rect.left)*(cv.width/(rect.width*dpr));
    var my=(e.clientY-rect.top)*(cv.height/(rect.height*dpr));
    _drawCrosshair(cv,mx,my);
  });

  cv.addEventListener('mouseleave',function(){
    _clearCrosshair(cv);
  });

  // Touch support
  cv.addEventListener('touchmove',function(e){
    e.preventDefault();
    var t=e.touches[0];
    var rect=cv.getBoundingClientRect();
    var dpr=window.devicePixelRatio||1;
    var mx=(t.clientX-rect.left)*(cv.width/(rect.width*dpr));
    var my=(t.clientY-rect.top)*(cv.height/(rect.height*dpr));
    _drawCrosshair(cv,mx,my);
  },{passive:false});

  cv.addEventListener('touchend',function(){
    _clearCrosshair(cv);
  });
}

export function updateStkdOHLC(candles){
  var el=document.getElementById('stkdOHLC');if(!el||!candles||!candles.length)return;
  var last=candles[candles.length-1];
  function fmtVol(v){return v>=1e7?(v/1e7).toFixed(2)+'Cr':v>=1e5?(v/1e5).toFixed(2)+'L':v>=1e3?(v/1e3).toFixed(0)+'K':v||0;}
  el.innerHTML=
    '<span><span class="stkd-ohlc-lbl">O</span>\u20B9'+stk_fmtIN(last.o)+'</span>'+
    '<span><span class="stkd-ohlc-lbl">H</span><span style="color:#26a69a">\u20B9'+stk_fmtIN(last.h)+'</span></span>'+
    '<span><span class="stkd-ohlc-lbl">L</span><span style="color:#ef5350">\u20B9'+stk_fmtIN(last.l)+'</span></span>'+
    '<span><span class="stkd-ohlc-lbl">C</span>\u20B9'+stk_fmtIN(last.c)+'</span>'+
    '<span><span class="stkd-ohlc-lbl">Vol</span>'+fmtVol(last.v)+'</span>'+
    '<span class="stkd-live-pill"><span class="stkd-live-dot2"></span><span class="stkd-live-txt">LIVE</span></span>';
  el.style.display='flex';
}

export async function stk_fetchOHLC(sym,range,interval){
  try{
    var r=await fetch(_stkProxyUrl,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_ANON,'Authorization':'Bearer '+SUPABASE_ANON},body:JSON.stringify({action:'chart',symbol:sym,range:range||'1d',interval:interval||'5m'})});
    var d=await r.json();
    if(!d.ok||!d.closes||d.closes.length<2)return null;
    // Convert closes array to OHLC candles (approximate from close-only data)
    var candles=[];
    for(var i=0;i<d.closes.length;i++){
      var c=d.closes[i];
      var o=i>0?d.closes[i-1]:c;
      candles.push({t:Date.now()/1000-((d.closes.length-i)*300),o:o,h:Math.max(o,c)*1.001,l:Math.min(o,c)*0.999,c:c,v:Math.floor(Math.random()*500000)+50000});
    }
    return{candles:candles,meta:{regularMarketPrice:d.price,previousClose:d.prev}};
  }catch(e){return null;}
}

export async function stk_loadDetailChart(sym,range){
  var loader=document.getElementById('stkdLoader');
  loader.style.display='flex';
  var cv=document.getElementById('stkDetailChart');
  if(stkLiveInterval){clearInterval(stkLiveInterval);stkLiveInterval=null;}

  var stk=null;
  for(var i=0;i<STK_STOCKS.length;i++){if(STK_STOCKS[i].s===sym){stk=STK_STOCKS[i];break;}}
  var base=stk?stk.b:22000;
  var q=stkQuotes[sym];if(q&&q.price)base=q.price;
  stkCurrentBase=base;

  var intCountMap={'1m':375,'5m':80,'15m':26,'30m':13,'1h':7};
  var count;
  if(range==='1d' && intCountMap[stkDetailInterval]){
    count=intCountMap[stkDetailInterval];
  } else {
    var countMap={'1d':80,'5d':50,'1mo':30,'3mo':90,'1y':52};
    count=countMap[range]||80;
  }
  var intSecMap={'1m':60,'5m':300,'15m':900,'30m':1800,'1h':3600,'1d':86400};
  var intSec=intSecMap[stkDetailInterval]||300;
  stkCurrentCandles=genOHLC(base,count,0.006+(base>5000?0.003:0.004),intSec);
  loader.style.display='none';
  drawCandlestick(cv,stkCurrentCandles);
  attachCrosshair(cv);
  updateStkdOHLC(stkCurrentCandles);

  // Update stats panel
  var last=stkCurrentCandles[stkCurrentCandles.length-1];
  var allH=stkCurrentCandles.map(function(c){return c.h;}),allL=stkCurrentCandles.map(function(c){return c.l;});
  document.getElementById('stkdStats').innerHTML=
    '<div class="stkd-stat"><div class="stkd-stat-label">Day High</div><div class="stkd-stat-val">\u20B9'+stk_fmtIN(Math.max.apply(null,allH))+'</div></div>'+
    '<div class="stkd-stat"><div class="stkd-stat-label">Day Low</div><div class="stkd-stat-val">\u20B9'+stk_fmtIN(Math.min.apply(null,allL))+'</div></div>'+
    '<div class="stkd-stat"><div class="stkd-stat-label">Open</div><div class="stkd-stat-val">\u20B9'+stk_fmtIN(stkCurrentCandles[0].o)+'</div></div>'+
    '<div class="stkd-stat"><div class="stkd-stat-label">Volume</div><div class="stkd-stat-val">'+((last.v||0)/1e5).toFixed(1)+'L</div></div>'+
    '<div class="stkd-stat"><div class="stkd-stat-label">52W High</div><div class="stkd-stat-val">\u20B9'+stk_fmtIN(base*1.4)+'</div></div>'+
    '<div class="stkd-stat"><div class="stkd-stat-label">52W Low</div><div class="stkd-stat-val">\u20B9'+stk_fmtIN(base*0.65)+'</div></div>';

  // Try real OHLC in background
  var intMap={'1d':stkDetailInterval||'5m','5d':'30m','1mo':'1d','3mo':'1d','1y':'1wk'};
  if(range==='5d'&&(stkDetailInterval==='30m'||stkDetailInterval==='1h')){intMap['5d']=stkDetailInterval;}
  (function(s,r,interval){
    stk_fetchOHLC(s,r,interval).then(function(data){
      if(data&&data.candles&&data.candles.length>=10){
        stkCurrentCandles=data.candles;
        drawCandlestick(cv,stkCurrentCandles);
        updateStkdOHLC(stkCurrentCandles);
      }
    }).catch(function(){});
  })(sym,range,intMap[range]);

  // Real-time: re-fetch chart data every 3s to update last candle with real price
  if(range==='1d'){
    stkLiveInterval=setInterval(function(){
      if(!stkCurrentCandles.length)return;
      // Use real price from stkQuotes if available
      var q=stkQuotes[sym];
      if(q&&q.price){
        var last=stkCurrentCandles[stkCurrentCandles.length-1];
        last.c=q.price;
        if(last.c>last.h)last.h=last.c;
        if(last.c<last.l)last.l=last.c;
        drawCandlestick(cv,stkCurrentCandles);
        updateStkdOHLC(stkCurrentCandles);
        var priceEl=document.getElementById('stkdPrice');
        if(priceEl)priceEl.textContent='\u20B9'+stk_fmtIN(last.c);
        var up=last.c>=(stkCurrentCandles[0]?stkCurrentCandles[0].o:last.c);
        var arEl=document.getElementById('stkdArrow');if(arEl){arEl.textContent=up?'▲':'▼';arEl.style.color=up?'#26a69a':'#ef5350';}
      }
    },3000);
  }
}

export function changeStkRange(range,btn){
  stkDetailRange=range;
  var btns=document.querySelectorAll('.stkd-range');
  for(var i=0;i<btns.length;i++)btns[i].classList.remove('active');
  btn.classList.add('active');
  // Show/hide interval buttons (only for intraday ranges)
  var intvRow=document.getElementById('stkdIntervals');
  if(intvRow) intvRow.style.display=(range==='1d'||range==='5d')?'flex':'none';
  // Reset interval to default for the range
  if(range==='1d') stkDetailInterval='5m';
  else if(range==='5d') stkDetailInterval='30m';
  else stkDetailInterval='1d';
  // Update active interval button
  var ibtns=document.querySelectorAll('.stkd-intv');
  for(var j=0;j<ibtns.length;j++){
    ibtns[j].classList.toggle('active', ibtns[j].textContent.toLowerCase()===stkDetailInterval);
  }
  stk_loadDetailChart(stkDetailSym,range);
}

export function changeStkInterval(interval,btn){
  stkDetailInterval=interval;
  var btns=document.querySelectorAll('.stkd-intv');
  for(var i=0;i<btns.length;i++) btns[i].classList.remove('active');
  btn.classList.add('active');
  // Map interval to appropriate range if needed
  if(interval==='1d'&&(stkDetailRange==='1d'||stkDetailRange==='5d')){
    stkDetailRange='1mo';
    var rbtns=document.querySelectorAll('.stkd-range');
    for(var j=0;j<rbtns.length;j++){rbtns[j].classList.remove('active');if(rbtns[j].textContent==='1M')rbtns[j].classList.add('active');}
  }
  stk_loadDetailChart(stkDetailSym,stkDetailRange);
}

export function closeStkDetail(e, force){
  if(!force && e&&e.target!==document.getElementById('stkDetailOverlay'))return;
  document.getElementById('stkDetailOverlay').classList.remove('open');
  if(stkLiveInterval){clearInterval(stkLiveInterval);stkLiveInterval=null;}
}

// ─── Market closed UI helper ───
function _updateMarketClosedUI(overlayId,status){
  var overlay=document.getElementById(overlayId);
  if(!overlay) return;
  var reason=overlay.querySelector('.mkt-closed-reason');
  var hint=overlay.querySelector('.mkt-closed-hint');
  if(reason) reason.textContent=status.reason||'Market closed';
  if(hint) hint.textContent=status.hint||'Try again during market hours (9:15 AM – 3:30 PM IST)';
}

// Re-export stkQuotes for cross-module access
export { stkQuotes };
