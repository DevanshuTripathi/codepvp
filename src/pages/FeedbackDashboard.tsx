import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig"; // Adjust path as needed
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { Activity, Users, Target, Crosshair, AlertTriangle, Code, PieChart as PieChartIcon } from "lucide-react";
// Removed 'Cell' from imports
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";

const MCQ_QUESTIONS = [
  "How likely are you to use CodePvP regularly?",
  "What would you MOST likely use CodePvP for?",
  "Would you actually compete with your friends on a leaderboard?",
  "If companies recognized top players, would that motivate you?",
  "Would you pay ₹100/month for structured prep (DSA + system design)?",
  "What would make you actually pay?",
  "How do you currently prepare for coding interviews?",
  "Which do you prefer?"
];

const DESCRIPTIVE_QUESTIONS = {
  dislike: "What did you NOT like about CodePvP?",
  confused: "What confused or annoyed you the most?"
};

const COLORS = ['#06b6d4', '#f97316', '#10b981', '#8b5cf6', '#ef4444', '#facc15'];

const AdminDashboard = () => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  // Updated state type to include 'fill'
  const [chartData, setChartData] = useState<Record<string, {name: string, value: number, fill: string}[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const q = query(collection(db, "feedbacks"), orderBy("submittedAt", "desc"));
        const snap = await getDocs(q);
        
        const fetchedData: any[] = [];
        const aggregations: Record<string, Record<string, number>> = {};
        
        MCQ_QUESTIONS.forEach(q => aggregations[q] = {});

        snap.forEach((doc) => {
          const data = doc.data();
          fetchedData.push({ id: doc.id, ...data });

          MCQ_QUESTIONS.forEach(question => {
            const answer = data[question] || "Unanswered";
            aggregations[question][answer] = (aggregations[question][answer] || 0) + 1;
          });
        });

        // Format data for Recharts, sort it, and assign colors
        const formattedChartData: Record<string, {name: string, value: number, fill: string}[]> = {};
        MCQ_QUESTIONS.forEach(question => {
          const rawData = Object.keys(aggregations[question]).map(key => ({
            name: key,
            value: aggregations[question][key]
          }));

          // Sort data descending BEFORE assigning colors so the legend and pie chart match perfectly
          rawData.sort((a, b) => b.value - a.value);

          formattedChartData[question] = rawData.map((item, index) => ({
            ...item,
            fill: COLORS[index % COLORS.length] // Recharts automatically reads the 'fill' key
          }));
        });

        setFeedbacks(fetchedData);
        setChartData(formattedChartData);
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-cyan-900 p-3 rounded shadow-[0_0_15px_rgba(34,211,238,0.15)] text-sm font-sans z-50 max-w-xs">
          <p className="text-gray-200 mb-1 font-medium">{payload[0].name}</p>
          <p className="text-cyan-400 font-bold font-mono">Count: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  // Updated props interface to expect 'fill'
  const PieChartCard = ({ question, data }: { question: string, data: {name: string, value: number, fill: string}[] }) => (
    <div className="bg-black/40 border border-gray-800 p-5 rounded-2xl flex flex-col">
      <div className="flex items-start gap-2 mb-4 text-cyan-400 text-xs font-bold uppercase tracking-widest min-h-[40px]">
        <PieChartIcon size={16} className="shrink-0 mt-0.5" /> 
        <span className="leading-tight">{question}</span>
      </div>
      <div className="h-48 w-full shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              // No <Cell> mapping needed here anymore! 
            />
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2 overflow-y-auto flex-1 custom-scrollbar pr-2">
        {/* Data is already sorted, just map it and use entry.fill */}
        {data.map((entry, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate pr-2">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: entry.fill }}></div>
              <span className="text-gray-400 truncate">{entry.name}</span>
            </div>
            <span className="text-white font-mono">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-cyan-500 font-mono animate-pulse">Initializing Telemetry...</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-950 min-h-screen text-gray-200 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-8 flex items-center justify-between border-b border-gray-800 pb-6 relative">
        <div className="absolute top-0 left-0 w-64 h-32 bg-cyan-600/10 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-cyan-400 tracking-tighter uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
            Feedback <span className="text-white">Command</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-mono">Analyzing {feedbacks.length} After-Action Reports</p>
        </div>
        <Activity className="text-cyan-400 w-8 h-8 animate-pulse relative z-10" />
      </div>

      <div className="max-w-[1600px] mx-auto space-y-12">
        
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
          <div className="bg-black/40 border border-gray-800 p-6 rounded-2xl flex items-center justify-between hover:border-cyan-500/30 transition-all">
            <div>
              <p className="text-cyan-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <Users size={14} /> Total Operatives
              </p>
              <h2 className="text-4xl font-black text-white">{feedbacks.length}</h2>
            </div>
          </div>
        </div>

        {/* Dynamic Pie Charts Grid */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="text-cyan-400" /> Quantitative Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MCQ_QUESTIONS.map((question, idx) => (
              <PieChartCard key={idx} question={question} data={chartData[question] || []} />
            ))}
          </div>
        </div>

        {/* Truth Bomb / Raw Logs Section */}
        <div>
          <h2 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2">
            <Crosshair /> Truth Bomb Intel (Raw Feedback)
          </h2>
          <div className="bg-black/40 border border-gray-800 rounded-2xl p-6 h-[600px] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 relative z-10">
              {feedbacks.length === 0 ? (
                <div className="text-gray-500 text-sm italic text-center py-8">No feedback records found.</div>
              ) : (
                feedbacks.map((fb) => {
                  const dislike = fb[DESCRIPTIVE_QUESTIONS.dislike];
                  const confused = fb[DESCRIPTIVE_QUESTIONS.confused];
                  
                  if (!dislike && !confused) return null;

                  return (
                    <div 
                      key={fb.id} 
                      className="p-5 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-gray-600 transition-all flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Code size={16} className="text-cyan-500"/>
                          <span className="text-sm text-cyan-400 font-bold font-mono tracking-wider">
                            {fb.roomId || "Unknown Room"}
                          </span>
                        </div>
                        {fb.submittedAt && (
                          <span className="text-xs text-gray-500 font-mono">
                            {new Date(fb.submittedAt?.toDate()).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Dislikes Box */}
                        <div>
                          <h4 className="text-xs text-red-400 uppercase tracking-widest mb-2 font-bold flex items-center gap-1.5">
                            <AlertTriangle size={12} /> What they didn't like
                          </h4>
                          <p className="text-sm text-gray-300 leading-relaxed bg-red-950/10 p-4 rounded-lg border border-red-900/20">
                            {dislike || <span className="text-gray-600 italic">No response</span>}
                          </p>
                        </div>

                        {/* Confusion Box */}
                        <div>
                          <h4 className="text-xs text-amber-400 uppercase tracking-widest mb-2 font-bold flex items-center gap-1.5">
                            What confused them
                          </h4>
                          <p className="text-sm text-gray-300 leading-relaxed bg-amber-950/10 p-4 rounded-lg border border-amber-900/20">
                            {confused || <span className="text-gray-600 italic">No response</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;