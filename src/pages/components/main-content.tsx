import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  Trophy,
  Zap,
  Target,
  Gamepad2,
  Code,
  Database,
  Terminal,
  Cpu,
  BarChart3,
} from "lucide-react"

export function MainContent() {
  const featuredChallenges = [
    {
      title: "Arena Championship",
      subtitle: "Battle Royale Coding",
      description: "Compete in real-time coding battles",
      price: "$49",
      originalPrice: "$99",
      image: "/coding-battle-arena.jpg",
      gradient: "from-gray-800 to-gray-900", // Simplified gradient
    },
    {
      title: "Algorithm Mastery",
      subtitle: "Advanced Data Structures",
      description: "Master complex algorithms and patterns",
      image: "/algorithm-visualization.png",
      gradient: "from-gray-800 to-gray-900",
    },
    {
      title: "Game Dev Challenge",
      subtitle: "Build Your Own Game",
      description: "Create games while learning to code",
      image: "/game-development-concept.png",
      gradient: "from-gray-800 to-gray-900",
    },
  ]

  const categories = [
    { name: "Array", count: 1977, icon: BarChart3 },
    { name: "String", count: 809, icon: Code },
    { name: "Hash Table", count: 722, icon: Database },
    { name: "Dynamic Programming", count: 609, icon: Cpu },
    { name: "Math", count: 607, icon: Target },
    { name: "Sorting", count: 467, icon: BarChart3 },
  ]

  const topicFilters = [
    { name: "All Topics", active: true },
    { name: "Algorithms", icon: Code },
    { name: "Database", icon: Database },
    { name: "Shell", icon: Terminal },
    { name: "Concurrency", icon: Cpu },
    { name: "Game Logic", icon: Gamepad2 },
  ]

  const challenges = [
    {
      id: 966,
      title: "Battle Arena Simulator",
      acceptance: "56.8%",
      difficulty: "Medium",
      solved: true,
    },
    {
      id: 1,
      title: "Two Player Game",
      acceptance: "56.3%",
      difficulty: "Easy",
      solved: true,
    },
    {
      id: 2,
      title: "Multiplayer Matchmaking",
      acceptance: "46.9%",
      difficulty: "Medium",
      solved: true,
    },
    {
      id: 3,
      title: "Longest Combo Chain",
      acceptance: "37.5%",
      difficulty: "Medium",
      solved: false,
    },
  ]

  return (
    <main className="flex-1 p-6 space-y-6">
      {/* Featured Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredChallenges.map((challenge, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-800 text-white rounded-xl overflow-hidden relative p-6 
            hover:border-cyan-500/30 transition-all duration-300 group
            hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]"
          >
            {/* Add subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold mb-1">{challenge.title}</h3>
                  <p className="text-sm text-gray-400">{challenge.subtitle}</p>
                </div>
                {challenge.price && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-400">{challenge.price}</div>
                    {challenge.originalPrice && (
                      <div className="text-sm line-through text-gray-500">{challenge.originalPrice}</div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-4">{challenge.description}</p>
              <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors font-medium border border-gray-700 hover:border-cyan-500/30">
                Start Challenge
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-4">
        {categories.map((category) => (
          <button
            key={category.name}
            className="flex items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-800 text-gray-300 
            hover:text-cyan-400 px-4 py-2 rounded-md transition-all duration-300
            border border-gray-800 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            <category.icon className="w-4 h-4 text-cyan-400/70" />
            {category.name}
            <span className="ml-2 text-cyan-400/50 text-xs">{category.count}</span>
          </button>
        ))}
      </div>

      {/* Topic Filters */}
      <div className="flex flex-wrap gap-2">
        {topicFilters.map((topic) => (
          <button
            key={topic.name}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              topic.active
                ? "bg-gray-800 text-cyan-400 border border-cyan-500/30"
                : "bg-gray-900/30 border border-gray-800 text-gray-300 hover:border-cyan-500/30"
            }`}
          >
            {topic.icon && <topic.icon className="w-4 h-4" />}
            {topic.name}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            placeholder="Search challenges..."
            className="pl-10 w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center gap-2 bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-800 px-4 py-2 rounded-md transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Progress Stats */}
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 
        border border-gray-800 rounded-lg p-4 hover:border-cyan-500/30 transition-all duration-300
        hover:shadow-[0_0_25px_rgba(6,182,212,0.1)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
            <Trophy className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="text-sm text-gray-400">Progress</div>
            <div className="font-semibold text-white">127/500 Solved</div>
          </div>
        </div>
        <span className="text-cyan-400 bg-gray-800 px-3 py-1 rounded-md text-sm border border-cyan-500/30">
          25.4% Complete
        </span>
      </div>

      {/* Challenge List */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800/50 to-gray-900 rounded-xl border border-gray-800">
        <div className="p-6 border-b border-gray-800/50 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Featured Challenges
          </h2>
        </div>
        <div className="p-6 space-y-4">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="flex items-center justify-between p-4 rounded-lg 
              bg-gradient-to-r from-transparent via-gray-800/30 to-transparent
              hover:bg-gray-800/50 transition-all duration-300 
              border border-transparent hover:border-cyan-500/30
              hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {challenge.solved ? (
                    <CheckCircle className="w-5 h-5 text-cyan-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="font-mono text-sm text-gray-400">{challenge.id}.</span>
                </div>
                <div>
                  <h4 className="font-medium text-white">{challenge.title}</h4>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">{challenge.acceptance}</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    challenge.difficulty === "Easy"
                      ? "bg-gradient-to-r from-cyan-500 to-cyan-400 text-white"
                      : challenge.difficulty === "Medium"
                        ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white"
                        : "bg-gradient-to-r from-red-500 to-red-400 text-white"
                  }`}
                >
                  {challenge.difficulty}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
