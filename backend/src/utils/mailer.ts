import nodemailer from "nodemailer";
import { config } from "../config";

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
});

export function welcomeEmailHtml(username: string, password: string): string {
  // Gruvbox (hard, dark variant) styled transactional email.
  const bg = "#1d2021";
  const bg1 = "#3c3836";
  const bg2 = "#504945";
  const fg = "#ebdbb2";
  const fg2 = "#d5c4a1";
  const yellow = "#fabd2f";
  const green = "#b8bb26";
  const aqua = "#8ec07c";

  return `
  <div style="background:${bg};padding:40px 16px;font-family:'JetBrains Mono',monospace;">
    <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:${bg1};border:3px solid ${yellow};">
      <tr>
        <td style="padding:24px 28px;border-bottom:3px solid ${yellow};">
          <div style="font-family:Arial,sans-serif;font-weight:900;letter-spacing:1px;font-size:22px;color:${yellow};text-transform:uppercase;">
            Expense Splitter
          </div>
          <div style="color:${fg2};font-size:12px;margin-top:4px;">Account created</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <p style="color:${fg};font-size:15px;line-height:1.6;margin:0 0 18px;">
            Welcome aboard. Your Expense Splitter account is ready — here are your sign-in details.
          </p>
          <table role="presentation" width="100%" style="background:${bg};border:2px solid ${bg2};margin-bottom:20px;">
            <tr>
              <td style="padding:14px 18px;border-bottom:1px solid ${bg2};color:${fg2};font-size:12px;text-transform:uppercase;">Username</td>
            </tr>
            <tr>
              <td style="padding:0 18px 14px;color:${green};font-size:16px;font-weight:700;">${escapeHtml(username)}</td>
            </tr>
            <tr>
              <td style="padding:14px 18px;border-top:1px solid ${bg2};color:${fg2};font-size:12px;text-transform:uppercase;">Password</td>
            </tr>
            <tr>
              <td style="padding:0 18px 14px;color:${aqua};font-size:16px;font-weight:700;">${escapeHtml(password)}</td>
            </tr>
          </table>
          <p style="color:${fg2};font-size:12px;line-height:1.6;margin:0;">
            Happieee dayy!!.
            If you didn't create this account, you can ignore this email.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px;border-top:3px solid ${bg2};color:${bg2};font-size:11px;">
          Split fair. Settle fast. — Expense Splitter
        </td>
      </tr>
    </table>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

export async function sendWelcomeEmail(to: string, username: string, password: string) {
  if (!config.smtp.host || !config.smtp.user) {
    console.warn("[mailer] SMTP not configured — skipping welcome email for", to);
    return;
  }
  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject: "Your Expense Splitter account",
      html: welcomeEmailHtml(username, password),
    });
  } catch (err) {
    console.error("[mailer] Failed to send welcome email:", err);
  }
}
