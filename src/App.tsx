import { BrowserRouter, Routes, Route } from "react-router-dom"
import Layout from "./pages/Layout"
import Home from "./pages/Home"
import SinglePlayer from "./pages/SinglePlayer"
import Signup from "./pages/Signup"
import Login from "./pages/Login"
import Problem from "./pages/Problem"
import './App.css'
import SoloShowdown from "./pages/SoloShowdown"

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="SinglePlayer" element={<SinglePlayer />} />
          <Route path="SoloShowdown" element={<SoloShowdown />} />
          <Route path="problems/:problemId" element={<Problem />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
