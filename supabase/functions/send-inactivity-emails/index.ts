// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.7";

// ─── Gmail Config ───
const GMAIL_USER = "quro.cor@gmail.com";
const GMAIL_APP_PASSWORD = "buyn vwsm xcwi yvep";
const INACTIVE_DAYS = 4;
const APP_URL = "https://huddle-pro-8.vercel.app/";

serve(async (_req) => {
  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ─── Welcome Email Mode ───
    let body: any = {};
    try { body = await _req.json(); } catch (_) {}

    if (body.welcome && body.to && body.username) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
      });
      await transporter.sendMail({
        from: `"Quro" <${GMAIL_USER}>`,
        to: body.to,
        subject: `✅ Email linked to your Quro account`,
        html: buildWelcomeHTML(body.username, body.to),
      });
      return json({ ok: true, type: "welcome" });
    }

    // ─── Inactivity Check Mode (called by cron) ───
    const cutoff = new Date(Date.now() - INACTIVE_DAYS * 86400000).toISOString();

    // 1. Find inactive users who have a linked email
    const { data: users, error } = await sb
      .from("profiles")
      .select("id, username, contact_email, last_seen, last_inactivity_email")
      .not("contact_email", "is", null)
      .lt("last_seen", cutoff);

    if (error) throw error;
    if (!users?.length) return json({ sent: 0, msg: "No inactive users" });

    // 2. Setup Gmail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    let sentCount = 0;

    for (const user of users) {
      // Skip if emailed in the last 3 days (prevent spam)
      if (user.last_inactivity_email) {
        const last = new Date(user.last_inactivity_email).getTime();
        if (Date.now() - last < 3 * 86400000) continue;
      }

      // 3. Count missed messages in their servers
      const { data: memberships } = await sb
        .from("server_members")
        .select("server_id, servers(name)")
        .eq("user_id", user.id);

      let totalMissed = 0;
      const breakdown: { name: string; count: number }[] = [];

      if (memberships) {
        for (const m of memberships) {
          const srv = (m as any).servers;
          if (!srv) continue;
          const { count } = await sb
            .from("messages")
            .select("id", { count: "exact", head: true })
            .like("server_channel", `${m.server_id}_%`)
            .gt("created_at", user.last_seen);
          if (count && count > 0) {
            totalMissed += count;
            breakdown.push({ name: srv.name, count });
          }
        }
      }

      // Count missed DMs
      const { count: dmCount } = await sb
        .from("messages")
        .select("id", { count: "exact", head: true })
        .like("server_channel", `dm_%`)
        .like("server_channel", `%${user.id}%`)
        .gt("created_at", user.last_seen)
        .neq("user_id", user.id);

      if (dmCount && dmCount > 0) {
        totalMissed += dmCount;
        breakdown.push({ name: "Direct Messages", count: dmCount });
      }

      const daysAway = Math.floor((Date.now() - new Date(user.last_seen).getTime()) / 86400000);

      // 4. Build email HTML
      const html = buildEmailHTML(user.username, daysAway, totalMissed, breakdown);

      // 5. Send it
      await transporter.sendMail({
        from: `"Quro" <${GMAIL_USER}>`,
        to: user.contact_email,
        subject: totalMissed > 0
          ? `👋 ${user.username}, you have ${totalMissed} unread message${totalMissed !== 1 ? "s" : ""} on Quro`
          : `👋 ${user.username}, we miss you on Quro!`,
        html,
      });

      // 6. Mark that we emailed them
      await sb
        .from("profiles")
        .update({ last_inactivity_email: new Date().toISOString() })
        .eq("id", user.id);

      sentCount++;
    }

    return json({ ok: true, sent: sentCount });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Beautiful HTML Email Template ───
