import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart3, Sparkles, Database, Shield, ArrowRight,
  Mail, Lock, User, Eye, EyeOff, Sun, Moon, AlertCircle,
} from 'lucide-react';

// ── Google Icon SVG ───────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.5 18.9 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/>
    </svg>
  );
}

// ── Animated Feature List ─────────────────────────────────────
const FEATURES = [
  { icon: <Database size={17} />, text: 'Connect MySQL & Excel data sources' },
  { icon: <Sparkles size={17} />, text: 'AI-powered EDA & intelligent cleaning' },
  { icon: <BarChart3 size={17} />, text: 'Auto-generate Power BI-style dashboards' },
  { icon: <Shield size={17} />, text: 'Export to PDF, CSV & PPT formats' },
];

// ── Password Input with Toggle ────────────────────────────────
function PasswordInput({ value, onChange, placeholder, id }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className="input-field"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ paddingRight: '44px' }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', padding: '4px',
        }}
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

// ── Error Banner ──────────────────────────────────────────────
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '11px 14px', background: 'var(--danger-bg)',
      border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px',
      marginBottom: '20px', color: 'var(--danger)', fontSize: '0.83rem', fontWeight: '500',
    }}>
      <AlertCircle size={16} style={{ flexShrink: 0 }} />
      {message}
    </div>
  );
}

