import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react'
import { editor } from 'monaco-editor'
import { useParams } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';

interface ProblemData {
    title: string;
    stmt: string;
    testcases: {
            stdin: string;
            expected_output: string;
            hidden: boolean;
            display: {
                input: string;
                output: string
            }
    }[];
    constraints: string[];
    starter_code: string;
}

const Problem: React.FC = () => {

    const { problemId } = useParams<{ problemId: string }>();

    const [data, setData] = useState<ProblemData | null>(null);

    const[code, setCode] = useState("");

    const twoSumHarness = `
def run_tests() :
    output = twoSum([3, 2, 4], 6)
    expected = [1, 2]
    if sorted(output) == sorted(expected):
        print("Passed")
    else:
        print("Failed")
run_tests()
    `

    useEffect(() => {
        if(problemId) {
            console.log(problemId);
            getDocumentData("problems", problemId);
            console.log(data);
        }
    }, [problemId])

    async function getDocumentData(collectionName: string, documentId: string) {
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);
        if(docSnap.exists()) {
            setData(docSnap.data() as ProblemData);
            setCode(docSnap.data().starter_code);
            console.log(docSnap.data());
        } else {
            console.log("GAY")
        }
    }

    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    function handleEditorDidMount(editorInstance: editor.IStandaloneCodeEditor) {
        editorRef.current = editorInstance;
    }

    const checkStatus = async (token: string) => {
        const url = `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true&fields=*`;
        const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': import.meta.env.VITE_RAPID_API_KEY as string,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        };

        try {
        let response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = await response.json();
        let statusId = data.status?.id;

        // Keep polling until the submission is processed (status 1 or 2)
        while (statusId === 1 || statusId === 2) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            data = await response.json();
            statusId = data.status?.id;
        }
        
        // Decode the Base64 output
        const stdout = data.stdout ? atob(data.stdout) : null;
        const stderr = data.stderr ? atob(data.stderr) : null;
        const compileError = data.compile_output ? atob(data.compile_output) : null;
        
        let finalOutput = '';
        if (stdout) finalOutput += `Output:\n${stdout}\n`;
        if (stderr) finalOutput += `Error:\n${stderr}\n`;
        if (compileError) finalOutput += `Compile Error:\n${compileError}\n`;
        if (!stdout && !stderr && !compileError) finalOutput = "Execution successful, but no output.";
        console.log(finalOutput);
        
        } catch (err: any) {
            console.error(err);
        }
    };

    async function Run() {
        const sourceCode = editorRef.current?.getValue();
        const url = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&fields=*';
        const options = {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': import.meta.env.VITE_RAPID_API_KEY as string,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            },
            body: JSON.stringify({
                language_id: 71,
                source_code: btoa(sourceCode+twoSumHarness),
            }),
        };

        try {
            const response = await fetch(url, options);
            if(!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            checkStatus(data.token);
        } catch (err: any) {
            console.error(err);
        }
    }

  return (
    <div className="z-10 flex flex-col h-dvh w-full max-w-dvw
      bg-black backdrop-blur-md 
      border border-cyan-400/20
      shadow-2xl shadow-cyan-500/10">
      
      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <h2 className="text-2xl font-bold text-cyan-300">{ data?.title }</h2>
        {/* <button className="text-purple-300 hover:text-white transition-colors duration-300 text-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Topics
        </button> */}
      </header>

      {/* Main Content Area */}
      <div className="flex flex-grow overflow-hidden">
        {/* Left Side: Problem Description */}
        <div className="w-1/2 p-6 overflow-y-auto">
          <h3 className="text-xl font-bold text-white mb-4">Problem Statement</h3>
          <p className="text-gray-300 mb-6">
            { data?.stmt }
          </p>
            {data?.testcases.filter(tc => !tc.hidden).map((tc, i) => (
                <div key={i}>
                <h3 className="text-xl font-bold text-white mb-4">Example {i + 1}</h3>
                    <div className="bg-gray-900/50 p-4 rounded-lg mb-6">
                        <code className="text-gray-300">
                        <span className="text-purple-400">Input:</span> { tc.display.input }<br/>
                        <span className="text-purple-400">Output:</span> { tc.display.output }<br/>
                        </code>
                    </div>
                </div>
            ))}
          {/* <h3 className="text-xl font-bold text-white mb-4">Example 1</h3>
          <div className="bg-gray-900/50 p-4 rounded-lg mb-6">
            <code className="text-gray-300">
              <span className="text-purple-400">Input:</span> { data?.testcases.display.input }<br/>
              <span className="text-purple-400">Output:</span> [0, 1]<br/>
              <span className="text-purple-400">Explanation:</span> Because nums[0] + nums[1] == 9, we return [0, 1].
            </code>
          </div> */}

          {/* <h3 className="text-xl font-bold text-white mb-4">Example 2</h3>
          <div className="bg-gray-900/50 p-4 rounded-lg mb-6">
            <code className="text-gray-300">
              <span className="text-purple-400">Input:</span> nums = [3, 2, 4], target = 6<br/>
              <span className="text-purple-400">Output:</span> [1, 2]
            </code>
          </div> */}

          <h3 className="text-xl font-bold text-white mb-4">Constraints</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            {data?.constraints.map((c, i) => (
                <li key={i}>{ c }</li>
            ))}
          </ul>
        </div>

        {/* Right Side: Code Editor and Actions */}
        <div className="w-1/2 flex flex-col border-l border-gray-700/50">
          {/* This is now just a placeholder for the editor */}
          <div className="flex-grow bg-gray-900/50 p-4">
             <Editor 
                theme="vs-dark" 
                defaultLanguage='python' 
                value={code} 
                options={{
                    minimap: { enabled: false },
                    fontSize: 16,
                    wordWrap: 'on',
                }}
                onMount={handleEditorDidMount}
            />
          </div>
          <div className="flex justify-end items-center p-4 bg-gray-900/50 border-t border-gray-700/50 gap-4">
            <button onClick={Run} className="font-bold text-cyan-300 border-2 border-cyan-400/50 rounded-lg px-6 py-2 transition-all duration-300 hover:bg-cyan-300 hover:text-gray-900">
              Run
            </button>
            <button className="font-bold text-gray-900 bg-green-400 border-2 border-green-400 rounded-lg px-6 py-2 transition-all duration-300 hover:bg-transparent hover:text-green-300">
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Problem;
