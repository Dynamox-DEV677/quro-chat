import { SUPABASE_URL } from './config.js?v=48';

// ── Core user / app state ──
export let ME=null;
export function setME(v){ ME=v; }

export let chatMode='channel';
export function setChatMode(v){ chatMode=v; }

export let curChannel='general';
export function setCurChannel(v){ curChannel=v; }

export let curDMUser=null;
export function setCurDMUser(v){ curDMUser=v; }

export let curServer='';
export function setCurServer(v){ curServer=v; }

export let appMode='home'; // 'home' or 'server'
export function setAppMode(v){ appMode=v; }

// ── Sidebar / call / media ──
export let membersOpen=true;
export function setMembersOpen(v){ membersOpen=v; }

export let callActive=false;
export function setCallActive(v){ callActive=v; }

export let callSecs=0;
export function setCallSecs(v){ callSecs=v; }

export let callTick=null;
export function setCallTick(v){ callTick=v; }

export let isMuted=false;
export function setIsMuted(v){ isMuted=v; }

export let isCamOff=false;
export function setIsCamOff(v){ isCamOff=v; }

export let isSpeakerOn=false;
export function setIsSpeakerOn(v){ isSpeakerOn=v; }

// ── Registration / realtime ──
export let regPhotoB64='';
export function setRegPhotoB64(v){ regPhotoB64=v; }

export let realtimeSub=null;
export function setRealtimeSub(v){ realtimeSub=v; }

// ── Users ──
export let REAL_USERS=[];
export function setREAL_USERS(v){ REAL_USERS=v; }

// ── Group chats ──
export var curGroupChat=null; // Current open group chat object {id,name,icon,members:[]}
export function setCurGroupChat(v){ curGroupChat=v; }

// ── Voice channel presence ──
export var _vcPresenceChannels={};  // {channelName: supabaseChannel} for VC presence
export function set_vcPresenceChannels(v){ _vcPresenceChannels=v; }

export var _vcUsers={};             // {channelName: [{id,username,photo,avatar}]}
export function set_vcUsers(v){ _vcUsers=v; }

export var _currentVC=null;         // name of VC we're currently in (or null)
export function set_currentVC(v){ _currentVC=v; }

export var _serverChannelsList=[];  // cached channel list for current server
export function set_serverChannelsList(v){ _serverChannelsList=v; }

// ── Polling / realtime connection ──
export let _pollTimer=null;
export function set_pollTimer(v){ _pollTimer=v; }

export let _lastSeenId=null;
export function set_lastSeenId(v){ _lastSeenId=v; }

export let _rtConnected=false;
export function set_rtConnected(v){ _rtConnected=v; }

// ── DM last messages ──
export var _dmLastMsg={}; // {dmKey: timestamp} — tracks last message time per DM
export function set_dmLastMsg(v){ _dmLastMsg=v; }

// ── Group chat lists ──
export var _myGroupChats=[];   // [{id,name,icon,created_by,members:[{id,username,photo,avatar}]}]
export function set_myGroupChats(v){ _myGroupChats=v; }

export var _gcSelectedUsers=[]; // Users selected in create modal
export function set_gcSelectedUsers(v){ _gcSelectedUsers=v; }

// ── Invite ──
export var _pendingInvite=null;
export function set_pendingInvite(v){ _pendingInvite=v; }

// ── Message count / limit ──
export var myMsgCount=0;
export function setMyMsgCount(v){ myMsgCount=v; }

export var MSG_DAILY_LIMIT=70;

// ── Settings panel nav titles ──
export var _spNavTitles={spSecProfile:'My Account',spSecNameplate:'Nameplate',spSecAbout:'About Me',spSecNameStyle:'Name Style',spSecNameColor:'Name Color',spSecDecor:'Avatar Decor',spSecBanner:'Profile Banner',spSecAppearance:'Appearance',spSecNotif:'Notifications',spSecEmail:'Email',spSecPassword:'Change Password'};

// ── Settings panel selections ──
export var _spSelectedBanner='b1';
export function set_spSelectedBanner(v){ _spSelectedBanner=v; }

export var _spSelectedFont='default';
export function set_spSelectedFont(v){ _spSelectedFont=v; }

export var _spSelectedColor='';
export function set_spSelectedColor(v){ _spSelectedColor=v; }

export var _spSelectedDecor='none';
export function set_spSelectedDecor(v){ _spSelectedDecor=v; }

// ── Notifications / unread ──
export var notifSound=localStorage.getItem('quro-notif-sound')!=='off';
export function setNotifSound(v){ notifSound=v; }

export var notifDesktop=localStorage.getItem('quro-notif-desktop')!=='off';
export function setNotifDesktop(v){ notifDesktop=v; }

export var unreadCounts={};  // keyed by server_id
export function setUnreadCounts(v){ unreadCounts=v; }

export var globalMsgSub=null;
export function setGlobalMsgSub(v){ globalMsgSub=v; }

export var _myServerIds=[];  // list of server IDs the user is a member of
export function set_myServerIds(v){ _myServerIds=v; }

// ── Call system — DM WebRTC ──
export var _callSignalChannel=null;   // Supabase Realtime channel for signaling
export function set_callSignalChannel(v){ _callSignalChannel=v; }

