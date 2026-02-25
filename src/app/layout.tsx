import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tasks — AI自動化',
  description: 'Claude APIを使ったタスク自動化Webアプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
