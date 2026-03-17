'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    // REAL: trigger Supabase Google OAuth
    // REAL: const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { scopes: 'https://www.googleapis.com/auth/calendar.readonly' } })
    // REAL: on callback, check onboarding_complete → redirect to /onboarding or /chat

    // MOCK: go straight to onboarding
    setTimeout(() => router.push('/onboarding'), 800)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0f2e 50%, #0f1a2e 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Sora', 'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background lights */}
      <div style={{
        position: 'fixed',
        top: '10%',
        left: '-200px',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(96, 165, 250, 0.15), transparent)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed',
        bottom: '10%',
        right: '-200px',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(167, 139, 250, 0.15), transparent)',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none',
      }} />

      {/* ── Nav ── */}
      <nav style={{
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '16px 28px',
        background: 'rgba(15, 15, 25, 0.4)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Woman profile SVG logo */}
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Face profile */}
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            {/* Head circle */}
            <circle cx="18" cy="14" r="8" fill="url(#logoGrad)" />
            {/* Hair curve */}
            <path d="M 10 14 Q 10 8 18 7 Q 26 8 26 14" fill="url(#logoGrad)" />
            {/* Neck */}
            <rect x="16" y="22" width="4" height="6" fill="url(#logoGrad)" />
            {/* Shoulder */}
            <path d="M 12 28 Q 18 30 24 28" fill="url(#logoGrad)" opacity="0.8" />
          </svg>
          <span style={{ 
            color: '#e2e2f0', 
            fontWeight: 700, 
            fontSize: 18, 
            letterSpacing: 1.5,
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            EVA AI
          </span>
        </div>
        <button
          onClick={handleGoogleLogin}
          className="btn-nav-login"
          style={{
            padding: '8px 22px', 
            borderRadius: 8,
            background: 'rgba(96, 165, 250, 0.15)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            color: '#e2e2f0', 
            fontWeight: 600,
            fontSize: 14, 
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(8px)',
          }}>
          Login
        </button>
      </nav>

      {/* ── Hero ── */}
      <div style={{
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 32, 
        padding: '40px 20px',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Glowing avatar */}
        <div style={{ position: 'relative' }}>
          {/* Outer glow */}
          <div style={{
            position: 'absolute', 
            inset: -32,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(96, 165, 250, 0.25), transparent)',
            animation: 'pulse 4s ease-in-out infinite',
            filter: 'blur(20px)',
          }}/>
          
          {/* Glass card container */}
          <div style={{
            width: 130, 
            height: 130, 
            borderRadius: '50%',
            background: 'rgba(30, 58, 138, 0.2)',
            backdropFilter: 'blur(24px)',
            border: '1.5px solid rgba(96, 165, 250, 0.3)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            boxShadow: `
              0 0 40px rgba(96, 165, 250, 0.1),
              inset 0 1px 2px rgba(255, 255, 255, 0.1),
              inset 0 -1px 2px rgba(0, 0, 0, 0.3)
            `,
          }}>
            {/* Woman profile with gradient */}
            <svg width="80" height="80" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
              filter: 'drop-shadow(0 4px 12px rgba(96, 165, 250, 0.2))',
            }}>
              <defs>
                <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#60a5fa', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              {/* Face outline */}
              <circle cx="20" cy="12" r="7" fill="none" stroke="url(#heroGrad)" strokeWidth="1.5" />
              {/* Hair */}
              <path d="M 13 12 Q 13 6 20 5 Q 27 6 27 12" fill="url(#heroGrad)" opacity="0.9" />
              {/* Face fill */}
              <circle cx="20" cy="12" r="6.5" fill="url(#heroGrad)" opacity="0.7" />
              {/* Shoulders */}
              <path d="M 10 30 Q 20 32 30 30 L 28 24 Q 20 26 12 24 Z" fill="url(#heroGrad)" opacity="0.6" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 56, fontWeight: 800, letterSpacing: 8,
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #c084fc)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            margin: 0,
          }}>EVA AI</h1>
          <p style={{ color: '#9494b8', fontSize: 18, marginTop: 12, fontWeight: 300 }}>
            Your Everyday Virtual Assistant
          </p>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', width: '100%', maxWidth: 380 }}>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn-cta-primary"
            style={{
              width: '100%', padding: '14px 24px',
              borderRadius: 12,
              background: loading ? 'rgba(96,165,250,0.1)' : 'linear-gradient(135deg, #60a5fa, #a78bfa)',
              border: loading ? '1px solid rgba(96,165,250,0.3)' : 'none',
              color: '#fff', fontWeight: 600, fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              transition: 'all 0.3s ease',
            }}>
            {/* Google "G" logo */}
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {/* Outlook option */}
          <button
            onClick={() => {
              // REAL: supabase.auth.signInWithOAuth({ provider: 'azure' })
              console.log('[MOCK] Outlook OAuth — not implemented yet')
            }}
            className="btn-cta-secondary"
            style={{
              width: '100%', padding: '14px 24px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#9494b8', fontWeight: 500, fontSize: 15,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              transition: 'all 0.3s ease',
            }}>
            <span style={{ fontSize: 20 }}>📧</span>
            Continue with Outlook
          </button>
        </div>

        <p style={{ color: '#4a4a6a', fontSize: 13, marginTop: -8 }}>
          By continuing you agree to our Privacy Policy
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }

        .btn-nav-login:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(96, 165, 250, 0.3);
        }

        .btn-nav-login:active {
          transform: translateY(0);
        }

        .btn-cta-primary:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(96, 165, 250, 0.4);
          background: linear-gradient(135deg, #7bb3ff, #b99dff);
        }

        .btn-cta-primary:active:not(:disabled) {
          transform: translateY(-1px);
        }

        .btn-cta-secondary:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
          color: #c5c5d9;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255,255,255,0.05);
        }

        .btn-cta-secondary:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  )
}
