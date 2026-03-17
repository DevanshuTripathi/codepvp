import { db } from "../../firebaseConfig";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { socket } from "../utils/socket";
import { useMatchTimer } from '../hooks/useMatchTimer';
import type { gameRes } from "./GameFinishPage";
import { useUser } from "../hooks/useUser";
import ChatBox from "./components/chat-box";

// Marks the question solved for the whole team
export const markTeamSolved = async (teamId: string, problemId: string, roomId: string, currentUserName: string) => {

  const docRef = doc(db, "RoomSet", roomId!);
  const docSnap = await getDoc(docRef);
  const data = docSnap.data()

  const problemArray = data?.allProblems || [];

  const problem = problemArray.find((p: any) => p.id === problemId);
  const teamKey = teamId === "A" ? "teamA" : "teamB";

  const solvedProblems = data?.[teamKey]?.solvedProblems || [];

  // If not already solved then add it to solved list
  if (solvedProblems.includes(problem.title)) return;
  else solvedProblems.push(problem.title);

  const currScore = data?.[teamKey].score;
  const difficulty: string = problem.difficulty;

  let points = 0;

  if (difficulty === 'Easy') {
    points = 10;
  } else if (difficulty === 'Medium') {
    points = 20;
  } else {
    points = 30
  }

  await updateDoc(docRef, {
    [`${teamKey}.solvedProblems`]: solvedProblems,
    [`${teamKey}.score`]: currScore + points
  });

    const players: {
      pid: string;
      points: number;
      problemSolved: number;
    }[] = docSnap.data()?.[teamKey].players || [];

    const playerIndex = players.findIndex(
      (p) => p.pid === currentUserName
    );

    if (playerIndex !== -1) {
      const updatedPlayers = [...data?.[teamKey].players];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        points: updatedPlayers[playerIndex].points + points,
        problemsSolved: updatedPlayers[playerIndex].problemsSolved + 1,
      };

      await updateDoc(docRef, { // Update the players array
        [`${teamKey}.players`]: updatedPlayers,
      });
    }
}

const StatusIcon: React.FC<{ solved: boolean }> = ({ solved }) => {
  if (solved) {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span>Solved</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>
      <span>Pending</span>
    </div>
  );
};

