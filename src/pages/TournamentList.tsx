import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useUser } from '../hooks/useUser';
import LoadingScreen from './components/LoadingScreen';
import { Trophy, Calendar, Lock, ChevronRight, Swords } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  status: string;
  visibility: string;
  startDate: any; // Firestore Timestamp
  endDate: any;
  prizes: any[];
}

const TournamentList: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();

  // Protect route
  useEffect(() => {
    if (!user && !userLoading) navigate("/login");
  }, [user, userLoading, navigate]);

  // Fetch Public Tournaments
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        // Only fetch public tournaments for the list
        const q = query(collection(db, "Tournaments"), where("visibility", "==", "Public"));
        const querySnapshot = await getDocs(q);

        const fetchedTournaments: Tournament[] = [];
        querySnapshot.forEach((doc) => {
          fetchedTournaments.push({ id: doc.id, ...doc.data() } as Tournament);
        });

        setTournaments(fetchedTournaments);
      } catch (err) {
        console.error("Error fetching tournaments:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  const handleJoinPublic = async (tournamentId: string) => {
    setIsJoining(true);
    console.log(tournamentId);
    // Add a slight delay for visual feedback/loading screen
    await new Promise(resolve => setTimeout(resolve, 800));
    navigate(`/tournaments/${tournamentId}`);
  };

  const handleJoinPrivate = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);

    try {
      // Query database for a tournament with this exact join code
      const q = query(collection(db, "Tournaments"), where("joinCode", "==", joinCode.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("Invalid Join Code. Please try again.");
        setIsJoining(false);
        return;
      }

      // Assuming codes are unique, grab the first match
      const tournamentId = querySnapshot.docs[0].id;

      await new Promise(resolve => setTimeout(resolve, 800));
      navigate(`/tournaments/${tournamentId}`);

    } catch (err) {
      console.error("Error joining private tournament:", err);
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
    return <LoadingScreen message={isJoining ? "Joining Tournament..." : "Loading Arena..."} />;
  }

  return (
    <div className='bg-gray-900 flex justify-center items-center h-dvh w-dvw overflow-hidden'>
      <div className="z-10 flex flex-col p-8 max-w-3xl w-full max-h-[90vh]
        bg-black/30 backdrop-blur-md 
        border border-cyan-400/20 rounded-xl
        shadow-2xl shadow-cyan-500/10 flex-shrink-0">

        {/* Header */}
        <div className="w-full flex justify-between items-center mb-8 shrink-0">
          <div className="flex items-center gap-4">
            <Trophy className="text-cyan-400 w-10 h-10 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <h2 className="text-4xl md:text-5xl font-bold text-cyan-300 tracking-tighter uppercase italic" style={{ textShadow: `0 0 8px #0ff` }}>
              Tournaments
            </h2>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-purple-300 hover:text-white transition-colors duration-300 text-lg flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back
          </button>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-6">

          {/* Public Tournaments List */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl text-cyan-400 mb-2 uppercase tracking-widest font-bold flex items-center gap-2">
              <Swords size={20} /> Active Arenas
            </h3>

            {tournaments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 italic border border-gray-800 rounded-lg bg-black/20">
                No public tournaments available right now.
              </div>
            ) : (
              tournaments.map((tourney) => (
                <div
                  key={tourney.id}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-800/60 border border-cyan-400/20 rounded-lg p-5 transition-all duration-300 hover:bg-cyan-900/40 hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] group cursor-pointer"
                  onClick={() => handleJoinPublic(tourney.id)}
                >
                  <div className="flex flex-col gap-1 mb-4 md:mb-0">
                    <div className="flex items-center gap-3">
                      <h4 className="text-xl text-white font-bold tracking-wider group-hover:text-cyan-300 transition-colors">
                        {tourney.name}
                      </h4>
                      <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-sm ${tourney.status === 'Ongoing' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' :
                        tourney.status === 'Completed' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/50' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                        }`}>
                        {tourney.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-cyan-500/70">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(tourney.startDate)}</span>
                    </div>
                  </div>

                  <button className="w-full md:w-auto bg-cyan-500/10 text-cyan-300 border border-cyan-400/30 font-bold py-2 px-6 rounded-md group-hover:bg-cyan-400 group-hover:text-gray-900 transition-all flex items-center justify-center gap-2">
                    Enter <ChevronRight size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Divider */}
          <div className="relative flex py-4 items-center shrink-0">
            <div className="flex-grow border-t border-gray-700/80"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm font-bold tracking-widest">OR</span>
            <div className="flex-grow border-t border-gray-700/80"></div>
          </div>

          {/* Private Tournament Entry */}
          <div className="w-full flex flex-col gap-4 p-6 border border-purple-500/30 rounded-lg bg-purple-900/10 shrink-0">
            <h3 className="text-lg text-purple-300 font-semibold flex items-center gap-2">
              <Lock size={18} /> Join Private Tournament
            </h3>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 bg-gray-900/80 border-2 border-gray-700/50 rounded-lg px-4 py-3 text-white text-center md:text-left text-xl tracking-[.2em]
                focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-300"
                placeholder="ENTER SECRET CODE"
              />
              <button
                onClick={handleJoinPrivate}
                className="font-bold text-gray-900 bg-purple-400 border-2 border-purple-400 rounded-lg py-3 px-8 text-lg uppercase tracking-wider
                transition-all duration-300 
                hover:bg-transparent hover:text-purple-300
                hover:shadow-[0_0_20px_rgba(192,132,252,0.5)] whitespace-nowrap"
              >
                Unlock
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TournamentList;