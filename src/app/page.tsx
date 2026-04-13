import { redirect } from 'next/navigation'

// Root redirects to departures (or login via middleware)
export default function Home() {
  redirect('/departures')
}
