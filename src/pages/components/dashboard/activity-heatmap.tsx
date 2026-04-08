import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useUser } from '../../../hooks/useUser';
import { getRatingLevel } from '../../../utils/ratingUtils';
import { Lock } from 'lucide-react'; // Added Lock icon

// Mock data - this should come from user's rating history in Firestore
const generateMockData = (currentRating: number) => {
  const data = [];
  const startRating = 200; // Minimum rating (Beginner level)
  let rating = startRating;
  
  // Generate 30 days of data leading up to current rating
  const increment = (currentRating - startRating) / 30;
  
  for (let i = 0; i < 30; i++) {
    rating += increment + (Math.random() * 10 - 5); // Add some variation
    rating = Math.max(200, rating); // Don't go below minimum rating
    
    const date = new Date();
    date.setDate(date.getDate() - (30 - i));
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rating: Math.round(rating),
    });
  }
  
  // Ensure last point is current rating
  data[data.length - 1].rating = currentRating;
  
  return data;
};

export function ActivityHeatmap() {
  const { userData, loading } = useUser();
  const currentRating = userData?.rating || 200;
  const ratingInfo = getRatingLevel(currentRating);
  
  // Generate or use actual rating history data
  const ratingData = generateMockData(currentRating);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full"/>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm">{payload[0].payload.date}</p>
          <p className={`font-bold ${ratingInfo.color}`}>
            Rating: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="gaming-border gaming-glow bg-card rounded-lg p-6 h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            MMR Trajectory
          </h3>
          <p className="text-sm text-gray-400 mt-1">Season 1 Analytics</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Current Rating</p>
          <p className={`text-2xl font-bold ${ratingInfo.color} drop-shadow-md`}>
            {currentRating}
          </p>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{ratingInfo.level}</p>
        </div>
      </div>

      {/* CHART CONTAINER WITH CALIBRATION OVERLAY */}
      <div className="relative w-full rounded-xl overflow-hidden group flex-1 min-h-[250px]">
        
        {/* The "Locked" Glassmorphism Overlay */}
        <div className="absolute inset-0 z-10 backdrop-blur-[6px] bg-black/50 flex flex-col items-center justify-center border border-white/5 rounded-xl transition-all duration-500 hover:bg-black/40">
          <div className="bg-black/60 p-4 rounded-full mb-3 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <Lock className="w-6 h-6 text-purple-400" />
          </div>
          <span className="text-cyan-400 font-bold uppercase tracking-[0.15em] text-sm drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
            Calibration Phase
          </span>
          <p className="text-xs text-gray-300 mt-2 text-center max-w-[200px] font-medium leading-relaxed">
            Play <span className="text-purple-400 font-bold">5 placement matches</span> to unlock your global MMR trajectory.
          </p>
        </div>

        {/* Blurred background chart (keeps your exact original code) */}
        <div className="opacity-40 pointer-events-none w-full h-full absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ratingData}>
              <defs>
                <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="rating"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#ratingGradient)"
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ fill: '#06b6d4', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rating Milestones */}
      <div className="mt-6 grid grid-cols-4 gap-2 md:gap-3 text-center">
        <div className="p-2 md:p-3 bg-black/40 rounded-lg border border-white/5 hover:border-green-500/30 transition-colors">
          <p className="text-[10px] md:text-xs text-gray-400 mb-1 uppercase tracking-wider">Beginner</p>
          <p className={`text-xs md:text-sm font-semibold ${currentRating >= 200 ? 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]' : 'text-gray-600'}`}>
            200-399
          </p>
        </div>
        <div className="p-2 md:p-3 bg-black/40 rounded-lg border border-white/5 hover:border-blue-500/30 transition-colors">
          <p className="text-[10px] md:text-xs text-gray-400 mb-1 uppercase tracking-wider">Medium</p>
          <p className={`text-xs md:text-sm font-semibold ${currentRating >= 400 ? 'text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]' : 'text-gray-600'}`}>
            400-599
          </p>
        </div>
        <div className="p-2 md:p-3 bg-black/40 rounded-lg border border-white/5 hover:border-purple-500/30 transition-colors">
          <p className="text-[10px] md:text-xs text-gray-400 mb-1 uppercase tracking-wider">Advanced</p>
          <p className={`text-xs md:text-sm font-semibold ${currentRating >= 600 ? 'text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.5)]' : 'text-gray-600'}`}>
            600-799
          </p>
        </div>
        <div className="p-2 md:p-3 bg-black/40 rounded-lg border border-white/5 hover:border-orange-500/30 transition-colors">
          <p className="text-[10px] md:text-xs text-gray-400 mb-1 uppercase tracking-wider">Expert</p>
          <p className={`text-xs md:text-sm font-semibold ${currentRating >= 800 ? 'text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.5)]' : 'text-gray-600'}`}>
            800+
          </p>
        </div>
      </div>
    </div>
  );
}