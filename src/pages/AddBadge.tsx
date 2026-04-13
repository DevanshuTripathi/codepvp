import React, { useState } from "react";
import { db } from "../../firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Award, Info, Image as ImageIcon, Sparkles, ShieldCheck, Tag } from "lucide-react";
import toast from "react-hot-toast";

const AddBadge = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [rarity, setRarity] = useState("Common");
  const [category, setCategory] = useState("Contest");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      toast.error("Name and description are required.");
      return;
    }

    setLoading(true);
    try {
      // Create a URL-friendly ID (e.g., "first-codepvp-winner")
      const badgeId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      await setDoc(doc(db, "Badges", badgeId), {
        id: badgeId,
        name,
        description,
        imageUrl,
        rarity,
        category,
        createdAt: serverTimestamp(),
      });

      toast.success("Badge Successfully Forged! 🛡️");
      
      // Reset form
      setName("");
      setDescription("");
      setImageUrl("");
      setRarity("Common");
      setCategory("Contest");
    } catch (err) {
      console.error(err);
      toast.error("Error forging badge.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-950 min-h-screen text-gray-200 font-mono">
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between border-b border-purple-500/20 pb-4">
        <div>
          <h1 className="text-3xl font-black text-purple-500 tracking-tighter uppercase italic drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
            Badge Forge <span className="text-white">Admin</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1">Deploying to: Badges Collection</p>
        </div>
        <Award className="text-purple-500 w-8 h-8 animate-pulse" />
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        <section className="bg-black/40 border border-white/5 p-6 rounded-xl backdrop-blur-sm space-y-6 shadow-lg shadow-purple-900/10">
          <div className="flex items-center gap-2 mb-4 text-purple-400 text-sm font-bold uppercase tracking-widest">
            <Info size={16} /> Achievement Metadata
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Badge Name */}
            <div>
              <label className="text-[16px] text-purple-400 uppercase ml-1">Badge Name</label>
              <input 
                className="w-full bg-gray-900 border border-purple-900/50 p-3 rounded-lg outline-none focus:border-purple-500 text-sm mt-1" 
                placeholder="e.g. First Arena Champion" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>

            {/* Category Section */}
            <div>
              <label className="text-[16px] text-emerald-400 uppercase ml-1 flex items-center gap-2">
                <Tag size={14}/> Category
              </label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-900 border border-emerald-900/50 p-3 rounded-lg outline-none focus:border-emerald-500 text-sm text-emerald-400 mt-1"
              >
                <option value="Contest">Contest</option>
                <option value="Tournament">Tournament</option>
                <option value="Streak">Streak</option>
                <option value="Milestone">Milestone</option>
                <option value="Special">Special Event</option>
              </select>
            </div>
            
            {/* Rarity Tier */}
            <div>
              <label className="text-[16px] text-amber-400 uppercase ml-1 flex items-center gap-2">
                <Sparkles size={14}/> Rarity Tier
              </label>
              <select 
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
                className="w-full bg-gray-900 border border-amber-900/50 p-3 rounded-lg outline-none focus:border-amber-500 text-sm text-amber-400 mt-1"
              >
                <option value="Common">Common (Gray)</option>
                <option value="Rare">Rare (Blue)</option>
                <option value="Epic">Epic (Purple)</option>
                <option value="Legendary">Legendary (Gold)</option>
              </select>
            </div>

            {/* Image URL */}
            <div>
              <label className="text-[16px] text-cyan-400 uppercase ml-1 flex items-center gap-2">
                <ImageIcon size={14}/> Image URL (Optional)
              </label>
              <input 
                className="w-full bg-gray-900 border border-cyan-900/50 p-3 rounded-lg outline-none focus:border-cyan-500 text-sm mt-1" 
                placeholder="https://imgur.com/... (Leave blank for default icon)" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)} 
              />
            </div>
          </div>

          {/* Lore / Description */}
          <div>
            <label className="text-[16px] text-purple-400 uppercase ml-1">Lore (Description)</label>
            <textarea 
              className="w-full bg-gray-900 border border-purple-900/50 p-4 rounded-lg h-24 font-mono text-sm outline-none focus:border-purple-500 resize-none mt-1" 
              placeholder="Awarded for surviving the midnight bloodbath..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-purple-900/40 border border-purple-400/50 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            <ShieldCheck size={20} /> {loading ? "Forging..." : "Forge Badge"}
          </button>
        </section>
      </form>
    </div>
  );
};

export default AddBadge;