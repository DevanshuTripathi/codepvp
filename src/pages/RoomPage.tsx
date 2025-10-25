import React, { useState, useEffect } from 'react';
import { socket } from '../utils/socket';
import { useParams } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { getDocs, getDoc, collection, query, where, setDoc, doc } from "firebase/firestore";
import { db } from '../../firebaseConfig';
import ChatBox from './components/chat-box';
import type { RoomSettings } from './MultiPlayer';
import LoadingScreen from './components/LoadingScreen';

type PlayerSlotProps = {
    player: { pid: string, ready: boolean } | null;
    onJoin: () => void;
    onToggleReady: () => void;
    currentUserId: string;
}

const PlayerSlot: React.FC<PlayerSlotProps> = ({ player, onJoin, onToggleReady, currentUserId }) => {
  if (player) {
    const isYou = player.pid === currentUserId;
    return (
      <div
        className={`h-16 flex items-center justify-center border rounded-lg
        ${player.ready ? "bg-green-600/60 border-green-500" : "bg-gray-800/50 border-gray-700"}`}
      >
        <span className="text-white text-lg truncate px-4">
          {isYou ? "You" : player.pid}
        </span>

        {isYou && (
          <button
            onClick={onToggleReady}
            className="ml-4 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-sm"
          >
            {player.ready ? "Unready" : "Ready"}
          </button>
        )}
      </div>
    );
  }

  return (
    <button 
      onClick={onJoin}
      className="h-16 flex items-center justify-center bg-transparent border-2 border-dashed border-gray-600 rounded-lg
      text-gray-500 hover:bg-gray-700/50 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-300"
    >
      + Join Slot
    </button>
  );
};

