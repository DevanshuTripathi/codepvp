import { useEffect, useState } from "react";
import { db, auth } from "../../../../firebaseConfig";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Medal } from "lucide-react";

// Types
interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  rarity: string;
}

export function BadgeSection() {
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserBadges = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // 1. Get the current user's profile data
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        
        // We assume you are pushing badge IDs to an 'earnedBadges' array in the user doc
        const userBadgeIds: string[] = userData?.earnedBadges || [];

        if (userBadgeIds.length === 0) {
          setLoading(false);
          return;
        }

        // 2. Fetch all available badges from the global 'Badges' collection
        const badgesSnapshot = await getDocs(collection(db, "Badges"));
        const allBadges: Badge[] = [];
        
        badgesSnapshot.forEach((doc) => {
          allBadges.push({ id: doc.id, ...doc.data() } as Badge);
        });

        // 3. Filter to only show the badges this specific user owns
        const userOwnedBadges = allBadges.filter(badge => userBadgeIds.includes(badge.id));
        
        // Reverse so the most recently earned shows up at the top of the list
        setEarnedBadges(userOwnedBadges.reverse());

      } catch (error) {
        console.error("Error fetching user badges:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserBadges();
  }, []);

  // Helper to color-code the UI based on how rare the badge is
  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'from-amber-500 to-yellow-600 shadow-amber-500/25';
      case 'Epic': return 'from-purple-600 to-cyan-500 shadow-purple-600/25';
      case 'Rare': return 'from-blue-500 to-indigo-500 shadow-blue-500/25';
      default: return 'from-gray-500 to-slate-600 shadow-gray-500/25'; // Common
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'text-amber-400';
      case 'Epic': return 'text-purple-600';
      case 'Rare': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="gaming-border gaming-glow bg-card rounded-lg flex flex-col h-full min-h-[300px]">
      <div className="p-4 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg text-foreground font-semibold">Badges</h3>
          <span className="text-sm font-mono text-muted-foreground bg-black/30 px-2 py-1 rounded">
            {earnedBadges.length} UNLOCKED
          </span>
        </div>
      </div>

      {loading ? (
        // Loading Skeleton
        <div className="px-4 py-6 flex-1 flex flex-col items-center justify-center animate-pulse space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-2xl"></div>
          <div className="h-4 bg-white/5 rounded w-24"></div>
        </div>
      ) : earnedBadges.length > 0 ? (
        <div className="flex flex-col flex-1">
          {/* List all badges uniformly */}
          <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1 max-h-[350px]">
            {earnedBadges.map((badge) => (
              <div key={badge.id} className="flex items-center space-x-3 bg-black/20 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                
                {/* Badge Icon */}
                <div className={`w-12 h-12 bg-gradient-to-br ${getRarityGlow(badge.rarity)} rounded-lg flex items-center justify-center shrink-0 shadow-md relative overflow-hidden group`}>
                   {/* Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>
                  {badge.imageUrl ? (
                    <img src={badge.imageUrl} alt={badge.name} className="w-full h-full object-cover p-1 rounded-lg relative z-10" />
                  ) : (
                    <Medal className="w-6 h-6 text-white relative z-10" />
                  )}
                </div>
                
                {/* Badge Details */}
                <div className="flex-1 min-w-0">
                  <div className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${getRarityText(badge.rarity)}`}>
                    {badge.rarity}
                  </div>
                  <div className="font-bold text-sm text-gray-200 truncate">{badge.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{badge.description}</div>
                </div>

              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State: Locked UI */
        <div className="px-4 pb-6 flex-1 flex flex-col items-center justify-center space-y-4 min-h-[140px] mt-2">
          <div className="w-16 h-16 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.15)] relative overflow-hidden group hover:border-purple-500/50 transition-colors duration-300">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2.5s_infinite]"></div>
            <svg className="w-7 h-7 text-purple-400/80 drop-shadow-md group-hover:text-purple-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 uppercase tracking-widest mb-1.5 drop-shadow-sm">
              No Badges Yet
            </div>
            <div className="text-xs text-muted-foreground max-w-[220px] leading-relaxed mx-auto font-medium">
              Compete in PvP arenas to unlock your first achievement.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}