import { Search, Bell, Zap, ChevronDown, Binary, Gem, Swords, Users } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left section */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CodePVP</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button className="text-gray-300 hover:text-cyan-400 px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 hover:bg-gray-800/50">
              <Swords className="w-4 h-4" />
              Solo Arena
            </button>
            <button className="text-gray-300 hover:text-cyan-400 px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 hover:bg-gray-800/50">
              <Users className="w-4 h-4" />
              Battle Royale
            </button>
            <button className="text-cyan-400 font-medium border-b-2 border-cyan-400 px-4 py-2 flex items-center gap-2">
              <Binary className="w-4 h-4" />
              Problems
            </button>
            <button className="text-gray-300 hover:text-cyan-400 px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 hover:bg-gray-800/50">
              <Gem className="w-4 h-4" />
              Arena <ChevronDown className="w-4 h-4" />
            </button>
          </nav>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              placeholder="Search problems..."
              className="pl-10 w-64 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <button className="relative p-2 text-gray-300 hover:text-white rounded-md transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

        

          <div className="w-8 h-8 bg-gray-700 rounded-full overflow-hidden">
            <img src="/gamer-avatar.png" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  )
}

