import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { db, supabase } from '../db.js';
import { sendMail } from '../services/mail.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateAndNormalizeEmail, validateAndNormalizePhone } from '../utils/validation.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_random_local_secret_for_reverse_sos_app';

// Helpers
function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function validatePasswordStrength(password) {
  if (!password || password.length < 12) return false;
  
  // Complexity checks: must have lower, upper, digit, and special char
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  if (!hasLower || !hasUpper || !hasDigit || !hasSpecial) return false;

  // Reject obvious common patterns
  const obvious = ['password', '123456789', 'admin', 'qwerty', 'welcome', 'letmein'];
  const lowerPass = password.toLowerCase();
  if (obvious.some(p => lowerPass.startsWith(p))) return false;

  return true;
}

// Routes
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, phoneNumber, role } = req.body;

    // 1. Validation
    if (!email || !password || !fullName || !phoneNumber || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const trimmedName = typeof fullName === 'string' ? fullName.trim() : '';
    if (!trimmedName || trimmedName.length < 2) {
      return res.status(400).json({ success: false, message: 'Please enter a valid full name.' });
    }

    const emailCheck = validateAndNormalizeEmail(email);
    if (!emailCheck.isValid) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    const emailNorm = emailCheck.normalized;

    const phoneCheck = validateAndNormalizePhone(phoneNumber);
    if (!phoneCheck.isValid) {
      return res.status(400).json({ success: false, message: 'Please enter a valid mobile number.' });
    }
    const phoneNorm = phoneCheck.normalized;

    if (!['citizen', 'volunteer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid user role.' });
    }

    if (!validatePasswordStrength(password)) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 12 characters long and contain uppercase, lowercase, digit, and a special character. Obvious patterns are not allowed.' 
      });
    }

    // 2. Prevent duplicate email
    const existingEmail = await db.users.find({ email: emailNorm });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    // Prevent duplicate phone number
    const existingPhone = await db.users.find({ phoneNumber: phoneNorm });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'Phone number is already registered' });
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Generate verification token
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationTokenHash = hashToken(rawVerificationToken);
    const emailVerificationExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

    // 5. Register user in Supabase Authentication first (if active)
    let authUid = null;
    if (supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: emailNorm,
          password: password,
          email_confirm: true, // auto confirm email since we verify separately
          user_metadata: {
            fullName: trimmedName,
            role: role
          }
        });

        if (authError) {
          console.error('[Supabase Auth] Failed to create user:', {
            message: authError.message,
            details: authError.details,
            hint: authError.hint,
            code: authError.code
          });
          return res.status(400).json({ success: false, message: `Authentication signup failed: ${authError.message}` });
        }

        authUid = authData.user.id;
        console.log(`[Supabase Auth] User registered in authentication successfully: ${emailNorm} (ID: ${authUid})`);
      } catch (err) {
        console.error('[Supabase Auth] Exception during user creation:', err.message || err);
        return res.status(500).json({ success: false, message: 'Authentication signup process failed.' });
      }
    } else {
      authUid = 'user_' + crypto.randomUUID();
    }

    // 6. Save user profile into database
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(trimmedName)}`;
    const lat = role === 'volunteer' ? 40.7128 + (Math.random() - 0.5) * 0.05 : 40.7128;
    const lon = role === 'volunteer' ? -74.0060 + (Math.random() - 0.5) * 0.05 : -74.0060;

    const newUser = {
      uid: authUid, // The REAL Supabase Auth UUID!
      fullName: trimmedName,
      email: emailNorm,
      phoneNumber: phoneNorm,
      role,
      profilePhoto: avatarUrl,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      passwordHash,
      isEmailVerified: true, // Auto-verified immediately
      emailVerificationTokenHash: null,
      emailVerificationExpires: null,
      passwordResetTokenHash: null,
      passwordResetExpires: null,
      refreshTokens: [],
      failedLoginAttempts: 0,
      lockUntil: null,
      gender: '',
      dob: '',
      bloodGroup: '',
      allergies: '',
      medicalConditions: '',
      medications: '',
      emergencyNotes: '',
      homeAddress: '',
      currentCity: 'New York City',
      latitude: lat,
      longitude: lon,
      rangeRadius: 3,
      isAvailable: true
    };

    try {
      await db.users.save(newUser);
      console.log(`[Database] Inserted profile into public.users: ${emailNorm} (UID: ${authUid})`);
    } catch (dbError) {
      console.error('[Database] Failed to insert profile into public.users:', {
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code || dbError.status
      });

      // Rollback Supabase Auth user if database profile insertion failed
      if (supabase && authUid) {
        try {
          await supabase.auth.admin.deleteUser(authUid);
          console.log(`[Supabase Auth] Rolled back user auth record ${authUid} due to database profile insertion failure.`);
        } catch (rollbackErr) {
          console.error('[Supabase Auth] Failed to rollback user:', rollbackErr.message);
        }
      }

      return res.status(500).json({ 
        success: false, 
        message: `Profile database persistence failed: ${dbError.message || 'Database error'}` 
      });
    }

    // 7. Auto-login: Generate JWT access & refresh tokens
    const accessToken = jwt.sign(
      { uid: newUser.uid, role: newUser.role, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { uid: newUser.uid },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token to user's active session list
    const activeTokens = newUser.refreshTokens || [];
    activeTokens.push(refreshToken);
    await db.users.update(newUser.uid, { refreshTokens: activeTokens });

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    console.log(`[Security] User registered and logged in successfully: ${emailNorm} (UID: ${authUid})`);

    const { passwordHash: _, emailVerificationTokenHash: __, emailVerificationExpires: ___, refreshTokens: ____, passwordResetTokenHash: _____, passwordResetExpires: ______, ...profile } = newUser;
    res.status(201).json({
      success: true,
      user: profile,
      accessToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Unable to create account. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    const loginInput = (identifier || email || '').trim();

    if (!loginInput || !password) {
      return res.status(400).json({ message: 'Email/phone and password are required' });
    }

    const emailCheck = validateAndNormalizeEmail(loginInput);
    const phoneCheck = validateAndNormalizePhone(loginInput);

    if (!emailCheck.isValid && !phoneCheck.isValid) {
      return res.status(400).json({ message: 'Please enter a valid email address or mobile number.' });
    }

    let user = null;

    // 1. First lookup the profile locally by email or phone
    if (emailCheck.isValid) {
      user = await db.users.find({ email: emailCheck.normalized });
    } else if (phoneCheck.isValid) {
      user = await db.users.find({ phoneNumber: phoneCheck.normalized });
    }

    if (!user) {
      return res.status(401).json({ message: 'User profile does not exist.' });
    }

    // 2. Identify if this is one of the seeded mock profiles (starts with mock_)
    const isMock = user.email && user.email.startsWith('mock_');

    if (supabase && !isMock) {
      // Create a temporary client to prevent session mutation on the global admin client instance.
      // This avoids stripping admin credentials and failing subsequent database/RLS updates.
      const tempClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });

      console.log(`[Supabase Auth] Verifying sign-in for real user: ${user.email}`);
      const { data: authData, error: authError } = await tempClient.auth.signInWithPassword({
        email: user.email,
        password: password
      });

      if (authError) {
        console.error('[Supabase Auth] Login failed:', {
          message: authError.message,
          details: authError.details,
          hint: authError.hint,
          code: authError.code
        });
        return res.status(401).json({ message: `Authentication failed: ${authError.message}` });
      }

      const authUid = authData.user.id;
      console.log(`[Supabase Auth] Login successful: ${user.email} (ID: ${authUid})`);

      // Sync user profile UID in public.users to match Supabase UUID if mismatched
      if (user.uid !== authUid) {
        console.log(`[Database] Repairing UID for ${user.email} from ${user.uid} to ${authUid}`);
        try {
          await db.users.update(user.uid, { uid: authUid });
          user = await db.users.find({ uid: authUid });
        } catch (updateErr) {
          console.error('[Database] Failed to sync UID:', updateErr.message);
        }
      }
    } else {
      // Mock user (mock_*) or local testing: verify locally with bcrypt.compare
      console.log(`[Local Auth] Verifying credentials locally for user: ${user.email}`);

      // Check brute-force lock
      if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
        if (isMock) {
          await db.users.update(user.uid, { failedLoginAttempts: 0, lockUntil: null });
        } else {
          const waitTime = Math.ceil((new Date(user.lockUntil) - new Date()) / 1000 / 60);
          return res.status(423).json({ message: `Account is temporarily locked. Try again in ${waitTime} minutes.` });
        }
      }

      // Compare passwords
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        const attempts = (user.failedLoginAttempts || 0) + 1;
        let updates = { failedLoginAttempts: attempts };

        if (attempts >= 5) {
          updates.lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          updates.failedLoginAttempts = 0;
          await db.users.update(user.uid, updates);
          return res.status(423).json({ message: 'Account is temporarily locked. Try again in 15 minutes.' });
        }

        await db.users.update(user.uid, updates);
        return res.status(401).json({ message: `Incorrect password. ${5 - attempts} attempts remaining.` });
      }
    }

    // Ensure email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before signing in.'
      });
    }

    // Successful login: Reset login failures & update lastActive
    await db.users.update(user.uid, { failedLoginAttempts: 0, lockUntil: null, lastActive: new Date().toISOString() });

    // Generate JWT access & refresh tokens
    const accessToken = jwt.sign(
      { uid: user.uid, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { uid: user.uid },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token to user's active session list
    const activeTokens = user.refreshTokens || [];
    activeTokens.push(refreshToken);
    await db.users.update(user.uid, { refreshTokens: activeTokens });

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    console.log(`[Security] Successful login for: ${user.email} (UID: ${user.uid})`);

    const { passwordHash: _, emailVerificationTokenHash: __, emailVerificationExpires: ___, refreshTokens: ____, passwordResetTokenHash: _____, passwordResetExpires: ______, ...profile } = user.toObject ? user.toObject() : user;
    res.json({ success: true, user: profile, accessToken });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token missing' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const user = await db.users.find({ uid: decoded.uid });
    if (!user || !user.isEmailVerified || !user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
      if (user) {
        await db.users.update(user.uid, { refreshTokens: [] });
      }
      res.clearCookie('refreshToken');
      return res.status(403).json({ message: 'Authentication required' });
    }

    // Rotate refresh token
    const newAccessToken = jwt.sign(
      { uid: user.uid, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { uid: user.uid },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Replace old refresh token with rotated refresh token
    const updatedTokens = user.refreshTokens.filter(t => t !== refreshToken);
    updatedTokens.push(newRefreshToken);
    await db.users.update(user.uid, { refreshTokens: updatedTokens });

    // Set cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, JWT_SECRET);
        const user = await db.users.find({ uid: decoded.uid });
        if (user) {
          const updatedTokens = (user.refreshTokens || []).filter(t => t !== refreshToken);
          await db.users.update(user.uid, { refreshTokens: updatedTokens });
        }
      } catch (_) {}
    }
    
    res.clearCookie('refreshToken');
    console.log('[Security] User logged out successfully.');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }

    const hashed = hashToken(token);
    const user = await db.users.find({ emailVerificationTokenHash: hashed });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Verification link is invalid or has expired.' });
    }

    if (new Date(user.emailVerificationExpires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification link is invalid or has expired.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Verification link is invalid or has expired.' });
    }

    // Verify user and clear/delete verification token to ensure SINGLE USE
    await db.users.update(user.uid, {
      isEmailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationExpires: null
    });

    console.log(`[Security] Email verified successfully for user: ${user.email}`);
    res.json({ success: true, message: 'Email verified successfully. You can now sign in.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const emailNorm = normalizeEmail(email);
    const user = await db.users.find({ email: emailNorm });

    // Generic response prevents email enumeration
    const genericResponse = 'If this email is registered, a new verification link has been sent.';

    if (!user) {
      return res.json({ success: true, message: genericResponse });
    }

    if (user.isEmailVerified) {
      // Return generic response to avoid email enumeration leak
      return res.json({ success: true, message: genericResponse });
    }

    // Generate new verification token
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationTokenHash = hashToken(rawVerificationToken);
    const emailVerificationExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

    await db.users.update(user.uid, {
      emailVerificationTokenHash,
      emailVerificationExpires
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyLink = `${frontendUrl}/verify-email?token=${rawVerificationToken}`;
    
    await sendMail({
      to: emailNorm,
      subject: 'Reverse SOS - Verify Your Email',
      html: `
        <h3>Welcome to Reverse SOS, ${user.fullName}!</h3>
        <p>Please verify your email address to activate your account.</p>
        <p><a href="${verifyLink}" style="padding: 10px 20px; background-color: #e11d48; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">VERIFY EMAIL</a></p>
        <p>If the link does not work, copy and paste this URL into your browser:</p>
        <p>${verifyLink}</p>
        <p>This verification link will expire in 30 minutes.</p>
      `
    });

    console.log(`[Security] Resent email verification link to: ${emailNorm}`);
    res.json({ success: true, message: genericResponse });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const emailNorm = normalizeEmail(email);
    const user = await db.users.find({ email: emailNorm });

    // Generic response prevents email enumeration
    const genericResponse = 'If an account exists for this email, a password reset link has been sent.';

    if (!user) {
      return res.json({ message: genericResponse });
    }

    // Generate reset token
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetTokenHash = hashToken(rawResetToken);
    const passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    await db.users.update(user.uid, {
      passwordResetTokenHash,
      passwordResetExpires
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${rawResetToken}`;

    await sendMail({
      to: emailNorm,
      subject: 'Reverse SOS - Reset Your Password',
      html: `
        <h3>Reset Your Password</h3>
        <p>A password reset was requested for your Reverse SOS account.</p>
        <p>Click the secure link below to create a new password:</p>
        <p><a href="${resetLink}" style="padding: 10px 20px; background-color: #e11d48; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link expires after 15 minutes.</p>
        <p>If you did not request this password reset, you can safely ignore this email.</p>
      `
    });

    console.log(`[Security] Password reset requested for user: ${emailNorm}`);
    res.json({ message: genericResponse });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({ 
        message: 'Password must be at least 12 characters long and contain uppercase, lowercase, digit, and a special character.' 
      });
    }

    const hashed = hashToken(token);
    const user = await db.users.find({ passwordResetTokenHash: hashed });

    if (!user) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    if (new Date(user.passwordResetExpires) < new Date()) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    // Invalidate reset token and hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.users.update(user.uid, {
      passwordHash: newPasswordHash,
      passwordResetTokenHash: null,
      passwordResetExpires: null,
      refreshTokens: [] // Revoke existing sessions/tokens
    });

    // Update password in Supabase Auth using service role
    if (supabase) {
      try {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find(u => u.email === user.email);
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, {
            password: newPassword,
            email_confirm: true
          });
          console.log(`[Supabase Auth] Password reset synced to Supabase Auth for: ${user.email}`);
        } else {
          // If they didn't exist in Supabase Auth, create them with new password
          await supabase.auth.admin.createUser({
            email: user.email,
            password: newPassword,
            email_confirm: true,
            user_metadata: {
              fullName: user.fullName,
              role: user.role
            }
          });
          console.log(`[Supabase Auth] Created missing auth user during password reset: ${user.email}`);
        }
      } catch (err) {
        console.error('[Supabase Auth] Failed to sync password reset:', err);
      }
    }

    console.log(`[Security] Successful password reset for user UID: ${user.uid}. Invalidated all sessions.`);
    res.json({ message: 'Password reset successful. Please log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.users.find({ uid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    const { passwordHash: _, emailVerificationTokenHash: __, emailVerificationExpires: ___, refreshTokens: ____, passwordResetTokenHash: _____, passwordResetExpires: ______, ...profile } = user.toObject ? user.toObject() : user;
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    // Only allow editing safe personal and profile fields
    const allowedKeys = [
      'fullName', 'phoneNumber', 'profilePhoto', 'gender', 'dob', 'bloodGroup',
      'allergies', 'medicalConditions', 'medications', 'emergencyNotes',
      'homeAddress', 'currentCity', 'latitude', 'longitude', 'rangeRadius', 'isAvailable'
    ];

    const updates = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    updates.lastActive = new Date().toISOString();
    const updated = await db.users.update(req.user.uid, updates);

    console.log(`[Security] Profile updated successfully for UID: ${req.user.uid}`);
    
    const { passwordHash: _, emailVerificationTokenHash: __, emailVerificationExpires: ___, refreshTokens: ____, passwordResetTokenHash: _____, passwordResetExpires: ______, ...profile } = updated.toObject ? updated.toObject() : updated;
    res.json(profile);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
