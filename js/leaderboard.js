// ═══ TRADING LEADERBOARD PAGE ═══
import { sb } from './config.js';
import { ME, appMode, trdPrices } from './state.js';
import { escH, stk_fmtIN } from './utils.js';

export function openLeaderPage(){
  document.getElementById('leaderPage').classList.add('open');
  document.getElementById('srvLeaderBtn').classList.add('active');
  document.querySelectorAll('.sb-nav-item').forEach(function(n){n.classList.remove('active');});
  document.getElementById('navLeader').classList.add('active');
  loadLeaderboard();
}

export function closeLeaderPage(){
  document.getElementById('leaderPage').classList.remove('open');
  document.getElementById('srvLeaderBtn').classList.remove('active');
  if(appMode==='home'){document.querySelectorAll('.sb-nav-item').forEach(function(n){n.classList.remove('active');});document.getElementById('navHome').classList.add('active');}
}

export async function loadLeaderboard(){
  var body=document.getElementById('lpBody');
  body.innerHTML='<div style="text-align:center;padding:40px;color:rgba(255,255,255,.2);font-size:10px;letter-spacing:2px">LOADING…</div>';
  try{
    var [pRes,hRes,prRes]=await Promise.all([
      sb.from('stock_portfolios').select('user_id,cash_balance'),
      sb.from('stock_holdings').select('user_id,symbol,shares,avg_buy_price'),
      sb.from('profiles').select('id,username,avatar,photo,name_font,nameplate,about,banner')
    ]);
    var profMap={};
    (prRes.data||[]).forEach(function(p){profMap[p.id]=p;});
    var holdsByUser={};
    (hRes.data||[]).forEach(function(h){
      if(!holdsByUser[h.user_id])holdsByUser[h.user_id]=[];
      holdsByUser[h.user_id].push(h);
    });
    var entries=(pRes.data||[]).map(function(p){
      var prof=profMap[p.user_id]||{username:'Unknown',avatar:'?',photo:''};
      var cash=p.cash_balance||0;
      var curValue=0;
      (holdsByUser[p.user_id]||[]).forEach(function(h){
        var curPrice=(trdPrices&&trdPrices[h.symbol])?trdPrices[h.symbol].price:h.avg_buy_price;
        curValue+=h.shares*curPrice;
      });
      var total=cash+curValue;
      return{prof:prof,total:total,pnl:total-100000,userId:p.user_id};
    });
    entries.sort(function(a,b){return b.total-a.total;});
    if(!entries.length){body.innerHTML='<div style="text-align:center;padding:40px;color:rgba(255,255,255,.2)">No traders yet.<br>Start Paper Trading to appear here!</div>';return;}
    body.innerHTML='<button class="lp-refresh" onclick="loadLeaderboard()">↻ Refresh</button>'+
      entries.map(function(e,i){
        var rankStr=i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1);
        var rankCls=i===0?'r1':i===1?'r2':i===2?'r3':'';
        var isMe=ME&&e.userId===ME.id;
        var pnlUp=e.pnl>=0;
        return '<div class="lp-item'+(isMe?' me':'')+'">'+
          '<div class="lp-rank '+rankCls+'">'+rankStr+'</div>'+
          '<div class="lp-av">'+(e.prof.photo?'<img src="'+escH(e.prof.photo)+'">':escH(e.prof.avatar||'?'))+'</div>'+
          '<div class="lp-uinfo"><div class="lp-uname nf-'+(e.prof.name_font||'default')+'">'+escH(e.prof.username)+(isMe?' <span style="font-size:9px;opacity:.4">(you)</span>':'')+'</div>'+
          '<div class="lp-utype">Paper Portfolio</div></div>'+
          '<div class="lp-val"><div class="lp-total">₹'+stk_fmtIN(e.total)+'</div>'+
          '<div class="lp-pnl '+(pnlUp?'up':'down')+'">'+(pnlUp?'+':'−')+'₹'+stk_fmtIN(Math.abs(e.pnl))+'</div></div></div>';
      }).join('');
  }catch(err){body.innerHTML='<div style="text-align:center;padding:40px;color:rgba(255,255,255,.2)">Failed to load.<br>'+escH(err.message)+'</div>';}
}
