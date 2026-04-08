import { useUser } from "../../../hooks/useUser"

export function ProblemStats() {
  const { userData } = useUser()
  const totalSolved = userData?.questionsSolved || 0
  const totalProblems = 2682
  const percentage = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0

  // Calculate stroke-dasharray for the circular progress
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="gaming-border gaming-glow bg-card rounded-lg">
      <div className="p-6">
        <div className="flex flex-col items-center">
          
          {/* Circular Progress */}
          <div className="relative w-48 h-48 mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle cx="100" cy="100" r={radius} stroke="rgb(55, 65, 81)" strokeWidth="8" fill="none" />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke="url(#gamingGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="gamingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center Stats */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="text-3xl font-bold text-foreground">{totalSolved}</div>
              <div className="text-sm text-muted-foreground">/{totalProblems}</div>
              <div className="text-xs font-semibold text-purple-400 mt-1 uppercase tracking-wider">
                Solo Solved
              </div>
            </div>
          </div>

          {/* =========================================
              PREVIOUS STATS GRID (COMMENTED OUT FOR LAUNCH)
              ========================================= */}
          {/* <div className="text-sm text-muted-foreground mb-4">1 Attempting</div>

          <div className="grid grid-cols-3 gap-4 w-full mb-4">
            <div className="text-center">
              <div className="text-sm text-green-400 font-medium">Easy</div>
              <div className="text-sm text-muted-foreground">26/901</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-cyan-400 font-medium">Med.</div>
              <div className="text-sm text-muted-foreground">39/1920</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-purple-400 font-medium">Hard</div>
              <div className="text-sm text-muted-foreground">5/870</div>
            </div>
          </div> 
          */}

          {/* Coming Soon Teaser */}
          <div className="w-full relative overflow-hidden bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center group transition-colors hover:border-white/10 mt-2">
            {/* Subtle sweep animation */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-[shimmer_2s_infinite]"></div>
            
            <span className="text-cyan-400 font-bold uppercase tracking-[0.2em] text-sm drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
              Coming Soon
            </span>
            <span className="text-xs text-gray-500 mt-1 text-center font-medium">
              Solo Training Campaign
            </span>
          </div>

        </div>
      </div>
    </div>
  )
}