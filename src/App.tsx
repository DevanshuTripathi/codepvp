import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Layout from "./pages/Layout"
import Home from "./pages/Home"
import SinglePlayer from "./pages/SinglePlayer"
import SinglePlayerProblem from "./pages/SinglePlayerProblem"
import Signup from "./pages/Signup"
import Login from "./pages/Login"
import Problem from "./pages/Problem"
import MultiPlayer from "./pages/MultiPlayer"
import RoomPage from "./pages/RoomPage"
import Problemset from "./pages/Problemset"
import GameFinishPage from "./pages/GameFinishPage"
import NotFound from "./pages/NotFound"
import Dashboard from "./pages/Dahboard"
import Onboarding from "./pages/onboarding"
import PixelPvP from "./pages/PixelPvP"
import FrontendQueue from "./pages/FrontendQueue"
import PixelPvPVote from "./pages/PixelPvPVote"
import TournamentList from "./pages/TournamentList"
import TournamentLobby from "./pages/TournamentLobby"
import './App.css'
import { UserProvider } from "./hooks/useUser"
import { Toaster } from "react-hot-toast"

// ADMIN COMPONENTS
import AdminRoute from "./pages/components/AdminRoute"
import AdminAddQuestion from "./pages/AddQuestion"
import AddTournament from "./pages/AddTournament"
import EditTournament from "./pages/EditTournament"
import ContestList from "./pages/ContestList"
import AddContest from "./pages/AddContest"
import Contest from "./pages/Contest"
import AboutUs from "./pages/AboutUs"
import Feedback from "./pages/Feedback"
import AddBadge from "./pages/AddBadge"
import AdminDashboard from "./pages/FeedBackDashboard"

function App() {

  const host = window.location.hostname;

  if (host.startsWith("about.")) {
    return <AboutUs />
  }

  return (
    <UserProvider>
      <BrowserRouter>
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
            },
          }} 
        />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="404" element={<NotFound />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="SinglePlayer" element={<SinglePlayer />} />
            <Route path="practice/:problemId" element={<SinglePlayerProblem />} />
            <Route path="MultiPlayer" element={<MultiPlayer />} />
            <Route path="room/:roomId" element={<RoomPage />} />
            <Route path="room/:roomId/problemset/team/:teamId" element={<Problemset />} />
            <Route path="room/:roomId/problems/:problemId/team/:teamId" element={<Problem />} />
            <Route path="room/:roomId/results" element={<GameFinishPage />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="PixelPvP" element={<FrontendQueue />} />
            <Route path="PixelPvP/room/:roomId" element={<PixelPvP />} />
            <Route path="PixelPvP/vote/:roomId" element={ <PixelPvPVote /> } />
            <Route path="tournaments" element={<TournamentList />} />
            <Route path="tournaments/:tournamentId" element={<TournamentLobby />} />
            <Route path="contests" element={<ContestList />} />
            <Route path="contests/:id" element={<Contest />} />
            <Route path="feedback/:roomId" element={<Feedback />} />

            {/* PROTECTED ADMIN ROUTE */}
            <Route 
              path="admin/add-problem" 
              element={
                <AdminRoute>
                  <AdminAddQuestion />
                </AdminRoute>
              } 
            />

            <Route 
              path="admin/add-tournament" 
              element={
                <AdminRoute>
                  <AddTournament />
                </AdminRoute>
              } 
            />

            <Route 
              path="admin/manage-tournament/:id" 
              element={
                <AdminRoute>
                  <EditTournament />
                </AdminRoute>
              } 
            />

            <Route
              path="admin/add-contest"
              element={
                <AdminRoute>
                  <AddContest />
                </AdminRoute>
              }
            />
            
            <Route
              path="admin/add-badge"
              element={
                <AdminRoute>
                  <AddBadge />
                </AdminRoute>
              }
            />

            <Route
              path="admin/feedback"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

          </Route>
          
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  )
}

export default App