export default function Problemset() {
  const [data, setData] = useState<gameRes | null>(null);
  const [isRoomSetMissing, setIsRoomSetMissing] = useState(false);
  const [teamAFinished, setTeamAFinished] = useState(false);
  const [teamBFinished, setTeamBFinished] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { teamId, roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { timeLeft, isMatchOver } = useMatchTimer(roomId);
  const { user, loading } = useUser();
  const [currentUserName, setCurrentUserName] = useState( user?.displayName || user?.email || "Anon")
  const isSpectator = searchParams.get("spectator") === "1";

  useEffect(() => {
    if(!user && !loading) navigate("/login");
  })

  // After match is Over navigate to results page
  useEffect(() => {
      if (isMatchOver) {
          console.log("Match ended. Auto-submitting code...");
          navigate(`/room/${roomId}/results`)
      }
  }, [isMatchOver]);

  useEffect(() => {
    if (!roomId || !teamId) return;
    
    const fetchData = async () => {
      const docRef = doc(db, "RoomSet", roomId!);
      const docSnap = await getDoc(docRef);

      // Redirects to 404 if room not created earlier
      if (!docSnap.exists()) {
        if (isSpectator) {
          setIsRoomSetMissing(true);
          return;
        }
        navigate("/404");
        return;
      }

      setIsRoomSetMissing(false);

      setCurrentUserName(user?.displayName || user?.email || "Anon");

      const teamKey = teamId == "A" ? "teamA" : "teamB";

        const players: {
          pid: string;
          points: number;
          problemSolved: number;
        }[] = docSnap.data()?.[teamKey].players || [];

        let pIdx = -1

        pIdx = players.findIndex(
          (p) => p.pid === currentUserName
        );

        console.log(pIdx)
        console.log(currentUserName)

        // if (pIdx == -1) navigate("/404");

      setData(docSnap.data() as gameRes)
      
      }

    fetchData();
  }, [roomId, teamId, navigate, isSpectator, user]);

  useEffect(() => {
    socket.emit("joinProblemset", { roomId, teamId });
  }, [roomId, teamId]);

  useEffect(() => {
    const handleSolvedProblem = ({  problemId, teamId, username }: { problemId: string, teamId: string, username: string }) => {
      if (isSpectator) return;
      markTeamSolved(teamId, problemId, roomId!, username);
    };
    
    const handleTeamFinished = ({ teamId }: { teamId: string }) => {
      if (teamId === 'A') {
        setTeamAFinished(true);
      } else if (teamId === 'B') {
        setTeamBFinished(true);
      }
    };

    socket.on("solvedProblem", handleSolvedProblem);
    socket.on("teamFinishedUpdate", handleTeamFinished);

    return () => {
      socket.off("solvedProblem", handleSolvedProblem);
      socket.off("teamFinishedUpdate", handleTeamFinished);
    };
  }, [roomId, data, isSpectator]);

  const allProblemsSolved = useMemo(() => {
    if (!data || !teamId) return false;

    const solvedSet = new Set(
      teamId === "A" ? data.teamA.solvedProblems : data.teamB.solvedProblems
    );

    return data.allProblems.every((problem: any) => solvedSet.has(problem.title));
  }, [data, teamId, data?.teamA?.solvedProblems, data?.teamB?.solvedProblems]);


  const handleFinishGame = () => {
    if (isSpectator) return;

    if (allProblemsSolved) {
      socket.emit("finishGame", { roomId, teamId, username: currentUserName });
    }
  };

  const currentUserTeamFinished = teamId === 'A' ? teamAFinished : teamBFinished;

  if (isRoomSetMissing) {
    return (
      <div className="flex justify-center items-center bg-gray-900 h-dvh w-dvw">
        <div className="z-10 flex flex-col p-8 max-w-2xl w-full bg-black/30 backdrop-blur-md border border-cyan-400/20 rounded-xl shadow-2xl shadow-cyan-500/10 text-center">
          <h2 className="text-3xl font-bold text-cyan-300 mb-4">Match Not Started Yet</h2>
          <p className="text-gray-300 mb-6">
            Spectator view will be available once the room owner starts the game.
          </p>
          <button
            onClick={() => navigate(`/room/${roomId}`)}
            className="mx-auto font-bold text-cyan-300 border-2 border-cyan-400/50 rounded-lg px-6 py-2 transition-all duration-300 hover:bg-cyan-300 hover:text-gray-900"
          >
            Back to Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center bg-gray-900 h-dvh w-dvw">
      <div
        className="z-10 flex flex-col p-8 max-w-4xl w-full
      bg-black/30 backdrop-blur-md 
      border border-cyan-400/20 rounded-xl
      shadow-2xl shadow-cyan-500/10"
      >
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-8">
          <h2
            className="text-4xl font-bold text-cyan-300"
            style={{ textShadow: `0 0 8px #0ff` }}
          >
            Problem Set
          </h2>
          <div className="text-right">
            <p className="text-purple-300 text-lg">Time Remaining</p>
            <p className="text-white text-3xl font-bold font-mono">
              {timeLeft}
            </p>
          </div>
        </div>

        {/* Problem List */}
        <div className="w-full flex flex-col gap-4">
          {data?.allProblems.map((problem: any, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-4 bg-gray-900/40 border border-gray-700/50 rounded-lg
            hover:bg-gray-800/60 hover:border-cyan-400/50 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl text-gray-600 font-bold">
                  0{index + 1}
                </span>
                <h3 className="text-2xl text-white">{problem.title}</h3>
              </div>
              <div className="flex items-center gap-6">
                <StatusIcon
                  solved={
                    teamId === "A"
                      ? data.teamA.solvedProblems.includes(problem.title)
                      : data.teamB.solvedProblems.includes(problem.title)
                  }
                />
                <button
                  onClick={() => {
                    navigate(
                      `/room/${roomId}/problems/${problem.id}/team/${teamId}${isSpectator ? "?spectator=1" : ""}`
                    );
                  }}
                  className="font-bold text-cyan-300 border-2 border-cyan-400/50 rounded-lg px-5 py-2 
                transition-all duration-300 hover:bg-cyan-300 hover:text-gray-900"
                  disabled={isMatchOver || (!isSpectator && currentUserTeamFinished)}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center justify-center text-center">
          {allProblemsSolved && !currentUserTeamFinished && !isSpectator && (
            <button
              onClick={handleFinishGame}
              className="font-bold text-gray-900 bg-green-400 border-2 border-green-400 rounded-lg px-8 py-3 text-xl
                         transition-all duration-300 transform hover:scale-105
                         hover:bg-transparent hover:text-green-300
                         hover:shadow-[0_0_20px_rgba(74,222,128,0.5)]"
            >
              Finish Game
            </button>
          )}

          {isSpectator && (
            <p className="text-cyan-300 font-semibold">Spectator mode: read-only view</p>
          )}

          {currentUserTeamFinished && (
            <p className="text-2xl font-bold text-green-400">
              You have finished! Waiting for the match to end...
            </p>
          )}

          {((teamId === 'A' && teamBFinished) || (teamId === 'B' && teamAFinished)) && (
            <p className="mt-4 text-purple-300">
              The other team has also finished.
            </p>
          )}
        </div>
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
}
