import React, { useEffect, useRef, useState, useMemo } from 'react';
import Editor from '@monaco-editor/react'
import { editor } from 'monaco-editor'
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { socket } from '../utils/socket';
import { useUser } from '../hooks/useUser';
import { debounce } from 'lodash';
import { OrbitProgress } from 'react-loading-indicators';
import { markTeamSolved } from './Problemset';
import { useMatchTimer } from '../hooks/useMatchTimer';
import ChatBox from './components/chat-box';
import { LANGUAGES } from '../utils/languageTemplate'
import LoadingScreen from './components/LoadingScreen';

// Problem Data schema stored in firebase
export interface ProblemData {
  constraints?: string;
  difficulty: string;
  hiddenTestCases: {
    input: string;
    output: string;
  }[];
  inputFormat?: string;
  outputFormat?: string;
  samples: {
    input: string;
    output: string;
  }[];
  statement: string;
  tags?: string[];
  title: string;
  statusA: number;
  statusB: number;
  buggyTemplateByLanguage?: Record<string, string>;
}


// Mapping monaco languageId to Judge0 languageId
const languageIdMap = {
 python: 71,
 cpp: 54,
 java: 62,
 javascript: 63,
 typescript: 74,
 go: 60,
 rust: 73
} as const;

type Language = keyof typeof languageIdMap;
const DEBUG_LANGUAGE: Language = "cpp";

