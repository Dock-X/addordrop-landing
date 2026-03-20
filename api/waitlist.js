import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, source = 'landing' } = req.body || {};

  if (!email || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const cleanEmail = email.toLowerCase().trim();

  // ── Supabase insert ──────────────────────────────────────────────────────
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { error: dbError } = await supabase
    .from('waitlist')
    .insert([{ email: cleanEmail, source }]);

  if (dbError) {
    // Duplicate email — treat silently as success (don't reveal who's already signed up)
    if (dbError.code === '23505') {
      return res.status(200).json({ success: true });
    }
    console.error('Supabase error:', dbError.message);
    return res.status(500).json({ error: 'Failed to save. Please try again.' });
  }

  // ── Resend confirmation email ─────────────────────────────────────────────
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Will at AddOrDrop <will@addordrop.com>',
        to: cleanEmail,
        subject: "You're on the list. 🏈",
        html: getEmailHtml(),
      }),
    });
  } catch (emailErr) {
    // Don't fail the whole request if email fails — they're still on the list
    console.error('Resend error:', emailErr.message);
  }

  return res.status(200).json({ success: true });
}

function getEmailHtml() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're on the list.</title>
</head>
<body style="margin:0;padding:0;background-color:#0B0C0F;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0C0F;padding:48px 0;">
    <tr>
      <td align="center">
        <table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;background:#131417;border:1px solid #232529;border-radius:16px;overflow:hidden;">

          <!-- Header bar -->
          <tr>
            <td style="background:#0B0C0F;padding:28px 40px;border-bottom:1px solid #232529;">
              <span style="font-size:22px;font-weight:900;letter-spacing:3px;color:#F2F2F2;">ADD<span style="color:#AAFF47;">OR</span>DROP</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <p style="font-size:17px;color:#F2F2F2;line-height:1.7;margin:0 0 18px;">Hey,</p>

              <p style="font-size:15px;color:#bbb;line-height:1.8;margin:0 0 18px;">
                You're officially on the AddOrDrop waitlist — and I genuinely appreciate that.
              </p>

              <p style="font-size:15px;color:#bbb;line-height:1.8;margin:0 0 18px;">
                I built this because I was tired of the same thing you're probably tired of: 45 minutes of Reddit scrolling, podcast takes that have nothing to do with your actual team, and still not knowing what the right call is.
              </p>

              <p style="font-size:15px;color:#bbb;line-height:1.8;margin:0 0 24px;">
                AddOrDrop is the answer to that.
                <strong style="color:#AAFF47;">Five AI-powered tools. One price. Under 60 seconds per decision.</strong>
                No noise, no ads, no hot takes that ignore your roster.
              </p>

              <!-- Highlight box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:rgba(170,255,71,0.07);border:1px solid rgba(170,255,71,0.2);border-radius:10px;padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:2px;color:#AAFF47;text-transform:uppercase;">August 1st, 2026</p>
                    <p style="margin:0;font-size:14px;color:#ccc;line-height:1.6;">
                      That's when we go live. You'll be the first to know — I'll send you an email the morning of launch.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size:15px;color:#bbb;line-height:1.8;margin:0 0 18px;">
                One thing worth knowing:
                <strong style="color:#F2F2F2;">the first 100 users lock in $9.99/season forever</strong>
                — price goes to $19.99 after that. You're in the early window. Don't sleep on it.
              </p>

              <!-- Tools list -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr><td style="padding:6px 0;font-size:14px;color:#aaa;border-bottom:1px solid #1C1E24;">
                  <span style="color:#AAFF47;margin-right:10px;">●</span>
                  <strong style="color:#F2F2F2;">Waiver Wire</strong>
                  <span style="color:#666;margin-left:8px;">— ranked pickups built for your roster</span>
                </td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#aaa;border-bottom:1px solid #1C1E24;">
                  <span style="color:#FFD23F;margin-right:10px;">●</span>
                  <strong style="color:#F2F2F2;">Trade Analyzer</strong>
                  <span style="color:#666;margin-left:8px;">— accept, decline, or counter with confidence</span>
                </td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#aaa;border-bottom:1px solid #1C1E24;">
                  <span style="color:#5B8DEF;margin-right:10px;">●</span>
                  <strong style="color:#F2F2F2;">Start / Sit</strong>
                  <span style="color:#666;margin-left:8px;">— the hardest weekly call, simplified</span>
                </td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#aaa;border-bottom:1px solid #1C1E24;">
                  <span style="color:#FF8C42;margin-right:10px;">●</span>
                  <strong style="color:#F2F2F2;">Pre-Draft Strategy</strong>
                  <span style="color:#666;margin-left:8px;">— your personalized game plan before the draft</span>
                </td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#aaa;">
                  <span style="color:#C084FC;margin-right:10px;">●</span>
                  <strong style="color:#F2F2F2;">On The Clock</strong>
                  <span style="color:#666;margin-left:8px;">— live draft advisor, pick by pick</span>
                </td></tr>
              </table>

              <p style="font-size:15px;color:#bbb;line-height:1.8;margin:0 0 6px;">See you on August 1st,</p>
              <p style="font-size:15px;color:#F2F2F2;font-weight:700;margin:0 0 4px;">Will</p>
              <p style="font-size:13px;color:#555;margin:0;">Founder, AddOrDrop.com</p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #232529;background:#0B0C0F;">
              <p style="margin:0;font-size:12px;color:#444;line-height:1.7;">
                You're receiving this because you signed up at
                <a href="https://addordrop.com" style="color:#555;text-decoration:none;">addordrop.com</a>.<br/>
                © 2026 Blank Studio LLC ·
                <a href="https://addordrop.com/terms.html" style="color:#555;text-decoration:none;">Terms</a> ·
                <a href="https://addordrop.com/privacy.html" style="color:#555;text-decoration:none;">Privacy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
