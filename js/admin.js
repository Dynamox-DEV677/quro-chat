// ═══ ADMIN — User Management (Dynamox only) ═══
// Uses a separate 'banned_users' table + admin_config for passcode & admin list.
// Dynamox is permanent super-admin. Can grant admin access to others.
// Passcode gate: 5 attempts per session, then locked out.
import { sb } from './config.js';
import { ME } from './state.js';
import { escH, notify } from './utils.js';
import { qConfirm } from './modal.js';

const SUPER_ADMIN = 'dynamox';
const MAX_ATTEMPTS = 5;
var _useLocalBans = false;
var _localBans = {};
var _adminUnlocked = false;
var _adminAttempts = 0;
var _grantedAdmins = []; // additional admins from DB

function _loadLocalBans() {
  try { _localBans = JSON.parse(localStorage.getItem('quro_bans') || '{}'); } catch(e) { _localBans = {}; }
}
function _saveLocalBans() {
  try { localStorage.setItem('quro_bans', JSON.stringify(_localBans)); } catch(e) {}
}

// ─── Check if current user is admin (super or granted) ───
export function isAdmin() {
  if (!ME || !ME.username) return false;
  var name = ME.username.toLowerCase();
  if (name === SUPER_ADMIN) return true;
  return _grantedAdmins.indexOf(name) !== -1;
}

function _isSuperAdmin() {
  return ME && ME.username && ME.username.toLowerCase() === SUPER_ADMIN;
}

function _isProtectedAdmin(username) {
  var name = (username || '').toLowerCase();
  return name === SUPER_ADMIN || _grantedAdmins.indexOf(name) !== -1;
}

// ─── Fetch granted admins from DB ───
async function _loadGrantedAdmins() {
  try {
    var { data, error } = await sb.from('admin_config')
      .select('value')
      .eq('key', 'admin_users')
      .maybeSingle();
    if (!error && data && data.value) {
      _grantedAdmins = data.value.split(',').map(function(s) { return s.trim().toLowerCase(); }).filter(Boolean);
    } else {
      _grantedAdmins = [];
    }
  } catch(e) {
    _grantedAdmins = [];
  }
}

async function _saveGrantedAdmins() {
  var val = _grantedAdmins.join(',');
  try {
    await sb.from('admin_config').upsert({ key: 'admin_users', value: val, updated_at: new Date().toISOString() });
  } catch(e) {}
}

// ─── Hide admin UI (call on every login/logout to reset) ───
export function hideAdmin() {
  var els = ['spAdminSep','spAdminCat','spAdminNav','spSecAdmin'];
  els.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  _adminUnlocked = false;
  var gate = document.getElementById('spAdminGate');
  var content = document.getElementById('spAdminContent');
  if (gate) gate.style.display = '';
  if (content) content.style.display = 'none';
}

// ─── Init admin UI ───
export async function initAdmin() {
  hideAdmin();

  // Load granted admins from DB before checking
  await _loadGrantedAdmins();

  if (!isAdmin()) return;

  try {
    _adminAttempts = parseInt(sessionStorage.getItem('quro_admin_attempts') || '0');
  } catch(e) { _adminAttempts = 0; }

  if (_adminAttempts >= MAX_ATTEMPTS) return;

  _loadLocalBans();

  var els = ['spAdminSep','spAdminCat','spAdminNav','spSecAdmin'];
  els.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = '';
  });

  var gate = document.getElementById('spAdminGate');
  var content = document.getElementById('spAdminContent');
  if (gate) gate.style.display = '';
  if (content) content.style.display = 'none';

  _updateAttemptsDisplay();

  var input = document.getElementById('spAdminPasscode');
  if (input) input.value = '';
  var msg = document.getElementById('spAdminPassMsg');
  if (msg) { msg.style.display = 'none'; msg.textContent = ''; }

  // Show/hide "Manage Admins" section (only super admin)
  var mgSection = document.getElementById('spAdminManage');
  if (mgSection) mgSection.style.display = _isSuperAdmin() ? '' : 'none';

  _testBanTable();
}

function _updateAttemptsDisplay() {
  var el = document.getElementById('spAdminAttempts');
  if (!el) return;
  var left = MAX_ATTEMPTS - _adminAttempts;
  el.textContent = left + ' attempt' + (left !== 1 ? 's' : '') + ' remaining';
  el.style.color = left <= 2 ? 'var(--error)' : '';
}

