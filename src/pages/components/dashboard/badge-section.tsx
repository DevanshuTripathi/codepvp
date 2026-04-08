// import { useEffect, useState } from "react"

export function BadgeSection() {
  // =========================================
  // PREVIOUS BADGE LOGIC (COMMENTED OUT FOR LAUNCH)
  // =========================================
  /*
  const [currentStreak, setCurrentStreak] = useState(50)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    // Check if we need to update the streak (once per day)
    const today = new Date().toDateString()
    const lastUpdate = localStorage.getItem("lastStreakUpdate")

    if (lastUpdate !== today) {
      // Update streak for new day
      const savedStreak = localStorage.getItem("currentStreak")
      const newStreak = savedStreak ? Number.parseInt(savedStreak) + 1 : 50

      setCurrentStreak(newStreak)
      localStorage.setItem("currentStreak", newStreak.toString())
      localStorage.setItem("lastStreakUpdate", today)
      setLastUpdated(new Date())
    } else {
      // Load existing streak
      const savedStreak = localStorage.getItem("currentStreak")
      if (savedStreak) {
        setCurrentStreak(Number.parseInt(savedStreak))
      }
    }
  }, [])
  */

  return (
    <div className="gaming-border gaming-glow bg-card rounded-lg flex flex-col h-full">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg text-foreground font-semibold">Badges</h3>
          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* =========================================
          PREVIOUS UI (COMMENTED OUT)
          ========================================= */}
      {/* <div className="px-4 pb-4 space-y-4">
        <div className="text-3xl font-bold text-foreground">0</div>

        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Most Recent Badge</div>
            <div className="font-semibold text-foreground">{currentStreak} Days Badge 2025</div>
            {lastUpdated && <div className="text-xs text-purple-400">Updated today! 🎉</div>}
          </div>
        </div>
      </div> 
      */}

      {/* NEW "COMING SOON" UI */}
      <div className="px-4 pb-6 flex-1 flex flex-col items-center justify-center space-y-4 min-h-[140px] mt-2">
        
        {/* Mystery/Locked Badge Icon */}
        <div className="w-16 h-16 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.15)] relative overflow-hidden group hover:border-purple-500/50 transition-colors duration-300">
          {/* Shimmer sweep animation */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2.5s_infinite]"></div>
          
          <svg className="w-7 h-7 text-purple-400/80 drop-shadow-md group-hover:text-purple-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        {/* Hype Text */}
        <div className="text-center">
          <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 uppercase tracking-widest mb-1.5 drop-shadow-sm">
            Arriving Soon
          </div>
          <div className="text-xs text-muted-foreground max-w-[220px] leading-relaxed mx-auto font-medium">
            Exclusive achievements for PvP victors and top rankers.
          </div>
        </div>

      </div>
    </div>
  )
}