const SubmissionsView: React.FC<{ roomId: string, problemId: string, teamId: string, currentUserName: string }> = ({ roomId, problemId, teamId, currentUserName }) => {
  const [details, setdetails] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null); // To toggle details
  const localKey = `subs_${roomId}_${problemId}_${teamId}`;

  const solvedMarked = useRef<Set<string>>(new Set());
  const completedIds = useRef<Set<string>>(new Set());

  const formatETA = (ms: number) => {
    if (!ms) return "Calculating...";
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `~${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `~${minutes}m`;
  };

  const fetchStatuses = async () => {
    const ids = JSON.parse(localStorage.getItem(localKey) || '[]');
    if (ids.length === 0) return;

    const pendingIds = ids.filter((id : string) => !completedIds.current.has(id));

    if (pendingIds.length === 0) return;

    try {
      const results = await Promise.all(
        pendingIds.map(async (id: string) => {
          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/status/${id}`);
          const data = await res.json();

          // If the status is completed, add it to our ref so we stop polling it
          if (data.status === 'Completed') {
            completedIds.current.add(id); 

            if (data.ac && !solvedMarked.current.has(id)) {
              console.log(`Submission ${id} Accepted! Marking problem as solved.`);
              markTeamSolved(teamId, problemId, roomId, currentUserName);
              solvedMarked.current.add(id); // Mark as handled
            }
          }

          return data;

        })
      );
      // Merge the newly fetched results with our existing state
      setdetails(prevDetails => {
        const newDetails = [...prevDetails];
        
        results.forEach(result => {
          const index = newDetails.findIndex(item => item.id === result.id);
          if (index !== -1) {
            newDetails[index] = result; // Update existing submission
          } else {
            newDetails.push(result); // Add new submission
          }
        });

        // Maintain the sort order based on localStorage (newest first)
        return newDetails.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      });
      console.log(results);
    } catch (err) {
      console.error("Polling error", err);
    }
  };

  useEffect(() => {
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 5000);
    return () => clearInterval(interval);
  }, [roomId, problemId, teamId]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-gray-950/40 custom-scrollbar">
      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
        <h3 className="text-lg font-bold text-cyan-300">My Submissions</h3>
        <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{problemId}</span>
      </div>

      {details.map((sub, i) => (
        <div key={sub.id || i} className="group flex flex-col bg-gray-900/60 rounded-lg border border-gray-800 overflow-hidden transition-all hover:border-gray-600">
          {/* Main Card Header */}
          <div className="p-4 flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                  {sub.id.slice(0, 8)}
                </span>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded uppercase border border-purple-400/20">
                  {sub.language}
                </span>
              </div>
              <div className="text-[11px] text-gray-500">
                User: <span className="text-gray-300">{currentUserName}</span>
              </div>
              <div className="text-[10px] text-gray-600 font-semibold">
                {new Date(sub.submittedAt).toLocaleTimeString()}
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className={`text-sm font-black uppercase italic tracking-tighter ${
                sub.status === 'Completed' ? (sub.ac ? 'text-green-400' : 'text-red-400') : 'text-yellow-500'
              }`}>
                {sub.status === 'Processing' ? `Queue #${sub.queuePosition}` : (sub.ac ? 'Accepted' : 'Wrong Answer')}
              </div>

              {sub.status === 'Processing' && sub.estimatedWaitTime !== undefined && (
                <div className="text-[10px] text-yellow-500/70 font-mono mt-1">
                  ETA: {formatETA(sub.estimatedWaitTime)}
                </div>
              )}
              
              {sub.status === 'Completed' && (
                <button 
                  onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                  className="mt-2 text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded hover:bg-gray-700 hover:text-white transition-colors"
                >
                  {expandedId === sub.id ? "Hide Details" : "View Results"}
                </button>
              )}
            </div>
          </div>

          {/* Expandable Results Section (The Judge.js data) */}
          {expandedId === sub.id && sub.result && (
            <div className="bg-black/40 border-t border-gray-800 p-4 space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {sub.result.map((tc: any, idx: number) => (
                  <div key={idx} className="bg-gray-900/80 p-3 rounded border border-gray-800/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">
                        Testcase {idx + 1} {tc.hidden && "(Hidden)"}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        tc.verdict === 'Accepted' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {tc.verdict}
                      </span>
                    </div>

                    {!tc.hidden ? (
                      <div className="grid grid-cols-1 gap-1 font-mono text-[10px]">
                        <div className="flex gap-2">
                          <span className="text-purple-400 w-14 shrink-0">INPUT:</span>
                          <span className="text-gray-300 break-all">{tc.input}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-purple-400 w-14 shrink-0">EXPECT:</span>
                          <span className="text-green-300 break-all">{tc.expected}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-purple-400 w-14 shrink-0">OUTPUT:</span>
                          <span className="text-white break-all">{tc.output || "(empty)"}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] italic text-gray-600">Hidden testcase details are private.</p>
                    )}

                    {tc.error && (
                      <div className="mt-2 text-[9px] text-red-400 bg-red-400/5 p-1.5 rounded border border-red-400/10">
                        Error: {tc.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar for Processing */}
          {sub.status === 'Processing' && (
            <div className="h-1 w-full bg-gray-800">
              <div className="h-full bg-cyan-500 animate-pulse" style={{ width: '100%' }}></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const Problem: React.FC = () => {

  const { problemId } = useParams<{ problemId: string }>();
  const { roomId, teamId } = useParams<{ roomId: string, teamId: string }>();

  const [data, setData] = useState<ProblemData | null>(null);
//  const [passData, setPassData] = useState<gameRes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>("python");
  const [roomMode, setRoomMode] = useState<'normal' | 'debug'>('normal');
  const [isProblemLoading, setIsProblemLoading] = useState(false);

  const { user } = useUser();
  const currentUserName = user?.displayName || user?.email || "Anon";
  const [code, setCode] = useState("");
  const [opponents, setOpponents] = useState<any[]>([]);

  const [submitCooldown, setSubmitCooldown] = useState(0);

  // Generate unique localStorage key for this problem
  const storageKey = `code_${roomId}_${problemId}_${teamId}_${language}`;

  const navigate = useNavigate();

  const { timeLeft, isMatchOver, submissionsLocked } = useMatchTimer(roomId);

  useEffect(() => {
    if (submitCooldown > 0) {
      const timer = setTimeout(() => setSubmitCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [submitCooldown]);

  	const handleLangChange = (event: any) => {
      if (roomMode === 'debug') return;
		const newLanguage = event.target.value as Language;
   		setLanguage(newLanguage)

		const newStorageKey = `code_${roomId}_${problemId}_${teamId}_${newLanguage}`;

		// Load saved code from localStorage on mount
		const savedCode = localStorage.getItem(newStorageKey);
		if (savedCode) {
			setCode(savedCode);
		} else {
      setCode(LANGUAGES[newLanguage].template)
		}
  	}

  // --- Collaborative Editing: Prevent remote overwrite of local typing ---
  const isLocalChange = useRef(false);
  const sendChange = useMemo(() =>
   debounce((newValue: string) => {
    socket?.emit("editorChange", { roomId, teamId, problemId, code: newValue, source: currentUserName, language });
    isLocalChange.current = false; // After sending, reset
   }, 1000),
   [socket, roomId, teamId, problemId, currentUserName, language]
  );

  function handleEditorChange(newValue: string | undefined) {
   const codeValue = newValue || "";
   setCode(codeValue);
   // Save to localStorage for persistence on refresh
   localStorage.setItem(storageKey, codeValue);
   isLocalChange.current = true;
   sendChange(codeValue);
  }

  // Lock Screen
  useEffect(() => {
    const enterFullscreen = async () => {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        if (!localStorage.getItem(`${roomId}-${teamId}`)) {
          localStorage.setItem(`${roomId}-${teamId}`, "not warned");
        }
      }
    };

    enterFullscreen();
  }, []);

  useEffect(() => {
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          if (localStorage.getItem(`${roomId}-${teamId}`) === "not warned") {
            localStorage.setItem(`${roomId}-${teamId}`, "warned");
            alert("You exited fullscreen. This is your First and Last Warning.");
            navigate(`/room/${roomId}/problemset/team/${teamId}`)
          } else {
            applyPenalty();
            alert("You exited fullscreen after a warning. Insuring a penalty.");
            navigate(`/room/${roomId}/problemset/team/${teamId}`)
          }
        }
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);

      return () => {
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
      };
    }, [roomId, teamId, currentUserName]);


  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
          if (localStorage.getItem(`${roomId}-${teamId}`) === "not warned") {
            localStorage.setItem(`${roomId}-${teamId}`, "warned");
            alert("You switched tabs. This is your First and Last Warning.");
            navigate(`/room/${roomId}/problemset/team/${teamId}`)
          } else {
            applyPenalty();
            alert("You switched tabs after a warning. Insuring a penalty.");
            navigate(`/room/${roomId}/problemset/team/${teamId}`)
          }
        }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [roomId, teamId, currentUserName]);

  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    const preventCopy = (e: ClipboardEvent) => e.preventDefault();

    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("copy", preventCopy);

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("copy", preventCopy);
    };
  }, []);

  const applyPenalty = async () => {
    if (!roomId || !teamId || !currentUserName) return;

    try {
      const roomRef = doc(db, "RoomSet", roomId);
      const roomSnap = await getDoc(roomRef);

      if (roomSnap.exists()) {
        // --- 1v1 MODE LOGIC ---
        const roomData = roomSnap.data();
        // Assuming teamId is 'A' or 'B'. Adjust if your teamId is the full string 'teamA'/'teamB'
        const teamKey = teamId === 'A' ? 'teamA' : (teamId === 'B' ? 'teamB' : teamId); 
        
        const players = roomData[teamKey]?.players || [];
        const playerIndex = players.findIndex((p: any) => p.pid === currentUserName);

        if (playerIndex !== -1) {
          // Deduct 10 from the specific player
          players[playerIndex].points -= 10;
          
          // Update both the team score and the player array in Firestore
          await updateDoc(roomRef, {
            [`${teamKey}.score`]: increment(-10),
            [`${teamKey}.players`]: players
          });
          
          console.log(`Penalty applied! -10 points to ${currentUserName} and ${teamKey}`);
        }

      } else {
        // --- FFA MODE LOGIC ---
        const teamRef = doc(db, "Teams", teamId);
        const teamSnap = await getDoc(teamRef);
        
        if (teamSnap.exists()) {
          await updateDoc(teamRef, {
            score: increment(-10)
          });

          console.log(`FFA Penalty applied! -10 points to team ${teamId}`);
        }
      }
    } catch (err) {
      console.error("Failed to apply penalty:", err);
    }
  }

  // Fetch problem data & opponents (MODE-AWARE)
  useEffect(() => {
    if (!roomId || !problemId) return;

    const loadProblemAndOpponents = async () => {
      setIsProblemLoading(true);
      // 1. Fetch Problem Data
      const roomRef = doc(db, "RoomSet", roomId);
      const roomSnap = await getDoc(roomRef);
      const isRoom = roomSnap.exists();

      const mode = isRoom && roomSnap.data().mode === 'debug' ? 'debug' : 'normal';
      setRoomMode(mode);

      const effectiveLanguage: Language = mode === 'debug' ? DEBUG_LANGUAGE : language;
      const collectionName = mode === 'debug' ? 'DebugProblems' : 'ProblemsWithHTC';
      
      const probRef = doc(db, collectionName, problemId);
      const probSnap = await getDoc(probRef);
      if(probSnap.exists()) setData(probSnap.data() as ProblemData);

      // Load initial code
      const modeStorageKey = `code_${roomId}_${problemId}_${teamId}_${effectiveLanguage}`;
      const savedCode = localStorage.getItem(modeStorageKey);
      if (savedCode) setCode(savedCode);
      else setCode(LANGUAGES[effectiveLanguage].template);

      // 2. Fetch Opponents for Header
      try {
        if (isRoom) {
          // Legacy 1v1
          const rsData = roomSnap.data();
          const oppTeamKey = teamId === 'A' ? 'teamB' : 'teamA';
          setOpponents(rsData[oppTeamKey]?.players || []);
        } else {
          // FFA Mode
          const teamsQuery = query(collection(db, "Teams"), where("contestId", "==", roomId));
          const teamsSnap = await getDocs(teamsQuery);
          const otherTeams: any[] = [];
          
          teamsSnap.forEach(doc => {
            if (doc.id !== teamId) otherTeams.push({ id: doc.id, ...doc.data() });
          });
          
          otherTeams.sort((a, b) => (b.score || 0) - (a.score || 0));
          setOpponents(otherTeams.slice(0, 3).map(t => ({ pid: t.name, rating: `Score: ${t.score || 0}` })));
        }
      } catch (err) {
        console.error("Failed to fetch opponents:", err);
      }
      setIsProblemLoading(false);
    };

    loadProblemAndOpponents();
  }, [roomId, problemId, teamId, language]);

  // Socket Connection
  useEffect(() => {

    if(!roomId || !problemId) return;

    socket.emit("joinProblemRoom", { roomId, teamId, problemId, username: currentUserName, language });

    return () => {
      socket.emit("leaveProblemRoom", { roomId, teamId, problemId, language });
    }

  }, [roomId, problemId, currentUserName, language]);

  useEffect(() => {
    if(!socket) return;

    const handleMatchEnd = (data: {reason: string}) => {
      console.log(`Match ended. Reason: ${data.reason}`);

      localStorage.removeItem(`subs_${roomId}_${problemId}_${teamId}`);

      navigate(`/room/${roomId}/results`);
    }

    const handleExtraction = () => {
      navigate(`/feedback/${roomId}`);
    }

    socket.on("matchEnd", handleMatchEnd);
    socket.on("squadExtracted", handleExtraction);

    return () => {
      socket.off("matchEnd", handleMatchEnd);
      socket.off("squadExtracted", handleExtraction);
    }
  }, [socket, roomId])

  // Listening changes on editor (ignore remote if local typing)
  useEffect(() => {
    if (!socket) return;

    const handleRemoteChange = (data: { code: string; source: string }) => {
      if (data.source === currentUserName) return;
      if (isLocalChange.current) return; // Don't overwrite local typing

      const editor = editorRef.current;
      const model = editor?.getModel();
      if (model && model.getValue() !== data.code) {
       const fullRange = model.getFullModelRange();
       model.pushEditOperations([], [{ range: fullRange, text: data.code }], () => null);
       // Also update localStorage when receiving remote changes
       localStorage.setItem(storageKey, data.code);
       setCode(data.code);
      }
    };

    socket.on("editorUpdate", handleRemoteChange);

    return () => {
      socket.off("editorUpdate", handleRemoteChange);
    };
  }, [socket, currentUserName, storageKey]);

  // Flush debounce on unmount to avoid losing unsent changes
  useEffect(() => {
   return () => {
    sendChange.flush && sendChange.flush();
   };
  }, [sendChange]);

  // Clear localStorage when navigating back to problemset or when component unmounts
  useEffect(() => {
   return () => {
    // Optional: Clear code on unmount (comment out if you want to keep code even after navigation)
    // localStorage.removeItem(storageKey);
   };
  }, [storageKey]);

  // async function getDocumentData(collectionName: string, documentId: string) {
  //   const docRef = doc(db, collectionName, documentId);
  //   const docSnap = await getDoc(docRef);
  //   if(docSnap.exists()) {
  //     const problemData = docSnap.data() as ProblemData;
  //     setData(problemData);
  //     return problemData;
  //   } else {
  //     console.log("GAY"); // This should not be removed from the code(or else)
  //     return null;
  //   }
  // }

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    function handleEditorDidMount(editorInstance: editor.IStandaloneCodeEditor) {
        editorRef.current = editorInstance;
    }

    // Handles Code Submission
    const handleSubmit = async () => {
      if (submitCooldown > 0) return;
      setIsLoading(true);
      setSubmitCooldown(10);
      const sourceCode = editorRef.current?.getValue();
      if (!sourceCode) {
        setIsLoading(false);
        return;
      }
      const normalizedCode = sourceCode.replace(/\r\n/g, "\n");

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/submit`, {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceCode: normalizedCode,
            problemId: problemId,
            language: roomMode === 'debug' ? DEBUG_LANGUAGE : language,
            userId: user?.uid || currentUserName, // Pass userId for better tracking
            roomId: roomId
          })
        });

        if (!response.ok) throw new Error('Submission failed');

        const { submissionId } = await response.json();

        // --- NEW: Save to LocalStorage ---
        const localKey = `subs_${roomId}_${problemId}_${teamId}`;
        const existingSubs = JSON.parse(localStorage.getItem(localKey) || '[]');
        localStorage.setItem(localKey, JSON.stringify([submissionId, ...existingSubs]));

        // Switch to submissions tab immediately to show progress
        setActiveTab('submissions'); 
        setIsLoading(false);

      } catch (error) {
        console.error(error);
        setIsLoading(false);
        alert("Failed to submit code. Please try again.");
      }
    };


  const [activeTab, setActiveTab] = useState<'problem' | 'chat' | 'submissions'>('problem');

  if(isProblemLoading) return <LoadingScreen message="Loading Problem" />

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex justify-between items-center px-4 py-2 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-bold text-cyan-300">{data?.title}</h2>
          
          {/* Opponents Display */}
          {opponents.length > 0 && (
            <div className="flex items-center gap-2 border-l border-gray-700/80 pl-6">
              <span className="text-xs text-gray-500 uppercase font-bold">VS</span>
              {opponents.map((opp: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5 bg-gray-800/60 px-2 py-1 rounded border border-gray-700">
                  <span className="text-sm text-purple-300">{opp.pid}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* The rest of your header stays exactly the same */}
        <div className="text-xl font-mono bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-cyan-400/20">
          <span className="text-cyan-300">Time Left: {timeLeft}</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSubmit}
            className="font-bold text-gray-900 bg-green-400 border-2 border-green-400 rounded-lg px-4 py-1.5 transition-all duration-300 hover:bg-transparent hover:text-green-300
            disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isMatchOver || submissionsLocked || submitCooldown > 0}
          >
            {submitCooldown > 0 ? `Submit (${submitCooldown}s)` : (submissionsLocked ? 'Locked' : 'Submit')}
          </button>
          <button 
            onClick={() => navigate(`/room/${roomId}/problemset/team/${teamId}`)} 
            className="text-purple-300 hover:text-white transition-colors duration-300 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to problemset
          </button>
        </div>
      </header>

   {/* Main Content */}
   <div className="flex flex-1 min-h-0">
    {/* Left Panel */}
    <div className="w-[45%] flex flex-col border-r border-gray-700/50">
     {/* Tabs */}
     <div className="shrink-0 flex border-b border-gray-700/50">
      <button
       onClick={() => setActiveTab('problem')}
       className={`px-6 py-2 text-sm font-medium transition-all duration-200 ${
        activeTab === 'problem'
         ? 'text-cyan-400 border-b-2 border-cyan-400'
         : 'text-gray-400 hover:text-cyan-300'
       }`}
      >
       Problem Statement
      </button>
      <button
       onClick={() => setActiveTab('chat')}
       className={`px-6 py-2 text-sm font-medium transition-all duration-200 ${
        activeTab === 'chat'
         ? 'text-cyan-400 border-b-2 border-cyan-400'
         : 'text-gray-400 hover:text-cyan-300'
       }`}
      >
       Team Chat
      </button>
      <button
        onClick={() => setActiveTab('submissions')}
        className={`px-6 py-2 text-sm font-medium transition-all duration-200 ${
          activeTab === 'submissions'
            ? 'text-cyan-400 border-b-2 border-cyan-400'
            : 'text-gray-400 hover:text-cyan-300'
        }`}
      >
        Submissions
      </button>
     </div>

     {/* Tab Content */}
     <div className="flex-1 min-h-0">
      {activeTab === 'problem' ? (
       <div className="h-full overflow-y-auto px-6 py-4">
        <h3 className="text-xl font-bold text-white mb-4">Problem Statement</h3>
        <p className="text-gray-300 mb-6">
         { data?.statement }
        </p>
        <h3 className="text-xl font-bold text-white mb-4">Input Format</h3>
        <p className="text-gray-300 mb-6">
         { data?.inputFormat || "Use the input shown in examples." }
        </p>
        <h3 className="text-xl font-bold text-white mb-4">Output Format</h3>
        <p className="text-gray-300 mb-6">
         { data?.outputFormat || "Print the corrected output for given input." }
        </p>
         {data?.samples.map((tc, i) => (
           <div key={i}>
           <h3 className="text-xl font-bold text-white mb-4">Example {i + 1}</h3>
             <div className="bg-gray-900/50 p-4 rounded-lg mb-6">
               <code className="text-gray-300">
               <span className="text-purple-400">Input:</span> <pre>{ tc.input }</pre> <br/>
               <span className="text-purple-400">Output:</span> <pre>{ tc.output }</pre>
               </code>
             </div>
           </div>
         ))}

        <h3 className="text-xl font-bold text-white mb-4">Constraints</h3>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
         {data?.constraints || "Follow constraints implied by statement and samples."}
        </ul>
       </div>
      ) : activeTab === 'chat' ? (
       <div className="h-full">
        <ChatBox onClose={() => setActiveTab('problem')} />
       </div>
      ) : (
        <div className="h-full">
          <SubmissionsView roomId={roomId!} problemId={problemId!} teamId={teamId!} currentUserName={currentUserName!} />
        </div>
      )}
     </div>
    </div>

    {/* Right Panel - Editor and Results */}
    <div className="flex-1 flex flex-col">
     {/* Language Select and Editor */}
     <div className="flex-1 min-h-0">
      {roomMode !== 'debug' && (
       <select 
        className="bg-gray-800 text-gray-300 p-1.5 rounded border border-gray-700 m-2" 
        value={language} 
        onChange={handleLangChange}
       >
        <option value="python">Python</option>
        <option value="cpp">C++</option>
        <option value="java">Java</option>
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="go">Golang</option>
        <option value="rust">Rust</option>
       </select>
      )}
      <div className={roomMode === 'debug' ? 'h-full' : 'h-[calc(100%-48px)]'}>
       <Editor 
        theme="vs-dark" 
        language={language} 
        value={code} 
        options={{
         minimap: { enabled: false },
         fontSize: 16,
         wordWrap: 'on',
        }}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
       />
      </div>
     </div>


    </div>
   </div>

   {/* Loading Overlay */}
   {isLoading && (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50">
     <OrbitProgress 
      color="#32cd32" 
      size="large" 
      text="Testing"
     />
    </div>
   )}
  </div>
 );
};


export default Problem;