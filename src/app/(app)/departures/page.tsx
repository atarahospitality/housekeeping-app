import { formatDate, todayYMD } from '@/lib/utils'
import { DeparturesList } from '@/components/departures-list'
import { CalendarDays } from 'lucide-react'

export default function DeparturesPage() {
  const today = todayYMD()

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-2.5 mb-6">
        <CalendarDays className="h-5 w-5 text-gray-400" />
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">
            Today&apos;s Departures
          </h1>
          <p className="text-sm text-gray-500">{formatDate(today)}</p>
        </div>
      </div>

      <DeparturesList />
    </div>
  )
}
