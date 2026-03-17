import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EVA — Your Everyday Virtual Assistant',
  description: 'AILA — Unified AI Life-Load Assistant',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap" rel="stylesheet"/>
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0a0a0f' }}>
        {children}
      </body>
    </html>
  )
}
