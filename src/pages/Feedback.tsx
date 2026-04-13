import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../firebaseConfig'; // Adjust path based on your project structure

// Type definition for our form state
interface FeedbackForm {
    q1: string; q2: string; q3: string; q4: string; q5: string;
    q6: string; q7: string; q8: string; q9: string; q10: string;
}

const QUESTION_MAP: Record<keyof FeedbackForm, string> = {
    q1: "How likely are you to use CodePvP regularly?",
    q2: "What would you MOST likely use CodePvP for?",
    q3: "Would you actually compete with your friends on a leaderboard?",
    q4: "If companies recognized top players, would that motivate you?",
    q5: "Would you pay ₹100/month for structured prep (DSA + system design)?",
    q6: "What would make you actually pay?",
    q7: "What did you NOT like about CodePvP?",
    q8: "What confused or annoyed you the most?",
    q9: "How do you currently prepare for coding interviews?",
    q10: "Which do you prefer?"
};

const Feedback: React.FC = () => {

    const navigate = useNavigate();

    const { roomId } = useParams();

    const [formData, setFormData] = useState<FeedbackForm>({
        q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '', q9: '', q10: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const handleOptionChange = (questionId: keyof FeedbackForm, value: string) => {
        setFormData(prev => ({ ...prev, [questionId]: value }));
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Basic validation to ensure they answered the open-ended ones at least
        if (!formData.q7 || !formData.q8) {
            setError("Please drop some truth bombs in Section 3. We need your honest thoughts!");
            setIsSubmitting(false);
            return;
        }

        try {
      // 2. Transform the data before sending to Firestore
      const formattedPayload: Record<string, any> = {
        submittedAt: serverTimestamp(),
        roomId: roomId || 'unknown', // Keep track of which match this was
      };

      // Map q1 -> "How likely are you..."
      (Object.keys(formData) as Array<keyof FeedbackForm>).forEach((key) => {
        const questionText = QUESTION_MAP[key];
        formattedPayload[questionText] = formData[key];
      });

      // Submit the readable payload to Firestore
      await addDoc(collection(db, "feedbacks"), formattedPayload);
      
      // 3. Immediately route them to the results page
      if (roomId) {
        navigate(`/room/${roomId}/results`);
      } else {
        // Fallback just in case they navigated here without a roomId
        navigate('/'); 
      }

    } catch (err: any) {
        console.error("Error submitting feedback:", err);
        setError("Failed to submit feedback. Please try again.");
        setIsSubmitting(false); // Only set false on error, if success they navigate away anyway
    }
    };

    // Reusable component for MCQ options
    const RadioGroup = ({ 
        id, options 
    }: { 
        id: keyof FeedbackForm, options: string[] 
    }) => (
        <div className="flex flex-col gap-3 mt-4 text-left">
        {options.map((option) => (
            <label 
            key={option} 
            className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 
                ${formData[id] === option 
                ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
                : 'bg-gray-900/50 border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
                }`}
            >
            <input
                type="radio"
                name={id}
                value={option}
                checked={formData[id] === option}
                onChange={() => handleOptionChange(id, option)}
                className="w-5 h-5 text-cyan-400 bg-gray-900 border-gray-600 focus:ring-cyan-500 focus:ring-offset-gray-900"
            />
            <span className="ml-3 text-gray-200 font-medium">{option}</span>
            </label>
        ))}
        </div>
    );

    return (
        <div className="bg-gray-900 min-h-screen w-full font-sans flex flex-col selection:bg-cyan-500/30">
        
        {/* Top Navigation */}
        <nav className="w-full border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="text-2xl font-bold text-cyan-300 tracking-tighter" style={{ textShadow: `0 0 8px rgba(34,211,238,0.5)` }}>
                CodePvP
            </div>
            <span className="text-gray-500 font-mono text-sm">/ After-Action Report</span>
            </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow w-full py-12 px-4 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-600/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-2xl mx-auto relative z-10">
            
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
                Debrief & <span className="text-cyan-400">Feedback</span>
                </h1>
                <div className="inline-block border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-2 rounded-md font-mono text-sm tracking-wide">
                "Honest feedback = better product. Don't be nice."
                </div>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-center">
                {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-12">

                {/* Section 1 */}
                <div className="bg-black/40 border border-gray-800 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-purple-400 mb-8 border-b border-gray-800 pb-4 flex items-center gap-2">
                    Section 1: Core Product Validation
                </h2>
                
                <div className="space-y-8">
                    <div>
                    <label className="text-lg text-gray-200 font-semibold">1. How likely are you to use CodePvP regularly?</label>
                    <RadioGroup id="q1" options={['Very likely', 'Maybe', 'Probably not', 'No']} />
                    </div>
                    <div>
                    <label className="text-lg text-gray-200 font-semibold">2. What would you MOST likely use CodePvP for?</label>
                    <RadioGroup id="q2" options={['Interview prep (DSA)', 'Competing with friends', 'Learning concepts', 'Just trying it once', 'I wouldn’t use it']} />
                    </div>
                    <div>
                    <label className="text-lg text-gray-200 font-semibold">3. Would you actually compete with your friends on a leaderboard?</label>
                    <RadioGroup id="q3" options={['Yes, sounds fun', 'Maybe occasionally', 'No']} />
                    </div>
                    <div>
                    <label className="text-lg text-gray-200 font-semibold">4. If companies recognized top players, would that motivate you?</label>
                    <RadioGroup id="q4" options={['Yes a lot', 'A little', 'Not really']} />
                    </div>
                </div>
                </div>

                {/* Section 2 */}
                <div className="bg-black/40 border border-gray-800 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-green-400 mb-8 border-b border-gray-800 pb-4 flex items-center gap-2">
                    Section 2: Monetization
                </h2>
                
                <div className="space-y-8">
                    <div>
                    <label className="text-lg text-gray-200 font-semibold">5. Would you pay ₹100/month for structured prep (DSA + system design)?</label>
                    <RadioGroup id="q5" options={['Yes', 'Maybe', 'No']} />
                    </div>
                    <div>
                    <label className="text-lg text-gray-200 font-semibold">6. What would make you actually pay?</label>
                    <RadioGroup id="q6" options={['Better content than YouTube', 'Company recognition / hiring', 'Competitive features', 'Mentorship', 'I wouldn’t pay']} />
                    </div>
                </div>
                </div>

                {/* Section 3 */}
                <div className="bg-black/40 border border-gray-800 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-[50px]"></div>
                <h2 className="text-xl font-bold text-red-400 mb-8 border-b border-gray-800 pb-4 flex items-center gap-2 relative z-10">
                    Section 3: Truth Bomb Zone
                </h2>
                
                <div className="space-y-8 relative z-10">
                    <div>
                    <label className="text-lg text-gray-200 font-semibold mb-3 block">7. What did you NOT like about CodePvP?</label>
                    <textarea 
                        name="q7"
                        value={formData.q7}
                        onChange={handleTextChange}
                        placeholder="Be brutal..."
                        rows={4}
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-gray-200 placeholder-gray-600 focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all outline-none"
                    ></textarea>
                    </div>
                    <div>
                    <label className="text-lg text-gray-200 font-semibold mb-3 block">8. What confused or annoyed you the most?</label>
                    <textarea 
                        name="q8"
                        value={formData.q8}
                        onChange={handleTextChange}
                        placeholder="UI issues, bugs, confusing mechanics..."
                        rows={4}
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-gray-200 placeholder-gray-600 focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all outline-none"
                    ></textarea>
                    </div>
                </div>
                </div>

                {/* Section 4 */}
                <div className="bg-black/40 border border-gray-800 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-blue-400 mb-8 border-b border-gray-800 pb-4 flex items-center gap-2">
                    Section 4: Behavioral Insight
                </h2>
                
                <div className="space-y-8">
                    <div>
                    <label className="text-lg text-gray-200 font-semibold">9. How do you currently prepare for coding interviews?</label>
                    <RadioGroup id="q9" options={['Solo grinding (LeetCode etc.)', 'With friends', 'Courses', 'I don’t prepare']} />
                    </div>
                    <div>
                    <label className="text-lg text-gray-200 font-semibold">10. Which do you prefer?</label>
                    <RadioGroup id="q10" options={['Solo learning', 'Learning with friends', 'Competitive environment']} />
                    </div>
                </div>
                </div>

                {/* Submit */}
                <div className="pt-6">
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`w-full py-5 font-bold text-gray-900 rounded-xl text-xl tracking-wide transition-all duration-300 
                    ${isSubmitting 
                        ? 'bg-cyan-700 cursor-not-allowed opacity-70' 
                        : 'bg-cyan-400 hover:bg-cyan-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(34,211,238,0.4)]'
                    }`}
                >
                    {isSubmitting ? 'Uploading Data...' : 'Submit Intel'}
                </button>
                </div>
            </form>
            </div>
        </main>

        <footer className="w-full py-8 text-center text-gray-600 text-sm mt-auto border-t border-gray-800 z-10 bg-gray-900/80">
            &copy; {new Date().getFullYear()} CodePvP. All rights reserved.
        </footer>
        </div>
    );
};

export default Feedback;