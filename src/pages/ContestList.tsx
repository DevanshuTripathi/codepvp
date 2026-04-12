import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useUser } from '../hooks/useUser';
import LoadingScreen from './components/LoadingScreen';
import { Flame, Calendar, Lock, ChevronRight, Target } from 'lucide-react';

interface Contest {
  id: string;
  name: string;
  status: string;
  visibility: string;
  startDate: any; // Firestore Timestamp
  endDate: any;
  prizes: any[];
}

const ContestList: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();

  // Protect route
  useEffect(() => {
    if (!user && !userLoading) navigate("/login");
  }, [user, userLoading, navigate]);

  // Fetch Public FFA Contests
  useEffect(() => {
    const fetchContests = async () => {
      try {
        // Querying a "Contests" collection specifically for public FFA modes
        const q = query(collection(db, "Contests"), where("visibility", "==", "Public"), where("status", "!=", "Completed"));
        const querySnapshot = await getDocs(q);
        
        const fetchedContests: Contest[] = [];
        querySnapshot.forEach((doc) => {
          fetchedContests.push({ id: doc.id, ...doc.data() } as Contest);
        });
        
        setContests(fetchedContests);
      } catch (err) {
        console.error("Error fetching contests:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContests();
  }, []);

  const handleJoinPublic = async (contestId: string) => {
    setIsJoining(true);
    // Add a slight delay for visual feedback/loading screen tension
    await new Promise(resolve => setTimeout(resolve, 800));
    navigate(`/contests/${contestId}`);
  };

  const handleJoinPrivate = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);

    try {
      // Query database for a contest with this exact join code
      const q = query(collection(db, "Contests"), where("joinCode", "==", joinCode.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("Invalid Access Code. The arena rejects you.");
        setIsJoining(false);
        return;
      }

      // Grab the first match
      const contestId = querySnapshot.docs[0].id;
      
      await new Promise(resolve => setTimeout(resolve, 800));
      navigate(`/contests/${contestId}`);

    } catch (err) {
      console.error("Error joining private contest:", err);
      alert("Error verifying code.");
      setIsJoining(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "TBD";
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading || isJoining) {
    return <LoadingScreen message={isJoining ? "Entering the Chaos..." : "Loading Active Zones..."} />;
  }

  return (
    <div className='bg-gray-950 flex justify-center items-center h-dvh w-dvw overflow-hidden'>
      <div className="z-10 flex flex-col p-8 max-w-3xl w-full max-h-[90vh]
        bg-black/40 backdrop-blur-md 
        border border-orange-500/20 rounded-xl
        shadow-2xl shadow-orange-500/10 flex-shrink-0">
        
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-8 shrink-0">
          <div className="flex items-center gap-4">
            <Flame className="text-orange-500 w-10 h-10 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse" />
            <h2 className="text-4xl md:text-5xl font-black text-orange-400 tracking-tighter uppercase italic" style={{ textShadow: `0 0 10px #f97316` }}>
              FFA Contests
            </h2>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="text-red-400 hover:text-white transition-colors duration-300 text-lg flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Retreat
          </button>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-6">
          
          {/* Public Contests List */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl text-orange-500 mb-2 uppercase tracking-widest font-bold flex items-center gap-2">
              <Target size={20} /> Active Drop Zones
            </h3>
            
            {contests.length === 0 ? (
              <div className="text-center py-8 text-gray-500 italic border border-gray-800 rounded-lg bg-black/20">
                No active free-for-all contests right now. Check back later.
              </div>
            ) : (
              contests.map((contest) => (
                <div 
                  key={contest.id}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900/60 border border-orange-500/20 rounded-lg p-5 transition-all duration-300 hover:bg-orange-950/40 hover:border-orange-500/60 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] group cursor-pointer"
                  onClick={() => handleJoinPublic(contest.id)}
                >
                  <div className="flex flex-col gap-1 mb-4 md:mb-0">
                    <div className="flex items-center gap-3">
                      <h4 className="text-xl text-white font-bold tracking-wider group-hover:text-orange-400 transition-colors">
                        {contest.name}
                      </h4>
                      <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-sm ${
                        contest.status === 'Ongoing' ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' : 
                        contest.status === 'Completed' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/50' : 
                        'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                      }`}>
                        {contest.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-orange-200/50">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(contest.startDate)}</span>
                    </div>
                  </div>

                  <button className="w-full md:w-auto bg-orange-500/10 text-orange-400 border border-orange-500/30 font-bold py-2 px-6 rounded-md group-hover:bg-orange-500 group-hover:text-gray-900 transition-all flex items-center justify-center gap-2">
                    Deploy <ChevronRight size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Divider */}
          <div className="relative flex py-4 items-center shrink-0">
            <div className="flex-grow border-t border-gray-700/80"></div>
            <span className="flex-shrink mx-4 text-gray-600 text-sm font-bold tracking-widest">OR</span>
            <div className="flex-grow border-t border-gray-700/80"></div>
          </div>

          {/* Private Contest Entry */}
          <div className="w-full flex flex-col gap-4 p-6 border border-red-500/30 rounded-lg bg-red-950/10 shrink-0">
            <h3 className="text-lg text-red-400 font-semibold flex items-center gap-2">
              <Lock size={18} /> Enter Private Match
            </h3>
            
            <div className="flex flex-col md:flex-row gap-3">
              <input 
                type="text" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 bg-gray-950/80 border-2 border-gray-800 rounded-lg px-4 py-3 text-white text-center md:text-left text-xl tracking-[.2em] uppercase
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 placeholder-gray-700"
                placeholder="ENTER ACCESS CODE"
              />
              <button 
                onClick={handleJoinPrivate}
                className="font-black text-black bg-red-500 border-2 border-red-500 rounded-lg py-3 px-8 text-lg uppercase tracking-wider
                transition-all duration-300 
                hover:bg-transparent hover:text-red-500
                hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] whitespace-nowrap"
              >
                Infiltrate
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContestList;