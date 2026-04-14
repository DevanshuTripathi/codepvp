import { db, admin } from "../firebaseAdmin.js";

const languageIdMap = {
 python: 71,
 cpp: 54,
 java: 62,
 javascript: 63,
 typescript: 74,
 go: 60,
 rust: 73
}

const problemsCollection = db.collection('ProblemsWithHTC');
const debugProblemsCollection = db.collection('DebugProblems');

export async function getVerdict(sourceCode, problemId, languageId, baseUrl) {
    const docRef = problemsCollection.doc(problemId);
    let doc = await docRef.get();

    if (!doc.exists) {
        doc = await debugProblemsCollection.doc(problemId).get();
    }

    if (!doc.exists) {
        return {
            result: [
                {
                    input: "N/A",
                    expected: "N/A",
                    output: "",
                    verdict: "Internal Error",
                    hidden: false,
                    error: true,
                    errorMessage: "Problem not found.",
                }
            ],
            ac: false,
        };
    }

    const problem = doc.data();
    const samples = problem.samples;
    const hiddenTestCases = problem.hiddenTestCases;

    const url = baseUrl + '/submissions/batch?fields=*';

    let submissions = [];
    let result = [];

    samples.map((tc) => {
        submissions.push(
            {
                source_code: sourceCode,
                language_id: languageIdMap[languageId],
                stdin: tc.input,
                expected_output: tc.output,
            }
        );
        result.push(
            {
                input: tc.input,
                expected: tc.output,
                output: "",
                verdict: "",
                hidden: false,
                error: false,
                errorMessage: ""
            }
        )
    })

    hiddenTestCases.map((tc) => {
        submissions.push(
        {
            source_code: sourceCode,
            language_id: languageIdMap[languageId],
            stdin: tc.input,
            expected_output: tc.output,
        }
        );
        result.push(
            {
            input: "Hidden",
            expected: "Hidden",
            output: "",
            verdict: "",
            hidden: true,
            error: false,
            errorMessage: ""
            }
        );
    })

    const options = {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            submissions: submissions
        }),
    };

    try {
        const response = await fetch(url, options);
        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const tokens = data.map((d) => d.token);
        return checkStatus(tokens, result, baseUrl);
    } catch (err) {
        console.error(err);
    }
}

async function checkStatus(tokens, result, baseUrl) {
    const tokenQuery = tokens.join(",");
    const baseUrl = `${baseUrl}/submissions/batch?tokens=${tokenQuery}&base64_encoded=true&fields=*`;
    let ac = false;
    const options = {
    method: 'GET',
        headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
        },
    };

    try {
        let allDone = false;
        let results = [];

        while(!allDone) {
            const url = `${baseUrl}&_=${Date.now()}`;
            let response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let data = await response.json();
            results = data.submissions || data;

            results = results.filter((res) => res !== null);

            allDone =
                results.length === tokens.length &&
                results.every(
                    (res) => res.status?.id !== 1 && res.status?.id !== 2
                );

            if (!allDone) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }

            let allPassed = true;
            let countPassed = 0;

            results.forEach((res, idx) => {
                if (!res || !res.status) {
                    allPassed = false;
                    return;
                }

                const stdout = res.stdout ? atob(res.stdout) : "";
                const stderr = res.stderr ? atob(res.stderr) : "";
                const compile_output = res.compile_output ? atob(res.compile_output) : "";

                const verdict = res.status?.description || "Unknown";
                const passed = res.status?.id === 3; // 3 = Accepted

                result[idx] = {
                    ...result[idx],
                    output: stdout ?? "",
                    error: !!(stderr || compile_output),
                    errorMessage: stderr || compile_output,
                    verdict: verdict,
                };

                if (passed) {
                    countPassed += 1
                } else {
                    allPassed = false;
                }

            });

            //Mark Points
            ac = allPassed


        }

    } catch (err) {
        console.log(err);
    }
    
    return {
        result: result,
        ac: ac
    }

}