// ─── Verify admin passcode ───
export async function verifyAdminPasscode() {
  if (!isAdmin()) return;
  if (_adminAttempts >= MAX_ATTEMPTS) { hideAdmin(); return; }

  var input = document.getElementById('spAdminPasscode');
  var msg = document.getElementById('spAdminPassMsg');
  var code = (input ? input.value : '').trim();

  if (!code || code.length < 1) {
    if (msg) { msg.textContent = 'Enter the admin passcode'; msg.style.display = 'block'; msg.className = 'sp-admin-pass-msg err'; }
    return;
  }

  var btn = document.getElementById('spAdminVerifyBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Verifying...'; }

  try {
    var { data, error } = await sb.from('admin_config')
      .select('value')
      .eq('key', 'admin_passcode')
      .single();
    if (error) throw error;

    if (data && data.value === code) {
      _adminUnlocked = true;
      _adminAttempts = 0;
      try { sessionStorage.setItem('quro_admin_attempts', '0'); } catch(e) {}

      var gate = document.getElementById('spAdminGate');
      var content = document.getElementById('spAdminContent');
      if (gate) gate.style.display = 'none';
      if (content) content.style.display = '';

      notify('Admin access granted', 'success');
      loadBannedUsers();
      if (_isSuperAdmin()) _renderAdminList();
    } else {
      _adminAttempts++;
      try { sessionStorage.setItem('quro_admin_attempts', String(_adminAttempts)); } catch(e) {}

      if (_adminAttempts >= MAX_ATTEMPTS) {
        hideAdmin();
        notify('Admin access locked — too many attempts', 'error');
      } else {
        _updateAttemptsDisplay();
        if (msg) { msg.textContent = 'Incorrect passcode'; msg.style.display = 'block'; msg.className = 'sp-admin-pass-msg err'; }
        if (input) { input.value = ''; input.focus(); }
      }
    }
  } catch(e) {
    if (msg) { msg.textContent = 'Error: ' + escH(e.message || 'Could not verify'); msg.style.display = 'block'; msg.className = 'sp-admin-pass-msg err'; }
  }

  if (btn) { btn.disabled = false; btn.textContent = 'Unlock'; }
}

// ─── Manage Admins (super admin only) ───
function _renderAdminList() {
  var list = document.getElementById('spAdminUsersList');
  if (!list) return;

  if (_grantedAdmins.length === 0) {
    list.innerHTML = '<div class="sp-admin-empty">No additional admins granted</div>';
    return;
  }

  list.innerHTML = _grantedAdmins.map(function(name) {
    return '<div class="sp-admin-user">' +
      '<div class="sp-admin-av">' + escH(name.charAt(0).toUpperCase()) + '</div>' +
      '<div class="sp-admin-info">' +
        '<div class="sp-admin-name">' + escH(name) + ' <span class="sp-admin-tag" style="background:rgba(56,161,105,.15);color:var(--primary)">ADMIN</span></div>' +
      '</div>' +
      '<button class="sp-admin-kick" onclick="adminRevokeAccess(\'' + escH(name) + '\')">REVOKE</button>' +
    '</div>';
  }).join('');
}

export async function adminGrantAccess() {
  if (!_isSuperAdmin() || !_adminUnlocked) return;

  var input = document.getElementById('spAdminGrantInput');
  var username = (input ? input.value : '').trim().toLowerCase();

  if (!username || username.length < 2) {
    notify('Enter a valid username', 'error');
    return;
  }

  if (username === SUPER_ADMIN) {
    notify('You are already the super admin', 'error');
    return;
  }

  if (_grantedAdmins.indexOf(username) !== -1) {
    notify(username + ' already has admin access', 'error');
    return;
  }

  // Verify user exists in profiles
  try {
    var { data, error } = await sb.from('profiles')
      .select('username')
      .ilike('username', username)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) {
      notify('User "' + username + '" not found', 'error');
      return;
    }
  } catch(e) {
    notify('Error checking user: ' + e.message, 'error');
    return;
  }

  _grantedAdmins.push(username);
  await _saveGrantedAdmins();
  if (input) input.value = '';
  _renderAdminList();
  notify(username + ' granted admin access', 'success');
}

export async function adminRevokeAccess(username) {
  if (!_isSuperAdmin() || !_adminUnlocked) return;

  var confirmed = await qConfirm('Revoke admin access for ' + username + '?');
  if (!confirmed) return;

  _grantedAdmins = _grantedAdmins.filter(function(n) { return n !== username.toLowerCase(); });
  await _saveGrantedAdmins();
  _renderAdminList();
  notify(username + ' admin access revoked', 'success');
}

// ─── Ban table check ───
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
  if (!isAdmin() || !_adminUnlocked) return;
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
      var { data, error } = await sb.from('profiles')
        .select('id,username,avatar,photo')
        .ilike('username', '%' + query + '%')
        .limit(20);

      if (error) throw error;
      if (!data || data.length === 0) {
        list.innerHTML = '<div class="sp-admin-empty">No users found</div>';
        return;
      }

      var bannedIds = await _getBannedIds();

      list.innerHTML = data.map(function(u) {
        var isBanned = bannedIds[u.id] === true;
        var isAdm = _isProtectedAdmin(u.username);
        var avInner = u.photo
          ? '<img src="' + escH(u.photo) + '" alt="">'
          : escH((u.avatar || u.username.charAt(0)).toUpperCase());
        var tag = isBanned ? '<span class="sp-admin-tag">BANNED</span>' : '';
        if (isAdm) tag += '<span class="sp-admin-tag" style="background:rgba(56,161,105,.15);color:var(--primary)">ADMIN</span>';
        var btn = '';
        if (!isAdm) {
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
    Object.keys(_localBans).forEach(function(k) { ids[k] = true; });
  }
  return ids;
}

// ─── Kick (ban) a user ───
export async function adminKickUser(userId, username) {
  if (!isAdmin() || !_adminUnlocked) return;

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
    _localBans[userId] = { username: username, banned_at: new Date().toISOString() };
    _saveLocalBans();
    notify(username + ' has been banned', 'success');
    var search = document.getElementById('spAdminSearch');
    if (search && search.value) adminSearchUsers(search.value);
    loadBannedUsers();
  } catch(e) {
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
  if (!isAdmin() || !_adminUnlocked) return;

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
  try {
    var { data, error } = await sb.from('banned_users')
      .select('user_id').eq('user_id', ME.id).maybeSingle();
    if (!error && data) return true;
  } catch(e) {}
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
