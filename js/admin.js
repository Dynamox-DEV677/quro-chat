// ═══ ADMIN — User Management (Dynamox only) ═══
// Uses a separate 'banned_users' table to avoid needing schema changes on profiles.
// If banned_users table doesn't exist, falls back to localStorage ban list.
import { sb } from './config.js';
import { ME } from './state.js';
import { escH, notify } from './utils.js';
import { qConfirm } from './modal.js';

const ADMIN_USERNAME = 'dynamox';
var _useLocalBans = false; // fallback if table doesn't exist
var _localBans = {}; // { oderId: { username, banned_at } }

function _loadLocalBans() {
  try { _localBans = JSON.parse(localStorage.getItem('quro_bans') || '{}'); } catch(e) { _localBans = {}; }
}
function _saveLocalBans() {
  try { localStorage.setItem('quro_bans', JSON.stringify(_localBans)); } catch(e) {}
}

// ─── Check if current user is admin ───
export function isAdmin() {
  return ME && ME.username && ME.username.toLowerCase() === ADMIN_USERNAME;
}

// ─── Show admin UI if user is Dynamox ───
export function initAdmin() {
  if (!isAdmin()) return;
  _loadLocalBans();
  var els = ['spAdminSep','spAdminCat','spAdminNav','spSecAdmin'];
  els.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = '';
  });
  // Test if banned_users table exists
  _testBanTable().then(function() {
    loadBannedUsers();
  });
}

async function _testBanTable() {
  try {
    var { error } = await sb.from('banned_users').select('user_id').limit(1);
    if (error && (error.message.includes('does not exist') || error.code === '42P01')) {
      _useLocalBans = true;
    }
  } catch(e) {
    _useLocalBans = true;
  }
}

// ─── Search users ───
var _adminSearchTimeout = null;
export function adminSearchUsers(query) {
  clearTimeout(_adminSearchTimeout);
  var list = document.getElementById('spAdminList');
  if (!list) return;

  query = (query || '').trim();
  if (query.length < 2) {
    list.innerHTML = '<div class="sp-admin-empty">Type at least 2 characters</div>';
    return;
  }

  list.innerHTML = '<div class="sp-admin-empty">Searching...</div>';

  _adminSearchTimeout = setTimeout(async function() {
    try {
      // Only select columns that definitely exist
      var { data, error } = await sb.from('profiles')
        .select('id,username,avatar,photo')
        .ilike('username', '%' + query + '%')
        .limit(20);

      if (error) throw error;
      if (!data || data.length === 0) {
        list.innerHTML = '<div class="sp-admin-empty">No users found</div>';
        return;
      }

      // Check which users are banned
      var bannedIds = await _getBannedIds();

      list.innerHTML = data.map(function(u) {
        var isBanned = bannedIds[u.id] === true;
        var avInner = u.photo
          ? '<img src="' + escH(u.photo) + '" alt="">'
          : escH((u.avatar || u.username.charAt(0)).toUpperCase());
        var tag = isBanned ? '<span class="sp-admin-tag">BANNED</span>' : '';
        var btn = '';
        if (u.username !== ADMIN_USERNAME) {
          if (isBanned) {
            btn = '<button class="sp-admin-unban" onclick="adminUnbanUser(\'' + escH(u.id) + '\',\'' + escH(u.username) + '\')">UNBAN</button>';
          } else {
            btn = '<button class="sp-admin-kick" onclick="adminKickUser(\'' + escH(u.id) + '\',\'' + escH(u.username) + '\')">KICK</button>';
          }
        }
        return '<div class="sp-admin-user">' +
          '<div class="sp-admin-av">' + avInner + '</div>' +
          '<div class="sp-admin-info">' +
            '<div class="sp-admin-name">' + escH(u.username) + tag + '</div>' +
            '<div class="sp-admin-id">' + escH(u.id.substring(0, 8)) + '...</div>' +
          '</div>' +
          btn +
        '</div>';
      }).join('');
    } catch(e) {
      list.innerHTML = '<div class="sp-admin-empty">Error: ' + escH(e.message) + '</div>';
    }
  }, 300);
}

// Get set of banned user IDs
async function _getBannedIds() {
  var ids = {};
  if (_useLocalBans) {
    Object.keys(_localBans).forEach(function(k) { ids[k] = true; });
    return ids;
  }
  try {
    var { data } = await sb.from('banned_users').select('user_id');
    if (data) data.forEach(function(r) { ids[r.user_id] = true; });
  } catch(e) {
    // Fallback to local
    Object.keys(_localBans).forEach(function(k) { ids[k] = true; });
  }
  return ids;
}

// ─── Kick (ban) a user ───
export async function adminKickUser(userId, username) {
  if (!isAdmin()) return;

  var confirmed = await qConfirm(
    'Ban ' + username + ' permanently from Quro?\n\nThey will see a "You have been kicked" message on next login.'
  );
  if (!confirmed) return;

  try {
    if (!_useLocalBans) {
      var { error } = await sb.from('banned_users')
        .upsert({ user_id: userId, username: username, banned_by: ME.username, banned_at: new Date().toISOString() });
      if (error) throw error;
    }
    // Always save locally too (syncs across devices for admin, acts as fallback)
    _localBans[userId] = { username: username, banned_at: new Date().toISOString() };
    _saveLocalBans();

    notify(username + ' has been banned', 'success');
    var search = document.getElementById('spAdminSearch');
    if (search && search.value) adminSearchUsers(search.value);
    loadBannedUsers();
  } catch(e) {
    // If table error, save locally
    _localBans[userId] = { username: username, banned_at: new Date().toISOString() };
    _saveLocalBans();
    _useLocalBans = true;
    notify(username + ' banned (saved locally)', 'success');
    var search = document.getElementById('spAdminSearch');
    if (search && search.value) adminSearchUsers(search.value);
    loadBannedUsers();
  }
}

