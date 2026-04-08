import { ProfileHeader } from "./components/dashboard/profile-header"


import { Languages } from "./components/dashboard/languages"
import { ProblemStats } from "./components/dashboard/problem-stats"
import { BadgeSection } from "./components/dashboard/badge-section"
import { ActivityHeatmap as RatingGraph } from "./components/dashboard/activity-heatmap"

import { DashboardNav } from "./components/dashboard/dashboard-nav"
import AnimatedBackground from './components/AnimatedBackground'
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { useEffect } from "react"
import AdComponent from "./components/AdComponent"

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useUser()
    
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]); 

  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full"/>
      </div>
    );
  }


  if (!user) {
    return null;
  }

  // Main dashboard content
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AnimatedBackground />
      <DashboardNav />
      
      {/* Main Content */}
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-xl p-6 shadow-lg hover:border-gray-700 transition-colors">
                <ProfileHeader />
                <AdComponent />
              </div>
              
             
              
              <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-xl p-6 shadow-lg hover:border-gray-700 transition-colors">
                <Languages />
              </div>
            </div>

            {/* Middle & Right Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-xl p-6 shadow-lg hover:border-gray-700 transition-colors">
                  <ProblemStats />
                </div>
                <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-xl p-6 shadow-lg hover:border-gray-700 transition-colors">
                  <BadgeSection />
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-xl p-6 shadow-lg hover:border-gray-700 transition-colors">
                <RatingGraph />
              </div>

            
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
