import { useUser } from '../../../hooks/useUser';
import { getRatingLevel } from '../../../utils/ratingUtils';

export function ProfileHeader() {
  const { userData, loading } = useUser();

  if (loading) {
    return (
      <div className="gaming-border gaming-glow bg-card rounded-lg">
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full"/>
        </div>
      </div>
    );
  }

  // Use userData from Firestore if available, otherwise fallback
  const displayName = userData?.username || "User";
  const displayEmail = userData?.email || "";
  const displayAvatar = userData?.avatar;
  const displayBio = userData?.bio;
  const rating = userData?.rating || 200;
  const questionsSolved = userData?.questionsSolved || 0;

  const ratingInfo = getRatingLevel(rating);
  

  return (
    <div className="gaming-border gaming-glow bg-card rounded-lg">
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 ring-2 ring-purple-500/50 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center">
            {displayAvatar ? (
              <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-foreground">{displayName}</h1>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-muted-foreground text-sm">{displayEmail}</p>
          </div>
        </div>

        {displayBio && (
          <div className="mb-4 p-3 bg-gray-800/30 rounded-lg">
            <p className="text-sm text-gray-300">{displayBio}</p>
          </div>
        )}

        {/* Rating Section */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Rating</p>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${ratingInfo.color}`}>{ratingInfo.level}</span>
                <span className="text-sm text-gray-400">({rating} pts)</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Questions Solved</p>
              <p className="text-lg font-bold text-cyan-400">{questionsSolved}</p>
            </div>
          </div>

          {/* Progress Bar */}
          
        </div>

        {/* <button className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/25 px-4 py-2 rounded-md transition-colors duration-200">
          Edit Profile
        </button> */}
      </div>
    </div>
  )
}
