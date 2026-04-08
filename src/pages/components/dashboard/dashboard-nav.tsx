import { Code, Trophy, Bell, Search } from "lucide-react"
import { Link } from "react-router-dom"
import { useUser } from "../../../hooks/useUser"
import { auth } from "../../../../firebaseConfig";
import { signOut } from "firebase/auth";

export function DashboardNav() {
  const { userData, loading } = useUser();
  const profileimage = userData?.avatar || "/gamer-avatar.png";
  
  if (loading) {
    return (
      <div className="gaming-border gaming-glow bg-card rounded-lg">
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full"/>
        </div>
      </div>
    );
  }
  
  const userlogout = async () => {
    await signOut(auth);
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
  return (
    <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center h-14 px-4">
        {/* Left section - Logo and main nav */}
        <div className="flex items-center gap-8 flex-1">
          <Link to="/" className="text-xl font-bold text-white flex items-center gap-2">
            <Code size={24} className="text-cyan-400" />
            CodePVP
          </Link>
          
          <div className="hidden lg:flex items-center space-x-1">
            <Link to="/" className="px-3 py-2 text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-md text-sm">
              Home
            </Link>
            {/* <Link to="/SinglePlayer" className="px-3 py-2 text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-md text-sm">
              SinglePlayer
            </Link> */}
            <div className="relative group">
                 <Link to="/MultiPlayer">
              <button className="px-3 py-2 text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 rounded-md text-sm flex items-center gap-1">
                MultiPlayer
              </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Center section - Search */}
        <div className="flex-1 max-w-xl px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search problems..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-md pl-10 pr-4 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Right section - User menu */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-cyan-400 rounded-full hover:bg-gray-800/50">
            <Bell size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-cyan-400 rounded-full hover:bg-gray-800/50">
            <Trophy size={18} />
          </button>
           <button onClick={userlogout} className="p-2 text-gray-400 hover:text-cyan-400 rounded-full hover:bg-gray-800/50">
            Logout
          </button>
          
          <div className="ml-2 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <img src={profileimage} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          </div>
        </div>
      </div>
    </nav>
  )
}
