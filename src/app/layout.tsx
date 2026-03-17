import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AILA — Your AI Life-Load Assistant',
  description: 'Reduce your mental load with AI-powered meal planning, task management, and smart reminders.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0a0a0f' }}>
        {children}
      </body>
    </html>
  )
}