export var _rtcPeer=null;             // RTCPeerConnection (DM calls)
export function set_rtcPeer(v){ _rtcPeer=v; }

export var _callTarget=null;          // The user we're calling / called by (DM)
export function set_callTarget(v){ _callTarget=v; }

export var _callType='voice';         // 'voice' or 'video'
export function set_callType(v){ _callType=v; }

export var _incomingOffer=null;       // Stored SDP offer from caller
export function set_incomingOffer(v){ _incomingOffer=v; }

export var _iceCandidateQueue=[];     // ICE candidates received before peer ready
export function set_iceCandidateQueue(v){ _iceCandidateQueue=v; }

export var _callRinging=null;         // Ringing sound interval
export function set_callRinging(v){ _callRinging=v; }

export var _callState='idle';         // idle, ringing, connecting, connected
export function set_callState(v){ _callState=v; }

// ── Call system — Group call ──
export var _gcCall=false;             // true when in a group call
export function set_gcCall(v){ _gcCall=v; }

export var _gcCallId=null;            // group chat ID for the call
export function set_gcCallId(v){ _gcCallId=v; }

export var _gcPeers={};               // {userId: RTCPeerConnection}
export function set_gcPeers(v){ _gcPeers=v; }

export var _gcStreams={};              // {userId: MediaStream}
export function set_gcStreams(v){ _gcStreams=v; }

export var _gcCallMembers=[];         // member objects [{id,username,photo,avatar}]
export function set_gcCallMembers(v){ _gcCallMembers=v; }

export var _gcConnectedCount=0;       // number of connected peers
export function set_gcConnectedCount(v){ _gcConnectedCount=v; }

export var _gcIceQueues={};           // {userId: [candidates]} queued before peer ready
export function set_gcIceQueues(v){ _gcIceQueues=v; }

export var _gcSignalChannel=null; // Shared GC signaling channel
export function set_gcSignalChannel(v){ _gcSignalChannel=v; }

// ── WebRTC config ──
export var _rtcConfig={iceServers:[
  {urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302','stun:stun3.l.google.com:19302','stun:stun4.l.google.com:19302']},
  {urls:'stun:global.stun.twilio.com:3478'},
  {urls:'stun:stun.stunprotocol.org:3478'}
],iceCandidatePoolSize:10,iceTransportPolicy:'all'};

// ── Typing indicators ──
export var _typingChannel=null;
export function set_typingChannel(v){ _typingChannel=v; }

export var _typingUsers={};
export function set_typingUsers(v){ _typingUsers=v; }

export var _typingCleanInt=null;
export function set_typingCleanInt(v){ _typingCleanInt=v; }

export var _sendTypingThrottle=0;
export function set_sendTypingThrottle(v){ _sendTypingThrottle=v; }

// ── Reply / reactions ──
export var replyTo=null;
export function setReplyTo(v){ replyTo=v; }

export var msgReactions={};
export function setMsgReactions(v){ msgReactions=v; }

// ── Decor list (constant) ──
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

// ═══════════════════════════════════════════════
//  STOCK MARKET globals
// ═══════════════════════════════════════════════

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

export var stkQuotes={};
export function setStkQuotes(v){ stkQuotes=v; }

export var stkCurFilter='all';
export function setStkCurFilter(v){ stkCurFilter=v; }

export var stkDetailSym='';
export function setStkDetailSym(v){ stkDetailSym=v; }

export var stkDetailRange='1d';
export function setStkDetailRange(v){ stkDetailRange=v; }

export var _stkProxyUrl=SUPABASE_URL+'/functions/v1/stock-proxy';

export var _stkLiveRefreshInt=null;
export function set_stkLiveRefreshInt(v){ _stkLiveRefreshInt=v; }

export var _stkHasRealData=false;
export function set_stkHasRealData(v){ _stkHasRealData=v; }

export var stkLiveInterval=null;
export function setStkLiveInterval(v){ stkLiveInterval=v; }

export var stkCurrentCandles=[];
export function setStkCurrentCandles(v){ stkCurrentCandles=v; }

export var stkCurrentBase=0;
export function setStkCurrentBase(v){ stkCurrentBase=v; }

// ═══════════════════════════════════════════════
//  PAPER TRADING globals
// ═══════════════════════════════════════════════

export var trdPrices={};       // { sym: { price, prev, name, sec } }
export function setTrdPrices(v){ trdPrices=v; }

export var trdHistory={};      // { sym: [price, price, ...] } — last 80 ticks
export function setTrdHistory(v){ trdHistory=v; }

export var trdPortfolio={ cash:100000, holdings:{} }; // local state mirror
export function setTrdPortfolio(v){ trdPortfolio=v; }

export var trdSelected=null;
export function setTrdSelected(v){ trdSelected=v; }

export var trdTab='buy';
export function setTrdTab(v){ trdTab=v; }

export var trdBottomMode='hold';
export function setTrdBottomMode(v){ trdBottomMode=v; }

export var trdTickerInt=null;
export function setTrdTickerInt(v){ trdTickerInt=v; }

export var trdWlFilter='';
export function setTrdWlFilter(v){ trdWlFilter=v; }

export var trdChartPts=[];
export function setTrdChartPts(v){ trdChartPts=v; }

// ── User search timeout (DM) ──
export var _usTimeout=null;
export function set_usTimeout(v){ _usTimeout=v; }