const RoomPage: React.FC = () => {
  const SLOT_COUNT = 4 // In the future need to integrate with room creation options
  const [teamA, setTeamA] = useState<( { pid: string, ready: boolean } | null )[]>(Array(SLOT_COUNT).fill(null));
  const [teamB, setTeamB] = useState<( { pid: string, ready: boolean } | null )[]>(Array(SLOT_COUNT).fill(null));
  const [owner, setOwner] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [roomSettings, setRoomSettings] = useState<RoomSettings | null>(null);

  const [isLoading,  setIsLoading] = useState(true);

  //getting firebase user
  const { user, loading } = useUser()
  
  useEffect(() => {
    if(!user && !loading) navigate("/login");
  })
  
  // Placeholder for the current user's ID
  const currentUserName = user?.displayName || user?.email || "Anon";

  const handleToggleReady = (team: 'A' | 'B', slotIndex: number) => {
    socket.emit("toggleReady", { roomId, team, slotIndex, username: currentUserName });
  };

  // Get Room Settings from firebase
  useEffect(() => {
    const fetchSettings = async () => {
      const roomDoc = await getDoc(doc(db, "rooms", roomId!));
      if (roomDoc.exists()) {
        setRoomSettings(roomDoc.data() as RoomSettings);
        setIsLoading(false);
      } else {
        navigate("/404"); // if room does not exist
      }
    }
    fetchSettings();
  }, [roomId])

  useEffect(() => {
    if(!currentUserName) return;

    socket.emit("joinRoom", {roomId, username: currentUserName, SLOT_COUNT});

    socket.on("roomUpdate", (room) => {
      setTeamA(room.teamA);
      setTeamB(room.teamB);
      setOwner(room.owner);
      setIsPublic(room.public);
    });

    // Finds team associated with the current user and navigates to problemset of that team
    socket.on("navigateToProblemset", ({roomId, room}) => {
      console.log("🔥 navigateToProblemset event received:", roomId, room);
      const team = room.teamA.some((p: { pid: string; ready: boolean } | null) => p && p.pid === currentUserName) ? "A" : "B";
      console.log("➡️ Determined team:", team, "for user:", currentUserName);
      navigate(`/room/${roomId}/problemset/team/${team}`);
    })

    return () => {
      socket.off("roomUpdate");
      socket.off("navigateToProblemset");
    }

  }, [roomId, currentUserName]);

  const handleJoinSlot = (team: 'A' | 'B', slotIndex: number) => {
    socket.emit("joinSlot", {
      roomId,
      team,
      slotIndex,
      username: currentUserName,
      SLOT_COUNT
    });

  };

  const handleTogglePrivacy = async () => {

    if (owner == currentUserName) {
      socket.emit("togglePrivacy", {isPublic, roomId});
    }
  };

  const handleStart = async () => {

    if (!roomSettings) return; // Cannot start without room settings

    const q = query(
      collection(db, "ProblemsWithHTC"),
      where("difficulty", "==", roomSettings.difficulty),
    ); // Get questions with difficulty

    const querySnapshot = await getDocs(q);
    const allProblems = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Randomize list of problems and select first n questions
    const shuffledProblems = allProblems.sort(() => Math.random() - 0.5);
    const selectedProblems = shuffledProblems.slice(0, roomSettings.questions);

    const formatPlayers = (teamArr: ({ pid: string; ready: boolean } | null)[]) =>
      teamArr
        .filter((player): player is { pid: string; ready: boolean } => player !== null)
        .map((player) => ({
          pid: player.pid,
          problemsSolved: 0,
          points: 0,
        }));

    const teamAData = formatPlayers(teamA);
    const teamBData = formatPlayers(teamB);

    await setDoc(doc(db, "RoomSet", roomId!), {
      winningTeam: null,
      teamA: {
        name: "Team A",
        score: 0,
        players: teamAData,
        solvedProblems: [],
      },
      teamB: {
        name: "Team B",
        score: 0,
        players: teamBData,
        solvedProblems: [],
      },
      allProblems: selectedProblems,
      startedAt: new Date(),
    });

    socket.emit("startGame", { roomId, username: currentUserName, time: roomSettings.time })
  }

  if (isLoading) {
    return <LoadingScreen message='Setting Up' />;
  }

  return (
    <div className='bg-gray-900 flex justify-center items-center h-dvh w-dvw relative' > {/* Added relative */}
      <div className="z-10 flex flex-col p-8 max-w-5xl w-full
        bg-black/30 backdrop-blur-md 
        border border-cyan-400/20 rounded-xl
        shadow-2xl shadow-cyan-500/10">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <div>
            <h2 className="text-4xl font-bold text-cyan-300" style={{ textShadow: `0 0 8px #0ff` }}>Room Lobby</h2>
            <p className="text-purple-300">Room Code: <span className="font-bold text-white tracking-widest">{ roomId }</span></p>
            {owner && <div className="flex items-center gap-3 mt-3">
                <button
                    id="privacy-toggle"
                    onClick={handleTogglePrivacy}
                    disabled={owner !== currentUserName}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${isPublic ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                    <span className="sr-only">Toggle Room Privacy</span>
                    <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${isPublic ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                </button>
                <label htmlFor="privacy-toggle" className={`text-sm font-medium select-none ${isPublic ? 'text-green-400' : 'text-red-400'}`}>
                    Room is {isPublic ? 'Public' : 'Private'}
                </label>
            </div>}
            {roomSettings && (
              <div className="mt-3 text-cyan-400 text-sm">
                <p>Difficulty: <span className="text-white">{roomSettings.difficulty}</span></p>
                <p>Questions: <span className="text-white">{roomSettings.questions}</span></p>
                <p>Time: <span className="text-white">{roomSettings.time} min</span></p>
              </div>
            )}
        </div>
        <button onClick={() => {
          socket.emit("disconnectRoom", {username: currentUserName, roomId});
          navigate("/MultiPlayer")
        }} 
        className="text-red-400 hover:text-white transition-colors duration-300 text-lg flex items-center gap-2">
          Leave Room
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
      </div>

      {/* Teams Layout */}
      <div className="w-full grid grid-cols-2 gap-8 mb-6">
        {/* Team A */}
        <div>
          <h3 className="text-2xl font-bold text-cyan-400 mb-4 text-center">Team A</h3>
          <div className="flex flex-col gap-4">
            {teamA.map((player, index) => (
              <PlayerSlot 
                key={index} 
                player={player} 
                onJoin={() => handleJoinSlot("A", index)} 
                onToggleReady={() => handleToggleReady("A", index)} 
                currentUserId={currentUserName}
              />
            ))}
          </div>
        </div>
        
        {/* Team B */}
        <div>
          <h3 className="text-2xl font-bold text-purple-400 mb-4 text-center">Team B</h3>
           <div className="flex flex-col gap-4">
            {teamB.map((player, index) => (
              <PlayerSlot 
                key={index} 
                player={player} 
                onJoin={() => handleJoinSlot("B", index)}  
                onToggleReady={() => handleToggleReady("B", index)} 
                currentUserId={currentUserName}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Start Game Button */}
      {owner === currentUserName && (
        <button className="w-full max-w-xs mx-auto font-bold text-gray-900 bg-green-400 border-2 border-green-400 rounded-lg py-3 text-xl
          transition-all duration-300 transform hover:scale-105
          hover:bg-transparent hover:text-green-300
          hover:shadow-[0_0_20px_rgba(74,222,128,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={
            !teamA.some(p => p) || !teamB.some(p => p) || 
            [...teamA, ...teamB].filter(Boolean).some(p => !p!.ready)
          }
          onClick={handleStart}
        >
          Start Game
        </button>

      )}

    </div>
      
  
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-21 h-21 rounded-full 
          bg-gray-900/80 backdrop-blur-sm border border-cyan-500/30
          hover:border-cyan-400 transition-all duration-300
          shadow-lg hover:shadow-cyan-500/25
          group z-[60]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full 
          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-purple-500 rounded-full opacity-0 
          group-hover:opacity-30 animate-pulse blur-md" />
        <img 
          src="/chat.png" 
          alt="Chat" 
          className="w-15 h-15 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
            group-hover:scale-110 transition-transform duration-300"
        />
      </button>

    
      {isChatOpen && (
        <div className="fixed bottom-20 right-6 w-96 h-[36rem] z-[60]">
          <ChatBox onClose={() => setIsChatOpen(false)} />
        </div>
      )}
    
    </div>
    
  );
};

export default RoomPage;