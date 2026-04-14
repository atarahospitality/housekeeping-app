'use client'

import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { DeparturesList } from '@/components/departures-list'
import { todayYMD, offsetYMD, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Today', date: todayYMD() },
  { label: 'Tomorrow', date: offsetYMD(1) },
]

export default function DeparturesPage() {
  const [selectedDate, setSelectedDate] = useState(TABS[0].date)
  const activeTab = TABS.find((t) => t.date === selectedDate) ?? TABS[0]

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-2.5 mb-5">
        <CalendarDays className="h-5 w-5 text-gray-400" />
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">
            {activeTab.label === 'Today' ? "Today's" : "Tomorrow's"} Departures
          </h1>
          <p className="text-sm text-gray-500">{formatDate(selectedDate)}</p>
        </div>
      </div>

      {/* Today / Tomorrow toggle */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.date}
            onClick={() => setSelectedDate(tab.date)}
            className={cn(
              'flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
              selectedDate === tab.date
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-xs font-normal text-gray-400">
              {formatDate(tab.date).split(',')[0]}
            </span>
          </button>
        ))}
      </div>

      <DeparturesList date={selectedDate} />
    </div>
  )
}