function buildEmailHTML(
  username: string,
  daysAway: number,
  totalMissed: number,
  breakdown: { name: string; count: number }[]
) {
  const serverRows = breakdown
    .map(
      (s) => `
        <tr>
          <td style="padding:12px 16px;font-size:14px;color:#d0d0d0;border-bottom:1px solid rgba(255,255,255,.05)">
            <span style="margin-right:8px">${s.name === "Direct Messages" ? "💬" : "#"}</span>${esc(s.name)}
          </td>
          <td style="padding:12px 16px;font-size:14px;font-weight:800;color:#5865f2;text-align:right;border-bottom:1px solid rgba(255,255,255,.05)">
            ${s.count}
          </td>
        </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
</head>
<body style="margin:0;padding:0;background:#030303;font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,sans-serif;-webkit-font-smoothing:antialiased">
<div style="max-width:520px;margin:0 auto;padding:28px 16px">

  <!-- ━━━ Header Banner ━━━ -->
  <div style="text-align:center;padding:40px 24px 32px;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 40%,#0f3460 100%);border-radius:20px 20px 0 0;position:relative;overflow:hidden">
    <div style="position:relative;z-index:1">
      <div style="width:64px;height:64px;margin:0 auto 16px;background:rgba(255,255,255,.08);border-radius:50%;display:flex;align-items:center;justify-content:center">
        <span style="font-size:32px;line-height:1">👋</span>
      </div>
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-.5px;line-height:1.3">
        Hey ${esc(username)},<br>we miss you!
      </h1>
      <p style="margin:12px 0 0;font-size:14px;color:rgba(255,255,255,.5);line-height:1.5">
        You&rsquo;ve been away from Quro for
        <span style="display:inline-block;background:rgba(255,165,0,.15);color:#ffa500;font-weight:700;padding:2px 10px;border-radius:20px;font-size:13px;margin:0 2px">
          ${daysAway} day${daysAway !== 1 ? "s" : ""}
        </span>
      </p>
    </div>
  </div>

  <!-- ━━━ Body ━━━ -->
  <div style="background:#0e0e0e;padding:28px 24px;border-left:1px solid rgba(255,255,255,.05);border-right:1px solid rgba(255,255,255,.05)">

    ${totalMissed > 0 ? `
    <!-- Notification Count -->
    <div style="text-align:center;margin-bottom:28px">
      <div style="display:inline-block;background:linear-gradient(135deg,rgba(237,66,69,.08),rgba(237,66,69,.15));border:1px solid rgba(237,66,69,.2);border-radius:16px;padding:24px 40px;position:relative">
        <div style="font-size:48px;font-weight:900;color:#ed4245;line-height:1;letter-spacing:-2px">${totalMissed}</div>
        <div style="font-size:11px;font-weight:700;color:rgba(237,66,69,.65);text-transform:uppercase;letter-spacing:1.5px;margin-top:6px">
          Unread Message${totalMissed !== 1 ? "s" : ""}
        </div>
        <div style="position:absolute;top:-6px;right:-6px;width:14px;height:14px;background:#ed4245;border-radius:50%;border:3px solid #0e0e0e"></div>
      </div>
    </div>

    <!-- Server Breakdown Table -->
    <div style="background:#131313;border:1px solid rgba(255,255,255,.06);border-radius:12px;overflow:hidden;margin-bottom:28px">
      <div style="padding:12px 16px;font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.3);background:#111;border-bottom:1px solid rgba(255,255,255,.05)">
        ✨ Where you&rsquo;re missed
      </div>
      <table style="width:100%;border-collapse:collapse">
        ${serverRows}
      </table>
    </div>
    ` : `
    <!-- No Messages -->
    <div style="text-align:center;padding:24px;margin-bottom:20px">
      <div style="font-size:40px;margin-bottom:12px">😊</div>
      <div style="color:rgba(255,255,255,.4);font-size:14px;line-height:1.6">
        It&rsquo;s quiet without you!<br>Your friends are waiting for you to come back.
      </div>
    </div>
    `}

    <!-- CTA Button -->
    <div style="text-align:center">
      <a href="${APP_URL}" style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#5865f2,#4752c4);color:#ffffff;font-size:15px;font-weight:700;border-radius:10px;text-decoration:none;letter-spacing:.3px;box-shadow:0 4px 16px rgba(88,101,242,.3);transition:all .2s">
        🚀 Open Quro
      </a>
    </div>

    <p style="text-align:center;margin:20px 0 0;font-size:12px;color:rgba(255,255,255,.2)">
      Your conversations are waiting ✨
    </p>
  </div>

  <!-- ━━━ Footer ━━━ -->
  <div style="background:#090909;border:1px solid rgba(255,255,255,.04);border-top:none;border-radius:0 0 20px 20px;padding:24px 20px;text-align:center">
    <div style="font-size:16px;font-weight:900;color:rgba(255,255,255,.12);letter-spacing:4px;margin-bottom:4px">QURO</div>
    <div style="font-size:10px;color:rgba(255,255,255,.08);margin-bottom:16px">Chat, Markets &amp; Paper Trading</div>
    <div style="width:40px;height:1px;background:rgba(255,255,255,.06);margin:0 auto 16px"></div>
    <div style="font-size:10px;color:rgba(255,255,255,.1);line-height:1.6">
      You received this because your email is linked to your Quro account.<br>
      To stop these emails, go to Settings &rarr; Unlink Email.
    </div>
  </div>

</div>
</body>
</html>`;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── Welcome Email Template ───
function buildWelcomeHTML(username: string, email: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
</head>
<body style="margin:0;padding:0;background:#030303;font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,sans-serif;-webkit-font-smoothing:antialiased">
<div style="max-width:520px;margin:0 auto;padding:28px 16px">

  <!-- Header -->
  <div style="text-align:center;padding:40px 24px 32px;background:linear-gradient(135deg,#0f3460 0%,#16213e 40%,#1a1a2e 100%);border-radius:20px 20px 0 0">
    <div style="width:64px;height:64px;margin:0 auto 16px;background:rgba(255,255,255,.08);border-radius:50%;display:flex;align-items:center;justify-content:center">
      <span style="font-size:32px;line-height:1">✅</span>
    </div>
    <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-.5px;line-height:1.3">
      Email Linked!
    </h1>
    <p style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,.45)">
      Hey ${esc(username)}, you&rsquo;re all set
    </p>
  </div>

  <!-- Body -->
  <div style="background:#0e0e0e;padding:28px 24px;border-left:1px solid rgba(255,255,255,.05);border-right:1px solid rgba(255,255,255,.05)">

    <!-- Email Card -->
    <div style="background:#131313;border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
      <div style="font-size:12px;color:rgba(255,255,255,.25);margin-bottom:8px">YOUR LINKED EMAIL</div>
      <div style="font-size:18px;font-weight:700;color:#5865f2;word-break:break-all">${esc(email)}</div>
    </div>

    <!-- What this means -->
    <div style="margin-bottom:24px">
      <div style="font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.25);margin-bottom:14px">What this means</div>

      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
        <div style="width:32px;height:32px;background:rgba(88,101,242,.1);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:16px">🔔</span>
        </div>
        <div>
          <div style="font-size:13px;font-weight:700;color:#e0e0e0">Inactivity Alerts</div>
          <div style="font-size:12px;color:rgba(255,255,255,.35);margin-top:2px;line-height:1.5">If you&rsquo;re away for a while, we&rsquo;ll email you with your missed messages</div>
        </div>
      </div>

      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px">
        <div style="width:32px;height:32px;background:rgba(88,101,242,.1);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:16px">👤</span>
        </div>
        <div>
          <div style="font-size:13px;font-weight:700;color:#e0e0e0">Visible on Profile</div>
          <div style="font-size:12px;color:rgba(255,255,255,.35);margin-top:2px;line-height:1.5">Your email will be shown on your profile card for others to see</div>
        </div>
      </div>

      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="width:32px;height:32px;background:rgba(88,101,242,.1);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:16px">⚙️</span>
        </div>
        <div>
          <div style="font-size:13px;font-weight:700;color:#e0e0e0">Easy to Manage</div>
          <div style="font-size:12px;color:rgba(255,255,255,.35);margin-top:2px;line-height:1.5">You can update or unlink your email anytime in Settings</div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center">
      <a href="${APP_URL}" style="display:inline-block;padding:14px 44px;background:linear-gradient(135deg,#5865f2,#4752c4);color:#ffffff;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;letter-spacing:.3px;box-shadow:0 4px 16px rgba(88,101,242,.3)">
        Open Quro
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#090909;border:1px solid rgba(255,255,255,.04);border-top:none;border-radius:0 0 20px 20px;padding:24px 20px;text-align:center">
    <div style="font-size:16px;font-weight:900;color:rgba(255,255,255,.12);letter-spacing:4px;margin-bottom:4px">QURO</div>
    <div style="font-size:10px;color:rgba(255,255,255,.08);margin-bottom:16px">Chat, Markets &amp; Paper Trading</div>
    <div style="width:40px;height:1px;background:rgba(255,255,255,.06);margin:0 auto 16px"></div>
    <div style="font-size:10px;color:rgba(255,255,255,.1);line-height:1.6">
      To stop emails, go to Settings &rarr; Unlink Email.
    </div>
  </div>

</div>
</body>
</html>`;
}
