import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { db } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import LoadingScreen from './components/LoadingScreen';

interface activeRoom {
  name: string;
  numberOfPeople: number;
  public: boolean;
  roomId: string
}

export interface RoomSettings {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  size: '1v1' | '2v2' | '3v3' | '4v4';
  questions: number;
  time: number;
}

const MultiPlayer: React.FC = () => {
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [code, setCode] = useState();
  const [activeRooms, setActiveRooms] = useState<activeRoom[]>([]);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [roomSettings, setRoomSettings] = useState<RoomSettings>({
    difficulty: 'Easy',
    size: '2v2',
    questions: 4,
    time: 15,
  });

  const navigate = useNavigate();

  const { user, loading } = useUser()
    
  useEffect(() => {
    if(!user && !loading) navigate("/login");
  })

  
  const handleCreateRoom = async () => {
    setIsCreatingRoom(true);
    const roomId = Math.floor(Math.random() * 100000) + 100000;
    // populateFirebase(roomId)
    
    try {
      // Populate Firebase with room settings
      await populateFirebase(roomId, roomSettings);
      
      // Minimum loading time for better UX (1.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to room
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("Error creating room:", error);
      setIsCreatingRoom(false);
    }
  }

  const getActiveRooms = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/rooms`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = await response.json();
      let tempArr: activeRoom[] = [];

      for (let key in json) {

        if (json[key].public != true || json[key].status != 'waiting') return;

        const teamA = json[key].teamA.filter((item: string | null) => item !== null)
        const teamB = json[key].teamB.filter((item: string | null) => item !== null)

        const count = teamA.length + teamB.length;
        tempArr.push({
          roomId: key,
          name: "my room",
          public: true,
          numberOfPeople: count
        })

      }

      setActiveRooms(tempArr);

    } catch (err) {
      console.log(err);
    }
  }

  const populateFirebase = async (roomId: number, roomSettings: RoomSettings) => {
    const docRef = doc(db, "rooms", roomId.toString())

    await setDoc(docRef, roomSettings)

    // const q = query(
    //   collection(db, "ProblemsWithHTC"),
    //   where("difficulty", "==", roomSettings.difficulty),
    //   orderBy("randomNumber"),
    //   limit(roomSettings.questions)
    // );
    // const querySnapshot = await getDocs(q);
    // const docs = querySnapshot.docs.map((doc) => ({
    //   id: doc.id,
    //   ...doc.data(),
    // }));

    // await setDoc(doc(db, "RoomSet", roomId.toString()), {
    //   winningTeam: "None",
    //   teamA: {
    //     name: "Team A",
    //     score: 0,
    //     players: [],
    //     solvedProblems: [],
    //   },
    //   teamB: {
    //     name: "Team B",
    //     score: 0,
    //     players: [],
    //     solvedProblems: [],
    //   },
    //   allProblems: docs
    // });

  }

  const handleJoin = async () => {
    setIsJoiningRoom(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    navigate(`/room/${code}`);
  }

  const handleCLickJoin = async (Id: string) => {
    setIsJoiningRoom(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    navigate(`/room/${Id}`);
  }

  const handleChange = (e : any) => {
    setCode(e.target.value);
  }

  const handleSettingChange = (setting: keyof RoomSettings, value: any) => {
    setRoomSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  }

  // Show loading screen when creating room
  if (isCreatingRoom) {
    return <LoadingScreen message="Creating Room\" />;
  }

  if (isJoiningRoom) {
    return <LoadingScreen message="Joining Room\" />;
  }

  return (
    <div className='bg-gray-900 flex justify-center items-center h-dvh w-dvw ' >
    <div className="z-10 flex flex-col items-center p-8 max-w-2xl w-full
      bg-black/30 backdrop-blur-md 
      border border-cyan-400/20 rounded-xl
      shadow-2xl shadow-cyan-500/10">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-8">
        <h2 className="text-5xl font-bold text-cyan-300" style={{ textShadow: `0 0 8px #0ff` }}>Multiplayer</h2>
        <Link to="/">
        <button className="text-purple-300 hover:text-white transition-colors duration-300 text-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Menu
        </button>
        </Link>
      </div>

      {/* Main Options */}
      <div className="w-full flex flex-col gap-6">

        {showCreateOptions ? (
            <div className="w-full flex flex-col gap-6 p-4 border border-gray-700/50 rounded-lg bg-gray-900/30 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl text-cyan-300 font-semibold">Room Settings</h3>
                <button 
                  onClick={() => setShowCreateOptions(false)} 
                  className="text-gray-400 hover:text-white text-sm"
                >
                  &larr; Back
                </button>
              </div>

              {/* Difficulty Setting */}
              <div className="flex flex-col gap-2">
                <label className="text-cyan-400 font-medium">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => handleSettingChange('difficulty', level)}
                      className={`font-bold rounded-lg py-2 text-center transition-all duration-300 ${
                        roomSettings.difficulty === level
                          ? 'bg-cyan-300 text-gray-900 shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                          : 'bg-gray-800/60 text-cyan-300 border border-cyan-400/20 hover:bg-cyan-900/40'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room Size Setting */}
              <div className="flex flex-col gap-2">
                <label className="text-cyan-400 font-medium">Room Size</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['1v1', '2v2', '3v3', '4v4'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSettingChange('size', size)}
                      className={`font-bold rounded-lg py-2 text-center transition-all duration-300 ${
                        roomSettings.size === size
                          ? 'bg-cyan-300 text-gray-900 shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                          : 'bg-gray-800/60 text-cyan-300 border border-cyan-400/20 hover:bg-cyan-900/40'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Number of Questions Setting */}
              <div className="flex flex-col gap-2">
                <label className="text-cyan-400 font-medium flex justify-between">
                  <span>Number of Questions</span>
                  <span className="font-bold text-cyan-200">{roomSettings.questions}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={roomSettings.questions}
                  onChange={(e) => handleSettingChange('questions', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb"
                />
              </div>

              {/* Time per Question Setting */}
              <div className="flex flex-col gap-2">
                <label className="text-cyan-400 font-medium flex justify-between">
                  <span>Time</span>
                  <span className="font-bold text-cyan-200">{roomSettings.time} min</span>
                </label>
                <input
                  type="range"
                  min="2"
                  max="60"
                  step="5"
                  value={roomSettings.time}
                  onChange={(e) => handleSettingChange('time', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb"
                />
              </div>
              
              {/* Final Create Button */}
              <button 
                onClick={handleCreateRoom}
                className="w-full font-bold text-gray-900 bg-purple-400 border-2 border-purple-400 rounded-lg py-3 text-xl
                transition-all duration-300 
                hover:bg-transparent hover:text-purple-300
                hover:shadow-[0_0_20px_rgba(192,132,252,0.5)]"
              >
                Confirm & Create Room
              </button>
            </div>
          ) : (
            <>
        <button 
          onClick={() => setShowCreateOptions(true)}
          className="w-full font-bold text-gray-900 bg-cyan-300 border-2 border-cyan-300 rounded-lg py-4 text-2xl
          transition-all duration-300 transform hover:scale-105
          hover:bg-transparent hover:text-cyan-300
          hover:shadow-[0_0_20px_rgba(56,189,248,0.7)]"
        >
          Create Room
        </button>

        {!showJoinInput && (
          <button 
            onClick={() => {
              setShowJoinInput(true);
              getActiveRooms();
            }}
            className="w-full font-bold text-cyan-300 bg-transparent border-2 border-cyan-400/50 rounded-lg py-4 text-2xl
            transition-all duration-300 transform hover:scale-105
            hover:bg-cyan-300 hover:text-gray-900
            hover:shadow-[0_0_20px_rgba(56,189,248,0.7)]"
          >
            Join Room
          </button>
        )}
        </>
      )}

        {/* Conditional Input for Joining a Room */}
        {showJoinInput && !showCreateOptions && (
          <div className="w-full flex flex-col gap-4 p-4 border border-gray-700/50 rounded-lg bg-gray-900/30">

            <h3 className="text-xl text-cyan-300 font-semibold text-center">Join an Active Room</h3>
            <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-2">
              { activeRooms.map((room) => (
                <div 
                  key={room.roomId}
                  className='flex justify-between items-center bg-gray-800/60 border border-cyan-400/20 rounded-lg p-3 transition-all duration-300 hover:bg-cyan-900/40 hover:border-cyan-400/60'
                >
                  <div>
                    <p className='text-lg text-cyan-200 font-bold tracking-wider'>{ room.roomId }</p>
                    <p className='text-sm text-cyan-500' >{ room.numberOfPeople }/8 Players</p>
                  </div>
                  <button onClick={() => {
                    handleCLickJoin(room.roomId.toString());

                  }} 
                  className='bg-cyan-400/80 text-gray-900 font-bold py-1 px-4 text-sm rounded-md cursor-pointer '
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-600/50"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                <div className="flex-grow border-t border-gray-600/50"></div>
            </div>

            <input 
              type="text" 
              value={code}
              onChange={handleChange}
              className="w-full bg-gray-900/50 border-2 border-gray-700/50 rounded-lg px-4 py-3 text-white text-center text-xl tracking-[.2em]
              focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-300"
              placeholder="ENTER ROOM CODE"
            />
            <button 
              onClick={handleJoin}
              className="w-full font-bold text-gray-900 bg-purple-400 border-2 border-purple-400 rounded-lg py-3 text-xl
              transition-all duration-300 
              hover:bg-transparent hover:text-purple-300
              hover:shadow-[0_0_20px_rgba(192,132,252,0.5)]"
            >
              Join Now
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default MultiPlayer;