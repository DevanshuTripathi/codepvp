import { Header } from "./components/header"
import { Sidebar } from "./components/sidebar"
import { MainContent } from "./components/main-content"
import { RightPanel } from "./components/right-panel"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <div className="flex">
        <Sidebar />
        <MainContent />
        <RightPanel />
      </div>
    </div>
  )
}