// ─── Unban a user ───
export async function adminUnbanUser(userId, username) {
  if (!isAdmin()) return;

  var confirmed = await qConfirm('Unban ' + username + '? They will be able to use Quro again.');
  if (!confirmed) return;

  try {
    if (!_useLocalBans) {
      var { error } = await sb.from('banned_users').delete().eq('user_id', userId);
      if (error) throw error;
    }
    delete _localBans[userId];
    _saveLocalBans();

    notify(username + ' has been unbanned', 'success');
    var search = document.getElementById('spAdminSearch');
    if (search && search.value) adminSearchUsers(search.value);
    loadBannedUsers();
  } catch(e) {
    delete _localBans[userId];
    _saveLocalBans();
    notify(username + ' unbanned', 'success');
    loadBannedUsers();
  }
}

// ─── Load banned users list ───
async function loadBannedUsers() {
  var list = document.getElementById('spBannedList');
  if (!list) return;

  var bannedArr = [];

  if (!_useLocalBans) {
    try {
      var { data, error } = await sb.from('banned_users')
        .select('user_id,username,banned_at')
        .order('banned_at', { ascending: false })
        .limit(50);
      if (!error && data) {
        bannedArr = data.map(function(r) { return { id: r.user_id, username: r.username, banned_at: r.banned_at }; });
      }
    } catch(e) { _useLocalBans = true; }
  }

  // Merge local bans
  if (_useLocalBans || bannedArr.length === 0) {
    Object.keys(_localBans).forEach(function(uid) {
      var b = _localBans[uid];
      if (!bannedArr.find(function(x) { return x.id === uid; })) {
        bannedArr.push({ id: uid, username: b.username, banned_at: b.banned_at });
      }
    });
  }

  if (bannedArr.length === 0) {
    list.innerHTML = '<div class="sp-admin-empty">No banned users</div>';
    return;
  }

  // Get avatars/photos for banned users
  var profiles = {};
  try {
    var ids = bannedArr.map(function(b) { return b.id; });
    var { data: pData } = await sb.from('profiles').select('id,avatar,photo').in('id', ids);
    if (pData) pData.forEach(function(p) { profiles[p.id] = p; });
  } catch(e) {}

  list.innerHTML = bannedArr.map(function(u) {
    var prof = profiles[u.id] || {};
    var avInner = prof.photo
      ? '<img src="' + escH(prof.photo) + '" alt="">'
      : escH(((prof.avatar || u.username || '?').charAt(0)).toUpperCase());
    var when = u.banned_at ? new Date(u.banned_at).toLocaleDateString() : '';
    return '<div class="sp-admin-user">' +
      '<div class="sp-admin-av">' + avInner + '</div>' +
      '<div class="sp-admin-info">' +
        '<div class="sp-admin-name">' + escH(u.username) + ' <span class="sp-admin-tag">BANNED</span></div>' +
        '<div class="sp-admin-id">Banned ' + escH(when) + '</div>' +
      '</div>' +
      '<button class="sp-admin-unban" onclick="adminUnbanUser(\'' + escH(u.id) + '\',\'' + escH(u.username) + '\')">UNBAN</button>' +
    '</div>';
  }).join('');
}

// ─── Check if current user is banned (call on login) ───
export async function checkBanned() {
  if (!ME) return false;

  // Check banned_users table first
  try {
    var { data, error } = await sb.from('banned_users')
      .select('user_id')
      .eq('user_id', ME.id)
      .maybeSingle();
    if (!error && data) return true;
  } catch(e) {}

  // Fallback: check localStorage (works if admin banned from same device)
  try {
    var bans = JSON.parse(localStorage.getItem('quro_bans') || '{}');
    if (bans[ME.id]) return true;
  } catch(e) {}

  return false;
}

// ─── Show banned screen ───
export function showBannedScreen() {
  var overlay = document.createElement('div');
  overlay.id = 'bannedOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0a0a0e;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;';
  overlay.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="#e05050" stroke-width="1.5" style="width:64px;height:64px;margin-bottom:20px;opacity:.7"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>' +
    '<div style="font-size:24px;font-weight:800;color:#e05050;letter-spacing:-.5px;margin-bottom:8px">You Have Been Kicked</div>' +
    '<div style="font-size:14px;color:rgba(255,255,255,.4);max-width:300px;line-height:1.5;margin-bottom:32px">Your account has been permanently banned from Quro by an administrator.</div>' +
    '<button onclick="window.bannedSignOut()" style="padding:12px 32px;background:rgba(224,80,80,.15);border:1px solid rgba(224,80,80,.3);border-radius:12px;color:#e05050;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .2s">Sign Out</button>';
  document.body.appendChild(overlay);

  var app = document.getElementById('appScreen');
  if (app) app.style.display = 'none';
  var sp = document.getElementById('splashScreen');
  if (sp) sp.style.display = 'none';
}
