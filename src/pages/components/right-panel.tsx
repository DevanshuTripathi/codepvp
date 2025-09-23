import { Calendar, TrendingUp, ChevronLeft, ChevronRight, Star, Flame, Target } from "lucide-react"

export function RightPanel() {
  const currentDate = new Date()
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const generateCalendarDays = () => {
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === currentDate.getDate()
      const hasActivity = Math.random() > 0.7 // Random activity for demo

      days.push(
        <div
          key={day}
          className={`w-8 h-8 flex items-center justify-center text-sm rounded-md cursor-pointer transition-all duration-200 ${
            isToday
              ? "bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30"
              : hasActivity
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-cyan-400"
                : "hover:bg-gray-800/50 text-gray-400 hover:text-gray-200"
          }`}
        >
          {day}
        </div>,
      )
    }

    return days
  }

  const weeklyProgress = [
    { day: "W1", completed: true },
    { day: "W2", completed: true },
    { day: "W3", completed: false },
    { day: "W4", completed: false },
    { day: "W5", completed: false },
  ]

  const trendingCompanies = [
    { name: "Meta", count: 1301, trend: "up" },
    { name: "Google", count: 2108, trend: "up" },
    { name: "Amazon", count: 1847, trend: "down" },
    { name: "Microsoft", count: 1523, trend: "up" },
  ]

  return (
    <aside className="w-80 p-6 space-y-6 bg-gray-900/30 backdrop-blur-sm">
      {/* Streak Calendar */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-800 backdrop-blur-sm">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Day 14
            </h3>
            <div className="flex items-center gap-1">
              <button className="p-1 text-gray-400 hover:text-white rounded transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 text-gray-400 hover:text-white rounded transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-400">135,620 left</div>
        </div>
        <div className="p-4 space-y-4">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs text-center">
            {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
              <div key={day} className="text-gray-400 font-medium p-1">
                {day}
              </div>
            ))}
            {generateCalendarDays()}
          </div>

          {/* Weekly Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Weekly Premium</span>
              <Flame className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex gap-1">
              {weeklyProgress.map((week, index) => (
                <div
                  key={week.day}
                  className={`flex-1 h-2 rounded-full ${
                    week.completed 
                      ? "bg-gradient-to-r from-cyan-500/50 to-cyan-400/50" 
                      : "bg-gray-800"
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-gray-400">Less than a day</div>
          </div>
        </div>
      </div>

      {/* Redeem Points */}
      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center">
            <Star className="w-5 h-5 text-cyan-500" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-white">0 Redeem</div>
            <div className="text-sm text-gray-800">Earn points by solving</div>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <button className="w-full flex items-center justify-start gap-2 bg-transparent text-gray-300 hover:bg-gray-700 px-3 py-2 rounded-md transition-colors">
          <Target className="w-4 h-4" />
          Rules
        </button>
      </div>

      {/* Trending Companies */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Trending Companies
            </h3>
            <div className="flex items-center gap-1">
              <button className="p-1 text-gray-400 hover:text-white rounded transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 text-gray-400 hover:text-white rounded transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for a company..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            {trendingCompanies.map((company) => (
              <div
                key={company.name}
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700/50 transition-colors"
              >
                <span className="font-medium text-white">{company.name}</span>
                <div className="flex items-center gap-2">
                  <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs">{company.count}</span>
                  <TrendingUp className={`w-3 h-3 ${company.trend === "up" ? "text-cyan-500" : "text-red-500"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
