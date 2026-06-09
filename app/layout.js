import './globals.css'

export const metadata = {
  title: 'Alex Tutor — Learn the Claude API',
  description: 'A personal, adaptive AI tutor for the Anthropic Claude API. From complete beginner to developer.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
