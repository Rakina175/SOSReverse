process.env.NODE_ENV = 'test';
process.env.PORT = '5050'; // Use distinct port for testing
process.env.JWT_SECRET = 'super_secret_test_key_minimum_length_32_characters';

import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const EMAIL_LOG_DIR = path.join(ROOT_DIR, 'scratch', 'temp-emails');

// Clear temp emails directory before tests
if (fs.existsSync(EMAIL_LOG_DIR)) {
  fs.readdirSync(EMAIL_LOG_DIR).forEach(file => {
    try {
      fs.unlinkSync(path.join(EMAIL_LOG_DIR, file));
    } catch (_) {}
  });
}

// Import server & database
const { server } = await import('../server/index.js');
const { db } = await import('../server/db.js');
const BASE_URL = 'http://localhost:5050/api';

// Helper to pull token from logged emails
function extractTokenFromEmails(routePattern) {
  if (!fs.existsSync(EMAIL_LOG_DIR)) return null;
  const files = fs.readdirSync(EMAIL_LOG_DIR)
    .map(name => ({ name, time: fs.statSync(path.join(EMAIL_LOG_DIR, name)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) return null;
  const newestFile = path.join(EMAIL_LOG_DIR, files[0].name);
  const content = fs.readFileSync(newestFile, 'utf8');
  
  // Delete the parsed email file
  try {
    fs.unlinkSync(newestFile);
  } catch (_) {}

  const regex = new RegExp(`${routePattern}\\?token=([a-f0-9]+)`);
  const match = content.match(regex);
  return match ? match[1] : null;
}

function generateUniquePhone() {
  return '9' + String(Math.floor(100000000 + Math.random() * 900000000));
}

test('Security & Authentication Suite', async (t) => {

  await t.test('1. Strong Registration Validation checks', async () => {
    // A. Reject missing fields
    const resEmpty = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    });
    assert.strictEqual(resEmpty.status, 400);

    // B. Reject weak passwords
    const resWeak = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'strong@example.com',
        fullName: 'Strong Candidate',
        phoneNumber: '9876543201',
        role: 'citizen',
        password: 'weak'
      })
    });
    assert.strictEqual(resWeak.status, 400);

    // C. Reject obvious passwords
    const resObvious = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'obvious@example.com',
        fullName: 'Obvious Candidate',
        phoneNumber: '9876543202',
        role: 'citizen',
        password: 'password123!A'
      })
    });
    assert.strictEqual(resObvious.status, 400);

    // D. Validate invalid email formats (Test Cases 3 & 4)
    const badEmails = ['rahi', 'rahi@', '@gmail.com', 'rahi@gmail', 'rahi gmail.com', 'rahi@@gmail.com'];
    for (const em of badEmails) {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: em,
          fullName: 'Bad Email User',
          phoneNumber: '9876543203',
          role: 'citizen',
          password: 'SecurePassword123!'
        })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Please enter a valid email address.');
    }

    // E. Validate invalid Indian phone format (Test Case 1)
    const badPhones = ['456535656', '12345', 'abcdefghij', '123456789012345', '0000000000'];
    for (const ph of badPhones) {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'valid_phone_check@example.com',
          fullName: 'Bad Phone User',
          phoneNumber: ph,
          role: 'citizen',
          password: 'SecurePassword123!'
        })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Please enter a valid mobile number.');
    }
  });

  await t.test('2. Unverified registration cannot obtain authenticated access (Regression)', async () => {
    const userEmail = `unverified_reg_${Date.now()}@test.com`;
    const password = 'SecurePassword123!';

    // A. Register user profile
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        fullName: 'Test Unverified User',
        phoneNumber: generateUniquePhone(),
        role: 'citizen',
        password
      })
    });
    assert.strictEqual(regRes.status, 201);
    const regData = await regRes.json();
    assert.strictEqual(regData.success, true);
    assert.strictEqual(regData.requiresEmailVerification, true);
    assert.strictEqual(regData.isEmailVerified, false);
    assert.strictEqual(regData.accessToken, undefined);

    // Verify raw verification token not stored in database
    const dbUser = await db.users.find({ email: userEmail.toLowerCase() });
    assert.ok(dbUser);
    assert.strictEqual(dbUser.isEmailVerified, false);
    assert.ok(dbUser.emailVerificationTokenHash);
    assert.strictEqual(dbUser.emailVerificationToken, undefined);

    const verifyToken = extractTokenFromEmails('verify-email');
    assert.ok(verifyToken);
    assert.notStrictEqual(dbUser.emailVerificationTokenHash, verifyToken);

    // B. Call protected endpoint without token (should be rejected 401)
    const protectedRes = await fetch(`${BASE_URL}/contacts`, {
      method: 'GET'
    });
    assert.strictEqual(protectedRes.status, 401);

    // C. Try to login before email verification -> expects 403 EMAIL_NOT_VERIFIED
    const loginFailRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password })
    });
    assert.strictEqual(loginFailRes.status, 403);
    const loginFailData = await loginFailRes.json();
    assert.strictEqual(loginFailData.success, false);
    assert.strictEqual(loginFailData.code, 'EMAIL_NOT_VERIFIED');

    // D. Verify email with legitimate link
    const verifyRes = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verifyToken })
    });
    assert.strictEqual(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyData.success, true);

    // E. Login after email verification -> success
    const loginSuccessRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password })
    });
    assert.strictEqual(loginSuccessRes.status, 200);
    const loginSuccessData = await loginSuccessRes.json();
    assert.ok(loginSuccessData.accessToken);

    // F. Call protected endpoint with access token -> success 200
    const protectedSuccessRes = await fetch(`${BASE_URL}/contacts`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${loginSuccessData.accessToken}` }
    });
    assert.strictEqual(protectedSuccessRes.status, 200);
  });

  await t.test('3. Verification token expiration and reuse logic', async () => {
    const userEmail = `expiry_test_${Date.now()}@test.com`;
    const password = 'SecurePassword123!';

    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        fullName: 'Expiry User',
        phoneNumber: generateUniquePhone(),
        role: 'citizen',
        password
      })
    });

    const verifyToken = extractTokenFromEmails('verify-email');
    assert.ok(verifyToken);

    const dbUser = await db.users.find({ email: userEmail.toLowerCase() });
    assert.ok(dbUser);

    // Mock token expiration by updating database time to the past
    await db.users.update(dbUser.uid, {
      emailVerificationExpires: new Date(Date.now() - 1000).toISOString()
    });

    // A. Expired verification link should be rejected
    const verifyExpiredRes = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verifyToken })
    });
    assert.strictEqual(verifyExpiredRes.status, 400);
    const verifyExpiredData = await verifyExpiredRes.json();
    assert.strictEqual(verifyExpiredData.success, false);
    assert.strictEqual(verifyExpiredData.message, 'Verification link is invalid or has expired.');

    // Restore valid time to verify success path
    await db.users.update(dbUser.uid, {
      emailVerificationExpires: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });

    // B. Invalid token is rejected
    const verifyInvalidRes = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'completely_fake_verification_token' })
    });
    assert.strictEqual(verifyInvalidRes.status, 400);
    const verifyInvalidData = await verifyInvalidRes.json();
    assert.strictEqual(verifyInvalidData.success, false);

    // C. Valid verification succeeds
    const verifyRes = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verifyToken })
    });
    assert.strictEqual(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyData.success, true);
    assert.strictEqual(verifyData.message, 'Email verified successfully. You can now sign in.');

    // Verify database cleanups (clear hash and expiration)
    const updatedUser = await db.users.find({ email: userEmail.toLowerCase() });
    assert.strictEqual(updatedUser.isEmailVerified, true);
    assert.strictEqual(updatedUser.emailVerificationTokenHash, null);
    assert.strictEqual(updatedUser.emailVerificationExpires, null);

    // D. Consumed token cannot be reused (Single Use Check)
    const verifyReuseRes = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verifyToken })
    });
    assert.strictEqual(verifyReuseRes.status, 400);
    const verifyReuseData = await verifyReuseRes.json();
    assert.strictEqual(verifyReuseData.success, false);
  });

  await t.test('4. Resend verification logic and token rotation', async () => {
    const userEmail = `resend_test_${Date.now()}@test.com`;
    const password = 'SecurePassword123!';

    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        fullName: 'Resend User',
        phoneNumber: generateUniquePhone(),
        role: 'citizen',
        password
      })
    });

    const token1 = extractTokenFromEmails('verify-email');
    assert.ok(token1);

    // Trigger resend
    const resendRes = await fetch(`${BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail })
    });
    assert.strictEqual(resendRes.status, 200);
    const resendData = await resendRes.json();
    assert.strictEqual(resendData.success, true);
    assert.strictEqual(resendData.message, 'If this email is registered, a new verification link has been sent.');

    const token2 = extractTokenFromEmails('verify-email');
    assert.ok(token2);
    assert.notStrictEqual(token1, token2);

    // A. Old token (token1) must be invalid after resend
    const verifyOldRes = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token1 })
    });
    assert.strictEqual(verifyOldRes.status, 400);

    // B. New token (token2) is valid and succeeds
    const verifyNewRes = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token2 })
    });
    assert.strictEqual(verifyNewRes.status, 200);

    // C. Verified account can now login successfully
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password })
    });
    assert.strictEqual(loginRes.status, 200);
  });

  await t.test('5. Forgot Password flow remains functional', async () => {
    const userEmail = `forgot_test_${Date.now()}@test.com`;
    const password = 'SecurePassword123!';
    const newPassword = 'NewStrongPassword321!';

    // Register & Verify
    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        fullName: 'Forgot Flow User',
        phoneNumber: generateUniquePhone(),
        role: 'citizen',
        password
      })
    });
    const verifyToken = extractTokenFromEmails('verify-email');
    await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verifyToken })
    });

    // Request forgot password
    const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail })
    });
    assert.strictEqual(forgotRes.status, 200);

    const resetToken = extractTokenFromEmails('reset-password');
    assert.ok(resetToken);

    // Reset password
    const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, newPassword })
    });
    assert.strictEqual(resetRes.status, 200);

    // Verify initial password login fails
    const badLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password })
    });
    assert.strictEqual(badLogin.status, 401);

    // Verify login with new password works
    const goodLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: newPassword })
    });
    assert.strictEqual(goodLogin.status, 200);
  });

  await t.test('6. Pre-seeded E2E Mock Accounts authentication check', async () => {
    const accounts = [
      { email: 'mock_citizen@sos.com', role: 'citizen' },
      { email: 'mock_volunteer@sos.com', role: 'volunteer' },
      { email: 'mock_admin@sos.com', role: 'admin' }
    ];

    for (const acc of accounts) {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: 'password123' })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.user.role, acc.role);
    }
  });

  // Close the server cleanly at the end
  server.close();
});
