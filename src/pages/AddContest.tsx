import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { Info, Flame, Calendar, Gift, ShieldAlert, Globe, Lock, Target, Code } from "lucide-react";

interface Problem {
  id: string;
  title: string;
  difficulty?: string;
}

interface Badge {
  id: string;
  name: string;
}

const AddContest = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Upcoming");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rules, setRules] = useState("");
  
  // Visibility & Access
  const [visibility, setVisibility] = useState("Public");
  const [joinCode, setJoinCode] = useState("");
  
  // Prize configuration
  const [prizes, setPrizes] = useState([{ rank: "1st", reward: "", badgeId: "" }]);

  // Problem & Badge Selection
  const [availableProblems, setAvailableProblems] = useState<Problem[]>([]);
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fetch Problems & Badges on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [probSnap, badgeSnap] = await Promise.all([
          getDocs(collection(db, "ProblemsWithHTC")),
          getDocs(collection(db, "Badges")) // Fetching badges
        ]);

        const fetchedProbs: Problem[] = [];
        probSnap.forEach((doc) => {
          fetchedProbs.push({ id: doc.id, title: doc.data().title || "Untitled Problem", difficulty: doc.data().difficulty || "Medium" });
        });
        
        const fetchedBadges: Badge[] = [];
        badgeSnap.forEach((doc) => {
          fetchedBadges.push({ id: doc.id, name: doc.data().name || "Unnamed Badge" });
        });

        setAvailableProblems(fetchedProbs);
        setAvailableBadges(fetchedBadges);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const updateArrayField = (setter: any, array: any, index: number, field: string, value: string) => {
    const newArr = array.map((item: any, i: number) =>
      i === index ? { ...item, [field]: value } : item
    );
    setter(newArr);
  };

  const toggleProblemSelection = (id: string) => {
    setSelectedProblems((prev) => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) return alert("Please fill in Contest Name and Dates.");
    if (visibility === "Private" && !joinCode.trim()) return alert("Please provide an Access Code for private contests.");
    if (selectedProblems.length === 0) return alert("You must select at least one problem for the arena.");
    
    try {
      await setDoc(doc(db, "Contests", name.replace(/\s+/g, '-')), {
        name,
        description,
        status,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rules,
        visibility,
        joinCode: visibility === "Private" ? joinCode : null,
        prizes,
        problemIds: selectedProblems, 
        badgesDistributed: false, // Initial flag to track distribution
        createdAt: new Date()
      });
      alert("FFA Arena Successfully Deployed! 💥");
      
      // Reset form
      setName("");
      setDescription("");
      setJoinCode("");
      setRules("");
      setSelectedProblems([]);
      setPrizes([{ rank: "1st", reward: "", badgeId: "" }]);
    } catch (err) {
      console.error(err);
      alert("Error: Check Firestore rules or database connection.");
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-950 min-h-screen text-gray-200 font-mono">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between border-b border-orange-500/20 pb-4">
        <div>
          <h1 className="text-3xl font-black text-orange-500 tracking-tighter uppercase italic drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">
            Arena Admin <span className="text-white">Command</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1">Deploying to: Contests Collection</p>
        </div>
        <Flame className="text-orange-500 w-8 h-8 animate-pulse" />
      </div>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Contest Definition */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-black/40 border border-white/5 p-6 rounded-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 mb-4 text-orange-400 text-sm font-bold uppercase tracking-widest">
              <Info size={16} /> Arena Metadata
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[16px] text-orange-400 uppercase ml-1">Arena Name</label>
                <input className="w-full bg-gray-900 border border-orange-900/50 p-3 rounded-lg outline-none focus:border-orange-500 text-sm" placeholder="e.g. Midnight Bloodbath" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-[16px] text-purple-400 uppercase ml-1">Status</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-gray-900 border border-purple-900/50 p-3.5 rounded-lg outline-none focus:border-purple-500 text-sm text-purple-400"
                >
                  <option value="Draft">Draft</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Visibility & Access */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[16px] text-emerald-400 uppercase ml-1 flex items-center gap-2"><Globe size={14}/> Visibility</label>
                <select 
                  value={visibility}
                  onChange={(e) => {
                    setVisibility(e.target.value);
                    if (e.target.value === "Public") setJoinCode("");
                  }}
                  className="w-full bg-gray-900 border border-emerald-900/50 p-3.5 rounded-lg outline-none focus:border-emerald-500 text-sm text-emerald-400"
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
              </div>
              
              {visibility === "Private" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[16px] text-red-400 uppercase ml-1 flex items-center gap-2"><Lock size={14}/> Access Code</label>
                  <input 
                    className="w-full bg-gray-900 border border-red-900/50 p-3 rounded-lg outline-none focus:border-red-500 text-sm text-red-200 placeholder-red-900/50" 
                    placeholder="e.g. KILLCODE01" 
                    value={joinCode} 
                    onChange={(e) => setJoinCode(e.target.value)} 
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[16px] text-blue-400 uppercase ml-1 flex items-center gap-2"><Calendar size={14}/> Start Time</label>
                <input type="datetime-local" className="w-full bg-gray-900 border border-blue-900/50 p-3 rounded-lg outline-none focus:border-blue-500 text-sm text-gray-300" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-[16px] text-blue-400 uppercase ml-1 flex items-center gap-2"><Calendar size={14}/> End Time</label>
                <input type="datetime-local" className="w-full bg-gray-900 border border-blue-900/50 p-3 rounded-lg outline-none focus:border-blue-500 text-sm text-gray-300" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-[16px] text-orange-400 uppercase ml-1">Briefing (Description)</label>
              <textarea className="w-full bg-gray-900 border border-orange-900/50 p-4 rounded-lg h-24 font-mono text-sm outline-none focus:border-orange-500 resize-none whitespace-pre-wrap" placeholder="Describe the arena environment..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <label className="text-[15px] text-emerald-400 uppercase ml-1 flex items-center gap-2"><ShieldAlert size={14}/> Rules of Engagement</label>
              <textarea className="w-full bg-gray-900 border border-emerald-900/50 p-3 rounded-lg outline-none focus:border-emerald-500 text-xs text-emerald-400 h-24 whitespace-pre-wrap" placeholder="- No alliances&#10;- Highest score survives" value={rules} onChange={(e) => setRules(e.target.value)} />
            </div>
          </section>
        </div>

        {/* Right Column: Problems & Prizes */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          
          {/* Problem Selector */}
          <section className="bg-black/40 border border-cyan-900/30 p-6 rounded-xl backdrop-blur-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold uppercase tracking-widest">
                <Code size={16} /> Loadout (Problems)
              </div>
              <span className="text-xs bg-cyan-900/40 text-cyan-300 px-2 py-1 rounded">
                Selected: {selectedProblems.length}
              </span>
            </div>
            
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-[200px] max-h-[300px]">
              {isLoadingData ? (
                <div className="text-gray-500 text-sm italic text-center py-4">Fetching database...</div>
              ) : availableProblems.length === 0 ? (
                <div className="text-gray-500 text-sm italic text-center py-4">No problems found in collection.</div>
              ) : (
                availableProblems.map((prob) => {
                  const isSelected = selectedProblems.includes(prob.id);
                  return (
                    <div 
                      key={prob.id} 
                      onClick={() => toggleProblemSelection(prob.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                        ? 'bg-cyan-900/30 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                        : 'bg-white/5 border-white/5 hover:border-cyan-900/50 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-cyan-400 bg-cyan-500/20' : 'border-gray-600'}`}>
                          {isSelected && <div className="w-2 h-2 bg-cyan-400 rounded-sm" />}
                        </div>
                        <span className={`text-sm ${isSelected ? 'text-cyan-100 font-bold' : 'text-gray-400'}`}>
                          {prob.title}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${
                        prob.difficulty === 'Hard' ? 'text-red-400 bg-red-400/10' :
                        prob.difficulty === 'Medium' ? 'text-amber-400 bg-amber-400/10' :
                        'text-emerald-400 bg-emerald-400/10'
                      }`}>
                        {prob.difficulty || 'Normal'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Prize Pool with Badges */}
          <section className="bg-black/40 border border-amber-900/20 p-6 rounded-xl backdrop-blur-sm shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-bold uppercase tracking-widest">
                <Gift size={16} /> Spoils of War
              </div>
              <button type="button" onClick={() => setPrizes([...prizes, {rank: "", reward: "", badgeId: ""}])} className="text-[15px] text-amber-500 hover:text-amber-300 font-bold transition-colors">+ ADD PRIZE</button>
            </div>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {prizes.map((p, i) => (
                <div key={i} className="flex gap-2 bg-white/5 p-2 rounded border border-amber-900/20">
                  <input className="w-1/4 bg-black/40 border border-amber-900/20 p-2 rounded text-[14px] outline-none focus:border-amber-500 text-amber-100 placeholder-amber-900/50" placeholder="Rank (1st)" value={p.rank} onChange={(e) => updateArrayField(setPrizes, prizes, i, 'rank', e.target.value)} />
                  <input className="w-2/4 bg-black/40 border border-amber-900/20 p-2 rounded text-[14px] outline-none focus:border-amber-500 text-amber-200 placeholder-amber-900/50" placeholder="Reward (e.g. 500 XP)" value={p.reward} onChange={(e) => updateArrayField(setPrizes, prizes, i, 'reward', e.target.value)} />
                  
                  {/* Badge Dropdown */}
                  <select 
                    className="w-1/4 bg-black/40 border border-amber-900/20 p-2 rounded text-[14px] outline-none focus:border-amber-500 text-amber-400"
                    value={p.badgeId || ""}
                    onChange={(e) => updateArrayField(setPrizes, prizes, i, 'badgeId', e.target.value)}
                  >
                    <option value="">No Badge</option>
                    {availableBadges.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-amber-500/60 mt-3 italic">* For automation, use exact ranks like "1st", "2nd", "3rd", or "Participant".</p>
          </section>

          {/* Submit Action */}
          <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-red-900/40 border border-red-400/50 flex items-center justify-center gap-2 mt-2 shrink-0">
            <Target size={20} /> Deploy Arena
          </button>

        </div>
      </form>
    </div>
  );
};

export default AddContest;