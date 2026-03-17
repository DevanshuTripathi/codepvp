import React, { useEffect, useRef, useState, useMemo } from 'react';
import Editor from '@monaco-editor/react'
import { editor } from 'monaco-editor'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc} from 'firebase/firestore';
import { socket } from '../utils/socket';
import { useUser } from '../hooks/useUser';
import { debounce } from 'lodash';
import { OrbitProgress } from 'react-loading-indicators';
import { markTeamSolved } from './Problemset';
import { useMatchTimer } from '../hooks/useMatchTimer';
import ChatBox from './components/chat-box';
import { LANGUAGES } from '../utils/languageTemplate'

// Problem Data schema stored in firebase
export interface ProblemData {
  constraints: string;
  difficulty: string;
  hiddenTestCases: {
    input: string;
    output: string;
  }[];
  inputFormat: string;
  outputFormat: string;
  samples: {
    input: string;
    output: string;
  }[];
  statement: string;
  tags: string[];
  title: string;
  statusA: number;
  statusB: number;
}

// Testcase interface for validating test cases
interface TestCases {
 input: string;
 expected: string;
 output: string;
 hidden: boolean;
 verdict: string;
 error: boolean;
 errorMessage: string;
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

const Problem: React.FC = () => {

  const { problemId } = useParams<{ problemId: string }>();
  const { roomId, teamId } = useParams<{ roomId: string, teamId: string }>();
  const [searchParams] = useSearchParams();

  const [data, setData] = useState<ProblemData | null>(null);
//  const [passData, setPassData] = useState<gameRes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>("python");

  const { user } = useUser();
  const currentUserName = user?.displayName || user?.email || "Anon";

  const [code, setCode] = useState("");

  const [testResults, setTestResults] = useState<TestCases[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const testResultsRef = useRef<HTMLDivElement | null>(null);

  // Generate unique localStorage key for this problem
  const storageKey = `code_${roomId}_${problemId}_${teamId}_${language}`;

  const navigate = useNavigate();
  const isSpectator = searchParams.get("spectator") === "1";

  const { timeLeft, isMatchOver } = useMatchTimer(roomId);
//   const hasAutoSubmitted = useRef(false);

  	const handleLangChange = (event: any) => {
		const newLanguage = event.target.value as Language;
   		setLanguage(newLanguage)

		const newStorageKey = `code_${roomId}_${problemId}_${teamId}_${newLanguage}`;

		// Load saved code from localStorage on mount
		const savedCode = localStorage.getItem(newStorageKey);
		if (savedCode) {
			setCode(savedCode);
		} else {
			setCode(LANGUAGES[language].template)
		}
  	}

    // Function to mark points for a solved question for a team
    // const markPoints = async (roomId: string, teamId: string, problemId: string, passed: number) => {
    //   const docRef = doc(db, "RoomSet", roomId!);
    //   const docSnap = await getDoc(docRef);
    //   const docData = docSnap.data();
      
    //   const teamKey = teamId == "A" ? "teamA" : "teamB"; // Get Team
    //   const statusKey = teamId == "A" ? "statusA" : "statusB";
    //   const problemArray = docData?.allProblems || [];
    //   const problem = problemArray.find((p: any) => p.id === problemId); // Get Problem solved

    //   // If problem already marked as solved then dont consider it
    //   if (docData?.[teamKey].solvedProblems.includes(problem.title)) return ;

    //   const pointsAwarded = 10 * passed;
    //   if (problem[statusKey] >= pointsAwarded) return;

    //   // Need a better way to award points because this is exploitable
    //   const currentScore = docData?.[teamKey].score;

    //   await updateDoc(docRef, {
    //     [`${teamKey}.score`]: currentScore + (pointsAwarded - problem[statusKey]),
    //   });

    //   const players: {
    //       pid: string;
    //       points: number;
    //       problemSolved: number;
    //     }[] = docSnap.data()?.[teamKey].players || [];

    //   const playerIndex = players.findIndex(
    //     (p) => p.pid === currentUserName
    //   );

    //   if (playerIndex !== -1) {
    //     const updatedPlayers = [...docData?.[teamKey].players];
    //     updatedPlayers[playerIndex] = {
    //       ...updatedPlayers[playerIndex],
    //       points: updatedPlayers[playerIndex].points + (pointsAwarded - problem[statusKey]),
    //       problemsSolved: updatedPlayers[playerIndex].problemsSolved,
    //     };

    //     await updateDoc(docRef, { // Update the players array
    //       [`${teamKey}.players`]: updatedPlayers,
    //     });
    //   }

    // }

//   useEffect(() => {
//     if (isMatchOver && !hasAutoSubmitted.current) {
//       console.log("Match ended. Auto-submitting code...");
//       Run(); 
//       hasAutoSubmitted.current = true;
//     }
//   }, [isMatchOver]);


  // --- Collaborative Editing: Prevent remote overwrite of local typing ---
  const isLocalChange = useRef(false);
  const sendChange = useMemo(() =>
   debounce((newValue: string) => {
    if (isSpectator) return;
    socket?.emit("editorChange", { roomId, teamId, problemId, code: newValue, source: currentUserName });
    isLocalChange.current = false; // After sending, reset
   }, 1000),
     [socket, roomId, teamId, problemId, currentUserName, isSpectator]
  );

  function handleEditorChange(newValue: string | undefined) {
     if (isSpectator) return;
   const codeValue = newValue || "";
   setCode(codeValue);
   // Save to localStorage for persistence on refresh
   localStorage.setItem(storageKey, codeValue);
   isLocalChange.current = true;
   sendChange(codeValue);
  }

  // LOck Screen
  useEffect(() => {
    const enterFullscreen = async () => {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    };

    enterFullscreen();
  }, []);

  useEffect(() => {
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          alert("You exited fullscreen. Match will end.");
        }
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);

      return () => {
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
      };
    }, [roomId, teamId]);


  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert("You switched tabs. Match will end.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [roomId, teamId]);

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



  // Fetch problem data
  useEffect(() => {
    if (!problemId) return;
    getDocumentData("ProblemsWithHTC", problemId);
    
    // Load saved code from localStorage on mount
    const savedCode = localStorage.getItem(storageKey);
    if (savedCode) {
      setCode(savedCode);
    } else {
		setCode(LANGUAGES[language].template)
	}
  }, [problemId, language]);

  // Socket Connection
  useEffect(() => {

    if(!roomId || !problemId) return;

    socket.emit("joinProblemRoom", { roomId, teamId, problemId, username: currentUserName, spectator: isSpectator });

  }, [roomId, problemId, currentUserName, isSpectator]);

  // Listening changes on editor (ignore remote if local typing)
  useEffect(() => {
    if (!socket) return;

    const handleRemoteChange = (data: { code: string; source: string }) => {
      if (isSpectator && data.source === currentUserName) return;
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
  }, [socket, currentUserName, storageKey, isSpectator]);

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

  async function getDocumentData(collectionName: string, documentId: string) {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()) {
      setData(docSnap.data() as ProblemData);
      console.log(docSnap.data());
    } else {
      console.log("GAY"); // This should not be removed from the code(or else)
    }
  }

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    function handleEditorDidMount(editorInstance: editor.IStandaloneCodeEditor) {
        editorRef.current = editorInstance;
    }

    // Handles Code Submission
    const handleSubmit = async () => {
      if (isSpectator) return;
      setIsLoading(true);
      const sourceCode = editorRef.current?.getValue();
      if(sourceCode === ""){ 
        setIsLoading(false)
        return
      }
      const normalizedCode = sourceCode?.replace(/\r\n/g, "\n") || "";

      try {

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/submit`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceCode: normalizedCode,
            problemId: problemId,
            language: language,
          })
        })

        if (!response.ok) {
          throw new Error('Response is not ok')
        }

        const data = await response.json();
        setTestResults([...data.result])

        // Mark Points here
		if (data.ac) {
      if (!isSpectator) {
			markTeamSolved(teamId!, problemId!, roomId!, currentUserName)
      }
		}

        setIsLoading(false);

      } catch (error) {
        console.error(error)
      }
    }

  /* 
   Called after problem is submitted to Judge0 and tokens are recieved
   Checks status of all the problems submitted
   Calls markPoints or markTeamSolved based on testcase validation 
  */
//   const checkStatus = async (tokens: string[], tempRes: TestCases[]) => {
//    const tokenQuery = tokens.join(",")
//    const baseUrl = import.meta.env.VITE_JUDGE0_URL + `/submissions/batch?tokens=${tokenQuery}&base64_encoded=true&fields=*`;
//    const options = {
//     method: 'GET',
//     headers: {
//      // 'X-RapidAPI-Key': import.meta.env.VITE_RAPID_API_KEY as string,
//      // 'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
//      "Cache-Control": "no-cache",
//      "Pragma": "no-cache",
//     },
//    };

//    try {
//     let allDone = false;
//     let results: any[] = [];

//     while (!allDone) {
//      const url = `${baseUrl}&_=${Date.now()}`;
//      let response = await fetch(url, options);
//      if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//      }

//      let data = await response.json();
//      results = data.submissions || data;

//      // Guard: remove nulls
//      results = results.filter((res: any) => res !== null);

//      // If we still have missing results, keep polling
//      allDone =
//       results.length === tokens.length &&
//       results.every(
//        (res: any) => res.status?.id !== 1 && res.status?.id !== 2
//       );

//      if (!allDone) {
//       await new Promise((resolve) => setTimeout(resolve, 2000));
//      }
//     }

//     let allPassed = true;
//     let countPassed = 0;
//     results.forEach((res: any, idx: number) => {
//      if (!res || !res.status) {
//       console.log(`Testcase ${idx + 1}: ❌ Invalid response (null result)`);
//       allPassed = false;
//       return;
//      }

//      const stdout = res.stdout ? atob(res.stdout) : null;
//      const stderr = res.stderr ? atob(res.stderr) : null;

//      const verdict = res.status?.description || "Unknown";
//      const passed = res.status?.id === 3; // 3 = Accepted

//      tempRes[idx] = {
//       ...tempRes[idx],
//       output: stdout ?? "",
//       error: !!stderr,
//       errorMessage: stderr ?? "",
//       verdict: verdict,
//      };

//      if (passed) {
//       countPassed += 1
//      } else {
//       allPassed = false;
//      }

//         });
        
//         // markPoints(roomId!, teamId!, problemId!, countPassed)

//         if (allPassed && socket && roomId && problemId && teamId) {
//           socket.emit("markSolved", { roomId, teamId, problemId, username: currentUserName });
//           markTeamSolved(teamId, problemId, roomId, currentUserName)
//         }
//       } catch (err: any) {
//         console.error(err);
//       }
//       setIsLoading(false);
//       setTestResults([...tempRes]);
//       setTimeout(() => {
//         testResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
//       }, 100);
//     };

  /*
   Called when user clicks Submit
   Sends code along with testcases to Judge0 and gets back tokens which is then checked
   via checkStatus funciton
  */
//   async function Run() {
//     setIsLoading(true);
//     const sourceCode = editorRef.current?.getValue();
//     if(sourceCode === ""){ 
//      setIsLoading(false)
//      return
//     }
//     const url = import.meta.env.VITE_JUDGE0_URL + '/submissions/batch?fields=*';
//     const normalizedCode = sourceCode?.replace(/\r\n/g, "\n") || "";
//     let submissions: {}[] = [];
//     let tempRes: TestCases[] = [];

//     // get sample testcases
//     data?.samples.map((tc) => {
//      submissions.push(
//       {
//        source_code: normalizedCode,
//        language_id: languageIdMap[language],
//        stdin: tc.input,
//        expected_output: tc.output,
//       }
//      );
//       tempRes.push(
//        {
//         input: tc.input,
//         expected: tc.output,
//         output: "",
//         verdict: "",
//         hidden: false,
//         error: false,
//         errorMessage: ""
//        }
//       );
//     })

//     data?.hiddenTestCases.map((tc) => {
//      submissions.push(
//       {
//        source_code: normalizedCode,
//        language_id: languageIdMap[language],
//        stdin: tc.input,
//        expected_output: tc.output,
//       }
//      );
//       tempRes.push(
//        {
//         input: tc.input,
//         expected: tc.output,
//         output: "",
//         verdict: "",
//         hidden: true,
//         error: false,
//         errorMessage: ""
//        }
//       );
//     })

//     setTestResults(tempRes);

//     console.log(submissions);

//     const options = {
//       method: 'POST',
//       headers: {
//         'content-type': 'application/json',
//       },
//       body: JSON.stringify({
//        submissions: submissions
//       }),
//     };

//     try {
//       const response = await fetch(url, options);
//       if(!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
//       }
//       const data = await response.json();
//       const tokens = data.map((d: any) => d.token);
//       await checkStatus(tokens, tempRes);
//     } catch (err: any) {
//       console.error(err);
//     }
//   }

    // useEffect(() => {

    //   if (!user) return;
    //   if (!roomId) return;

    //   const fetchData = async () => {
    //     const docRef = doc(db, "RoomSet", roomId!);
    //     const docSnap = await getDoc(docRef);

    //     // Redirects to 404 if room not created earlier
    //     if(!docSnap.exists()) navigate("/404");

    //     const teamKey = teamId == "A" ? "teamA" : "teamB";

    //     const players: {
    //       pid: string;
    //       points: number;
    //       problemSolved: number;
    //     }[] = docSnap.data()?.[teamKey].players || [];

    //     let pIdx = -1

    //     pIdx = players.findIndex(
    //       (p) => p.pid === currentUserName
    //     );

    //     if (pIdx == -1) navigate("/404"); // Player not found in the team
  
    //     setPassData(docSnap.data() as gameRes)
    //     console.log("fetched")
        
    //     }
  
    //   fetchData();
    // },[passData]);

const [activeTab, setActiveTab] = useState<'problem' | 'chat'>('problem');

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex justify-between items-center px-4 py-2 border-b border-gray-700/50 bg-gray-900/50">
        <h2 className="text-xl font-bold text-cyan-300">{data?.title}</h2>
        <div className="text-xl font-mono bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-cyan-400/20">
          <span className="text-cyan-300">Time Left: {timeLeft}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSubmit}
            className="font-bold text-gray-900 bg-green-400 border-2 border-green-400 rounded-lg px-4 py-1.5 transition-all duration-300 hover:bg-transparent hover:text-green-300
            disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isMatchOver || isSpectator}
          >
            {isSpectator ? "Read-only" : "Submit"}
          </button>
          <button 
            onClick={() => navigate(`/room/${roomId}/problemset/team/${teamId}${isSpectator ? "?spectator=1" : ""}`)} 
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
         { data?.inputFormat }
        </p>
        <h3 className="text-xl font-bold text-white mb-4">Output Format</h3>
        <p className="text-gray-300 mb-6">
         { data?.outputFormat }
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
         {data?.constraints}
        </ul>
       </div>
      ) : (
       <div className="h-full">
        <ChatBox onClose={() => setActiveTab('problem')} />
       </div>
      )}
     </div>
    </div>

    {/* Right Panel - Editor and Results */}
    <div className="flex-1 flex flex-col">
     {/* Language Select and Editor */}
     <div className="flex-1 min-h-0">
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
      <div className="h-[calc(100%-48px)]">
       <Editor 
        theme="vs-dark" 
        language={language} 
        value={code} 
        options={{
         minimap: { enabled: false },
         fontSize: 16,
         wordWrap: 'on',
           readOnly: isSpectator,
        }}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
       />
      </div>
     </div>

     {/* Test Results */}
     <div ref={testResultsRef} className="h-[240px] flex border-t border-gray-700/50">
      <div className="w-1/3 p-3 bg-gray-900/70 border-r border-gray-700/50 rounded-l-lg overflow-y-auto space-y-3">
       {testResults.map((res, idx) => (
        <button
         key={idx}
         onClick={() => setSelectedIdx(idx)}
         className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium transition-all
          ${selectedIdx === idx ? "bg-cyan-800/60 text-cyan-300 border border-cyan-400" : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/70"}`}
        >
         <span>Testcase {idx + 1}</span>
         <span
          className={`px-2 py-0.5 rounded text-xs ${
           res.verdict === "Accepted"
            ? "bg-green-500/20 text-green-400"
            : res.verdict
            ? "bg-red-500/20 text-red-400"
            : "bg-gray-500/20 text-gray-400"
          }`}
         >
          {res.verdict || "Pending"}
         </span>
        </button>
       ))}
      </div>

      <div className="w-2/3 bg-gray-950/80 h-full p-6 rounded-r-lg">
       {selectedIdx === null ? (
        <p className="text-gray-400">Select a testcase to view details.</p>
       ) : (
        <div className="space-y-3">
         <h3 className="text-lg font-bold text-cyan-300">
          Testcase {selectedIdx + 1} - {testResults[selectedIdx].verdict}
         </h3>
         {!testResults[selectedIdx].hidden ? (
          <>
           <p className='text-white' >
            <span className="text-purple-400 font-semibold">Input:</span>{" "}
            {testResults[selectedIdx].input}
           </p>
           <p className='text-white' >
            <span className="text-purple-400 font-semibold">Expected:</span>{" "}
            {testResults[selectedIdx].expected}
           </p>
           <p className='text-white' >
            <span className="text-purple-400 font-semibold">Output:</span>{" "}
            {testResults[selectedIdx].output}
           </p>
          </>
         ) : (
          <p className="text-gray-400 italic">
           Hidden testcase — only verdict is shown.
          </p>
         )}
         {testResults[selectedIdx].error && (
          <p className="text-red-400">
           Error: {testResults[selectedIdx].errorMessage}
          </p>
         )}
        </div>
       )}
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