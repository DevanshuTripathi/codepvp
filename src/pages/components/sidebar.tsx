import { BookOpen, Target, Star, Plus, Lock, Code, Gamepad2, Sword, Shield } from "lucide-react"

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4 min-h-[calc(100vh-73px)]">
      <div className="space-y-6">
        {/* Main Navigation */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-300 mb-3">
            <BookOpen className="w-4 h-4" />
            <span className="font-medium">Library</span>
          </div>

          <button className="w-full flex items-center justify-start gap-2 text-gray-300 hover:bg-gray-800 px-3 py-2 rounded-md transition-colors">
            <Target className="w-4 h-4" />
            Study Plan
          </button>
        </div>

        {/* My Lists */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">My Lists</span>
            <button className="p-1 text-gray-400 hover:text-white rounded transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button className="w-full flex items-center justify-start gap-2 text-gray-300 hover:bg-gray-800 px-3 py-2 rounded-md transition-colors">
            <Star className="w-4 h-4 text-orange-500" />
            Favorites
            <Lock className="w-3 h-3 ml-auto text-gray-500" />
          </button>
        </div>

        {/* Challenge Categories */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-300">Categories</span>

          <button className="w-full flex items-center justify-start gap-2 text-gray-300 hover:bg-gray-800 px-3 py-2 rounded-md transition-colors">
            <Code className="w-4 h-4 text-cyan-500" />
            Algorithms
          </button>

          <button className="w-full flex items-center justify-start gap-2 text-gray-300 hover:bg-gray-800 px-3 py-2 rounded-md transition-colors">
            <Gamepad2 className="w-4 h-4 text-orange-500" />
            Game Logic
          </button>

          <button className="w-full flex items-center justify-start gap-2 text-gray-300 hover:bg-gray-800 px-3 py-2 rounded-md transition-colors">
            <Sword className="w-4 h-4 text-red-500" />
            Combat Systems
          </button>

          <button className="w-full flex items-center justify-start gap-2 text-gray-300 hover:bg-gray-800 px-3 py-2 rounded-md transition-colors">
            <Shield className="w-4 h-4 text-green-500" />
            Security
          </button>
        </div>

        {/* Stats */}
        <div className="bg-gray-800 rounded-lg p-3 space-y-2">
          <div className="text-sm font-medium text-gray-300">Progress</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Solved</span>
              <span className="text-gray-300">127/500</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-cyan-500 h-2 rounded-full" style={{ width: "25.4%" }}></div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
