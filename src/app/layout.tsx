import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ToastProvider } from '@/components/ui/toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Housekeeping',
  description: 'Hotel housekeeping management',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Housekeeping',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1a56db',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} bg-gray-50 min-h-full`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
