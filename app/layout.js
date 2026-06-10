import './globals.css'

export const metadata = {
  title: 'Alex Tutor — Learn the Claude API',
  description: 'A personal, adaptive AI tutor for the Anthropic Claude API. From complete beginner to developer.',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#f59e0b',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Alex Tutor" />
      </head>
      <body>{children}</body>
    </html>
  )
}