// ── Main Login Page ───────────────────────────────────────────
export default function LoginPage() {
  const { loginWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset, authError } = useAuth();
  const { isDark, toggle } = useTheme();

  // tab: 'signin' | 'signup' | 'reset'
  const [tab, setTab] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (authError) {
      setError(friendlyError({ message: authError }));
    }
  }, [authError]);

  const clearForm = () => {
    setEmail(''); setPassword(''); setDisplayName(''); setConfirmPassword('');
    setError(''); setSuccessMsg('');
  };

  const switchTab = (t) => { setTab(t); clearForm(); };

  // ── Google ────────────────────────────────────────────────
  const handleGoogle = async () => {
    setLoading(true); setError('');
    try { await loginWithGoogle(); }
    catch (err) { setError(friendlyError(err)); }
    setLoading(false);
  };

  // ── Sign In ───────────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try { await signInWithEmail(email, password); }
    catch (err) { setError(friendlyError(err)); }
    setLoading(false);
  };

  // ── Sign Up ───────────────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Please enter your full name.'); return; }
    if (!email) { setError('Please enter an email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try { await signUpWithEmail(email, password, displayName.trim()); }
    catch (err) { setError(friendlyError(err)); }
    setLoading(false);
  };

  // ── Password Reset ────────────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) { setError('Enter your email address.'); return; }
    setLoading(true); setError('');
    try {
      await sendPasswordReset(email);
      setSuccessMsg('Reset link sent! Check your inbox.');
    } catch (err) { setError(friendlyError(err)); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {/* Theme Toggle — top right */}
      <button
        onClick={toggle}
        style={{
          position: 'fixed', top: '20px', right: '20px',
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: '10px', padding: '9px 12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
          color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '500',
          transition: 'all 0.2s ease',
        }}
        id="theme-toggle-btn"
      >
        {isDark ? <Sun size={15} /> : <Moon size={15} />}
        {isDark ? 'Light' : 'Dark'}
      </button>

      <div style={{ maxWidth: '1080px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>

        {/* ── Left — Branding ───────────────────────────────── */}
        <div className="fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <div style={{ width: '46px', height: '46px', background: 'var(--accent-gradient)', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={25} color="white" />
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.4px' }}>
              <span className="gradient-text">DataViz</span> Pro
            </span>
          </div>

          <h1 style={{ fontSize: '2.8rem', fontWeight: '900', lineHeight: '1.1', marginBottom: '16px', letterSpacing: '-1.5px' }}>
            Transform Data into<br />
            <span className="gradient-text">Stunning Dashboards</span>
          </h1>

          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.65', marginBottom: '36px', maxWidth: '420px' }}>
            Connect your database, let AI clean and analyze your data, and generate beautiful dashboards in minutes.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="fade-in-up" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', animationDelay: `${0.15 + i * 0.08}s` }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'var(--accent-gradient-soft)', border: '1px solid var(--glass-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-secondary)', flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: '0.9rem' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right — Auth Card ─────────────────────────────── */}
        <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="glass-card" style={{ padding: '44px 40px' }}>
            {/* Logo icon */}
            <div className="float-anim" style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{
                width: '64px', height: '64px', margin: '0 auto',
                background: 'var(--accent-gradient)', borderRadius: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 36px rgba(124,58,237,0.35)',
              }}>
                <Sparkles size={30} color="white" />
              </div>
            </div>

            {/* Tab switcher */}
            {tab !== 'reset' && (
              <div style={{
                display: 'flex', gap: '4px', background: 'var(--bg-secondary)',
                padding: '4px', borderRadius: '10px', marginBottom: '28px',
              }}>
                {[['signin', 'Sign In'], ['signup', 'Sign Up']].map(([t, label]) => (
                  <button
                    key={t}
                    onClick={() => switchTab(t)}
                    style={{
                      flex: 1, padding: '9px', border: 'none', cursor: 'pointer',
                      borderRadius: '8px', fontWeight: '600', fontSize: '0.875rem',
                      fontFamily: 'Inter, sans-serif', transition: 'all 0.2s ease',
                      background: tab === t ? 'var(--bg-card)' : 'transparent',
                      color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                      boxShadow: tab === t ? 'var(--shadow-card)' : 'none',
                    }}
                    id={`tab-${t}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <ErrorBanner message={error} />

            {/* ── SUCCESS MESSAGE ── */}
            {successMsg && (
              <div style={{
                padding: '11px 14px', background: 'var(--success-bg)',
                border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px',
                marginBottom: '20px', color: 'var(--success)', fontSize: '0.83rem', fontWeight: '500',
              }}>
                {successMsg}
              </div>
            )}

            {/* ── SIGN IN FORM ── */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="input-label"><Mail size={11} style={{ display: 'inline', marginRight: '4px' }} /> Email</label>
                  <input id="signin-email" type="email" className="input-field" placeholder="you@company.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="input-label"><Lock size={11} style={{ display: 'inline', marginRight: '4px' }} /> Password</label>
                  <PasswordInput id="signin-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <button
                  type="button"
                  onClick={() => switchTab('reset')}
                  style={{ alignSelf: 'flex-end', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-secondary)', fontSize: '0.8rem', fontWeight: '500' }}
                >
                  Forgot password?
                </button>
                <button type="submit" className="btn-primary" disabled={loading} id="signin-btn"
                  style={{ width: '100%', padding: '13px', fontSize: '0.95rem', marginTop: '4px' }}>
                  {loading ? <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Signing in…</> : <>Sign In <ArrowRight size={16} /></>}
                </button>
              </form>
            )}

            {/* ── SIGN UP FORM ── */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="input-label"><User size={11} style={{ display: 'inline', marginRight: '4px' }} /> Full Name</label>
                  <input id="signup-name" type="text" className="input-field" placeholder="Jane Smith"
                    value={displayName} onChange={e => setDisplayName(e.target.value)} />
                </div>
                <div>
                  <label className="input-label"><Mail size={11} style={{ display: 'inline', marginRight: '4px' }} /> Email</label>
                  <input id="signup-email" type="email" className="input-field" placeholder="you@company.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="input-label"><Lock size={11} style={{ display: 'inline', marginRight: '4px' }} /> Password</label>
                  <PasswordInput id="signup-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" />
                </div>
                <div>
                  <label className="input-label"><Lock size={11} style={{ display: 'inline', marginRight: '4px' }} /> Confirm Password</label>
                  <PasswordInput id="signup-confirm" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" />
                </div>
                <button type="submit" className="btn-primary" disabled={loading} id="signup-btn"
                  style={{ width: '100%', padding: '13px', fontSize: '0.95rem', marginTop: '4px' }}>
                  {loading ? <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Creating account…</> : <>Create Account <ArrowRight size={16} /></>}
                </button>
              </form>
            )}

            {/* ── PASSWORD RESET ── */}
            {tab === 'reset' && (
              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '6px' }}>Reset Password</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Enter your email and we'll send a reset link.</p>
                </div>
                <div>
                  <label className="input-label"><Mail size={11} style={{ display: 'inline', marginRight: '4px' }} /> Email</label>
                  <input id="reset-email" type="email" className="input-field" placeholder="you@company.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <button type="submit" className="btn-primary" disabled={loading} id="reset-btn"
                  style={{ width: '100%', padding: '13px', fontSize: '0.95rem' }}>
                  {loading ? <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Sending…</> : 'Send Reset Link'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => switchTab('signin')}
                  style={{ width: '100%', justifyContent: 'center' }}>
                  ← Back to Sign In
                </button>
              </form>
            )}

            {/* ── OAuth divider & Google button ── */}
            {tab !== 'reset' && (
              <>
                <div className="divider" style={{ margin: '24px 0' }}>or continue with</div>
                <button onClick={handleGoogle} className="btn-google" disabled={loading} id="google-login-btn">
                  <GoogleIcon />
                  Continue with Google
                </button>
              </>
            )}

            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '20px' }}>
              Secure authentication powered by Firebase
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Firebase error → human message ───────────────────────────
function friendlyError(err) {
  const code = err?.code || '';
  const map = {
    'auth/user-not-found':       'No account found with this email.',
    'auth/wrong-password':       'Incorrect password. Try again.',
    'auth/invalid-credential':   'Invalid email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password':        'Password is too weak (min. 6 characters).',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/too-many-requests':    'Too many attempts. Please wait and try again.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
  };
  return map[code] || err?.message || 'Something went wrong. Please try again.';
}
