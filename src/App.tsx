import { BrowserRouter, Routes, Route } from "react-router-dom"
import Layout from "./pages/Layout"
import Home from "./pages/Home"
import SinglePlayer from "./pages/SinglePlayer"
import Login from "./pages/Login"
import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="SinglePlayer" element={<SinglePlayer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
