import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const EMAIL_LOG_DIR = path.join(ROOT_DIR, 'scratch', 'temp-emails');

let transporter = null;

const hasSmtpConfig = 
  !!process.env.EMAIL_HOST &&
  !!process.env.EMAIL_USER &&
  !!process.env.EMAIL_PASS;

if (hasSmtpConfig) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log('Nodemailer SMTP transporter initialized.');
  } catch (error) {
    console.error('Failed to initialize SMTP transporter, falling back to local simulation mode:', error);
  }
} else {
  console.log('SMTP config missing in .env. Node mail will run in local simulation mode (logging links to scratch/temp-emails).');
}

export async function sendMail({ to, subject, html }) {
  const from = process.env.EMAIL_FROM || '"Reverse SOS" <noreply@example.com>';

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      console.log(`[Email] Sent email successfully to ${to}. Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`[Email] Failed sending SMTP email to ${to}:`, error);
      // Fallback to local simulator on failure
    }
  }

  // Local Simulation / Sandbox Fallback
  console.log('\n=================== MOCK EMAIL SENT ===================');
  console.log(`TO:      ${to}`);
  console.log(`FROM:    ${from}`);
  console.log(`SUBJECT: ${subject}`);
  console.log('CONTENT:');
  console.log(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
  console.log('=======================================================');

  // Save the email content to a file in scratch/temp-emails so automated tests or developers can pick it up
  try {
    if (!fs.existsSync(EMAIL_LOG_DIR)) {
      fs.mkdirSync(EMAIL_LOG_DIR, { recursive: true });
    }

    // Clean up older email files to avoid flooding scratch directory
    const files = fs.readdirSync(EMAIL_LOG_DIR);
    if (files.length > 50) {
      files.forEach(file => {
        try {
          fs.unlinkSync(path.join(EMAIL_LOG_DIR, file));
        } catch (_) {}
      });
    }

    const emailFileName = `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.html`;
    const emailFilePath = path.join(EMAIL_LOG_DIR, emailFileName);
    fs.writeFileSync(emailFilePath, html, 'utf8');
    console.log(`[Email Simulator] Mock email payload stored at: ${emailFilePath}`);
  } catch (err) {
    console.error('Failed to log simulated email to disk:', err);
  }

  return { messageId: 'simulated_message_id_' + Math.random().toString(36).substring(2, 9) };
}
