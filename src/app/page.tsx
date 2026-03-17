'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  // TODO: replace with NextAuth signIn('google') or signIn('azure-ad')
  const handleGoogleLogin = async () => {
    setLoading(true)
    // MOCK: skip auth, go straight to onboarding
    // In production: await signIn('google', { callbackUrl: '/onboarding' })
    setTimeout(() => router.push('/onboarding'), 800)
  }

  const handleOutlookLogin = async () => {
    setLoading(true)
    // TODO: await signIn('azure-ad', { callbackUrl: '/onboarding' })
    setTimeout(() => router.push('/onboarding'), 800)
  }

  return (
    <main style={{
      minHeight: '100vh', background: '#0a0a0f',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg,#6C3FF5,#9B72FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>E</span>
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: 2 }}>EVA</span>
        </div>
        <button
          onClick={handleGoogleLogin}
          style={{
            background: 'rgba(108,63,245,0.2)', border: '1px solid rgba(108,63,245,0.5)',
            color: '#c4b5fd', borderRadius: 8, padding: '8px 20px',
            cursor: 'pointer', fontSize: 14, fontWeight: 500,
          }}
        >Login</button>
      </nav>

      {/* Hero */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
      }}>
        {/* Avatar with glow */}
        <div style={{ position: 'relative', marginBottom: 32 }}>
          <div style={{
            position: 'absolute', inset: -20,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(108,63,245,0.4) 0%, transparent 70%)',
            animation: 'pulse 3s ease-in-out infinite',
          }}/>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            background: 'linear-gradient(160deg, #2d1b69, #4c2f9e)',
            border: '2px solid rgba(108,63,245,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', zIndex: 1,
          }}>
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <circle cx="30" cy="22" r="12" fill="rgba(156,124,255,0.7)"/>
              <ellipse cx="30" cy="50" rx="20" ry="14" fill="rgba(108,63,245,0.6)"/>
            </svg>
          </div>
        </div>

        <h1 style={{
          fontSize: 52, fontWeight: 800, letterSpacing: 8,
          color: '#fff', margin: 0, marginBottom: 12,
          background: 'linear-gradient(135deg, #a78bfa, #c4b5fd)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>EVA</h1>

        <p style={{
          fontSize: 18, color: 'rgba(255,255,255,0.5)',
          marginBottom: 48, letterSpacing: 0.5,
        }}>Your Everyday Virtual Assistant</p>

        {/* Auth buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360 }}>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              background: '#fff', color: '#1a1a2e', border: 'none',
              borderRadius: 12, padding: '14px 24px',
              fontSize: 16, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
            }}
          >
            {/* Google icon */}
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={handleOutlookLogin}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              background: 'rgba(255,255,255,0.06)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12, padding: '14px 24px',
              fontSize: 16, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {/* Outlook icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#0078D4">
              <path d="M24 7.387v10.478L19.2 21V3L24 7.387zM18 3H7.2L0 7.2V24l7.2-3.6V8.4L18 12V3z"/>
            </svg>
            Continue with Outlook
          </button>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 20 }}>
          By continuing you agree to our Privacy Policy
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
        * { box-sizing: border-box; }
      `}</style>
    </main>
  )
}
