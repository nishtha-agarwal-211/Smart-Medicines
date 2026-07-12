/**
 * AuthPage — Premium Login / Sign-Up Page
 * ─────────────────────────────────────────
 * Glassmorphic auth card with gradient mesh background,
 * floating pill decorations, and smooth transitions.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight,
  Loader2, CheckCircle, AlertCircle, Pill, Heart,
  Shield, Activity
} from 'lucide-react';

export default function AuthPage() {
  const { login, register, loginWithGoogle, resetPassword, error, clearError, isFirebaseConfigured } = useAuth();

  const [mode, setMode] = useState('login');       // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  // Clear errors when switching modes
  useEffect(() => {
    setLocalError('');
    clearError();
    setResetSent(false);
  }, [mode]);

  // Trigger error shake animation
  useEffect(() => {
    if (error || localError) {
      setShakeError(true);
      const t = setTimeout(() => setShakeError(false), 600);
      return () => clearTimeout(t);
    }
  }, [error, localError]);

  const displayError = localError || error;

  // ── Validation ─────────────────────────────────────
  function validate() {
    if (!email.trim()) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';

    if (mode === 'forgot') return '';

    if (!password) return 'Please enter your password.';
    if (password.length < 6) return 'Password must be at least 6 characters.';

    if (mode === 'signup') {
      if (!displayName.trim()) return 'Please enter your full name.';
      if (confirmPassword !== password) return 'Passwords do not match.';
    }

    return '';
  }

  // ── Submit ─────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError('');
    clearError();

    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'forgot') {
        await resetPassword(email);
        setResetSent(true);
      } else if (mode === 'login') {
        await login(email, password);
        setSuccess(true);
      } else {
        await register(email, password, displayName.trim());
        setSuccess(true);
      }
    } catch {
      // Error is set by AuthContext
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setLocalError('');
    clearError();
    setSubmitting(true);
    try {
      const result = await loginWithGoogle();
      if (result) setSuccess(true);
    } catch {
      // Error is set by AuthContext
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success overlay ────────────────────────────────
  if (success) {
    return (
      <div className="auth-page">
        <AuthBackground />
        <div className="auth-success-overlay">
          <div className="auth-success-icon">
            <CheckCircle size={64} />
          </div>
          <h2>Welcome!</h2>
          <p>Setting up your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <AuthBackground />

      <div className="auth-container">
        {/* Logo Section */}
        <div className="auth-logo">
          <div className="auth-logo-icon">💊</div>
          <h1 className="auth-logo-title">Smart Medicine</h1>
          <p className="auth-logo-subtitle">AI-Powered Medication Companion</p>
        </div>

        {/* Auth Card */}
        <div className={`auth-card ${shakeError ? 'auth-shake' : ''}`}>
          {/* Mode Toggle */}
          {mode !== 'forgot' && (
            <div className="auth-toggle">
              <button
                className={`auth-toggle-btn ${mode === 'login' ? 'active' : ''}`}
                onClick={() => setMode('login')}
                type="button"
              >
                Sign In
              </button>
              <button
                className={`auth-toggle-btn ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => setMode('signup')}
                type="button"
              >
                Create Account
              </button>
              <div
                className="auth-toggle-indicator"
                style={{ transform: mode === 'signup' ? 'translateX(100%)' : 'translateX(0)' }}
              />
            </div>
          )}

          {mode === 'forgot' && (
            <div className="auth-forgot-header">
              <button className="auth-back-btn" onClick={() => setMode('login')} type="button">
                ← Back to Sign In
              </button>
              <h2>Reset Password</h2>
              <p>Enter your email and we'll send you a reset link.</p>
            </div>
          )}

          {/* Error Message */}
          {displayError && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{displayError}</span>
            </div>
          )}

          {/* Reset Success */}
          {resetSent && (
            <div className="auth-success-msg">
              <CheckCircle size={16} />
              <span>Password reset email sent! Check your inbox.</span>
            </div>
          )}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {mode === 'signup' && (
              <div className="auth-field">
                <label htmlFor="auth-name">Full Name</label>
                <div className="auth-input-wrap">
                  <User size={18} className="auth-input-icon" />
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="e.g., Nishtha Agarwal"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                    disabled={submitting}
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">Email Address</label>
              <div className="auth-input-wrap">
                <Mail size={18} className="auth-input-icon" />
                <input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={submitting}
                  autoFocus
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="auth-field">
                <label htmlFor="auth-password">Password</label>
                <div className="auth-input-wrap">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="auth-field">
                <label htmlFor="auth-confirm">Confirm Password</label>
                <div className="auth-input-wrap">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="auth-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="auth-forgot-link">
                <button
                  type="button"
                  className="auth-text-btn"
                  onClick={() => setMode('forgot')}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 size={20} className="auth-spinner" />
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider + Google */}
          {mode !== 'forgot' && isFirebaseConfigured && (
            <>
              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              <button
                className="auth-google-btn"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                type="button"
              >
                <svg className="auth-google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="auth-footer">
          Protected by industry-standard encryption.
          <br />
          Your health data is private and secure.
        </p>
      </div>
    </div>
  );
}

// ── Animated Background ──────────────────────────────
function AuthBackground() {
  return (
    <div className="auth-bg" aria-hidden="true">
      <div className="auth-bg-gradient" />
      <div className="auth-bg-orbs">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>
      <div className="auth-bg-pills">
        <div className="auth-pill auth-pill-1"><Pill size={28} /></div>
        <div className="auth-pill auth-pill-2"><Heart size={24} /></div>
        <div className="auth-pill auth-pill-3"><Shield size={26} /></div>
        <div className="auth-pill auth-pill-4"><Activity size={22} /></div>
        <div className="auth-pill auth-pill-5"><Pill size={20} /></div>
        <div className="auth-pill auth-pill-6"><Heart size={18} /></div>
      </div>
    </div>
  );
}
