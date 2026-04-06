// ═══ ADMIN — User Management (Dynamox only) ═══
import { sb } from './config.js';
import { ME } from './state.js';
import { escH, notify } from './utils.js';
import { qConfirm } from './modal.js';

const ADMIN_USERNAME = 'Dynamox';

// ─── Check if current user is admin ───
export function isAdmin() {
  return ME && ME.username === ADMIN_USERNAME;
}

// ─── Show admin UI if user is Dynamox ───
export function initAdmin() {
  if (!isAdmin()) return;
  // Show nav items
  var els = ['spAdminSep','spAdminCat','spAdminNav','spSecAdmin'];
  els.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = '';
  });
  // Load banned users
  loadBannedUsers();
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
      var { data, error } = await sb.from('profiles')
        .select('id,username,avatar,photo,banned')
        .ilike('username', '%' + query + '%')
        .limit(20);

      if (error) throw error;
      if (!data || data.length === 0) {
        list.innerHTML = '<div class="sp-admin-empty">No users found</div>';
        return;
      }

      list.innerHTML = data.map(function(u) {
        var isBanned = u.banned === true;
        var avInner = u.photo
          ? '<img src="' + escH(u.photo) + '" alt="">'
          : escH((u.avatar || u.username.charAt(0)).toUpperCase());
        var tag = isBanned ? '<span class="sp-admin-tag">BANNED</span>' : '';
        var btn = '';
        // Don't show kick for self
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

// ─── Kick (ban) a user ───
export async function adminKickUser(userId, username) {
  if (!isAdmin()) return;

  var confirmed = await qConfirm(
    'Ban ' + username + ' permanently from Quro?\n\nThey will be signed out and see a "You have been kicked" message on next login.'
  );
  if (!confirmed) return;

  try {
    // Set banned flag on their profile
    var { error } = await sb.from('profiles')
      .update({ banned: true, banned_by: ME.username, banned_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;

    notify(username + ' has been banned', 'success');

    // Refresh search and banned list
    var search = document.getElementById('spAdminSearch');
    if (search && search.value) adminSearchUsers(search.value);
    loadBannedUsers();
  } catch(e) {
    notify('Failed to ban: ' + e.message, 'error');
  }
}

// ─── Unban a user ───
export async function adminUnbanUser(userId, username) {
  if (!isAdmin()) return;

  var confirmed = await qConfirm('Unban ' + username + '? They will be able to use Quro again.');
  if (!confirmed) return;

  try {
    var { error } = await sb.from('profiles')
      .update({ banned: false, banned_by: null, banned_at: null })
      .eq('id', userId);

    if (error) throw error;

    notify(username + ' has been unbanned', 'success');

    var search = document.getElementById('spAdminSearch');
    if (search && search.value) adminSearchUsers(search.value);
    loadBannedUsers();
  } catch(e) {
    notify('Failed to unban: ' + e.message, 'error');
  }
}

// ─── Load banned users list ───
async function loadBannedUsers() {
  var list = document.getElementById('spBannedList');
  if (!list) return;

  try {
    var { data, error } = await sb.from('profiles')
      .select('id,username,avatar,photo,banned_at')
      .eq('banned', true)
      .order('banned_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!data || data.length === 0) {
      list.innerHTML = '<div class="sp-admin-empty">No banned users</div>';
      return;
    }

    list.innerHTML = data.map(function(u) {
      var avInner = u.photo
        ? '<img src="' + escH(u.photo) + '" alt="">'
        : escH((u.avatar || u.username.charAt(0)).toUpperCase());
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
  } catch(e) {
    list.innerHTML = '<div class="sp-admin-empty">Failed to load</div>';
  }
}

// ─── Check if current user is banned (call on login) ───
export async function checkBanned() {
  if (!ME) return false;
  try {
    var { data } = await sb.from('profiles')
      .select('banned')
      .eq('id', ME.id)
      .single();
    if (data && data.banned === true) {
      return true;
    }
  } catch(e) {}
  return false;
}

// ─── Show banned screen ───
export function showBannedScreen() {
  // Create a full-screen banned overlay
  var overlay = document.createElement('div');
  overlay.id = 'bannedOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0a0a0e;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;';
  overlay.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="#e05050" stroke-width="1.5" style="width:64px;height:64px;margin-bottom:20px;opacity:.7"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>' +
    '<div style="font-size:24px;font-weight:800;color:#e05050;letter-spacing:-.5px;margin-bottom:8px">You Have Been Kicked</div>' +
    '<div style="font-size:14px;color:rgba(255,255,255,.4);max-width:300px;line-height:1.5;margin-bottom:32px">Your account has been permanently banned from Quro by an administrator.</div>' +
    '<button onclick="window.bannedSignOut()" style="padding:12px 32px;background:rgba(224,80,80,.15);border:1px solid rgba(224,80,80,.3);border-radius:12px;color:#e05050;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:background .2s">Sign Out</button>';
  document.body.appendChild(overlay);

  // Hide everything else
  document.getElementById('appScreen').style.display = 'none';
  var sp = document.getElementById('splashScreen');
  if (sp) sp.style.display = 'none';
}
