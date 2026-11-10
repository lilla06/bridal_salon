import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import Dresses from './pages/Dresses'
import Services from './pages/Services'
import Blog from './pages/Blog'
import Contact from './pages/Contact'
import Booking from './pages/Booking'
import Login from './pages/Login'
import './App.css'

function AppRouter() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Router>
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="header-top">
            <div className="contact-info">
              <span>IDŐPONTFOGLALÁS: +36 30 123 4567</span>
              <span>INFO@SAPPHIRASALON.HU</span>
            </div>
            <div className="social-links">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </div>
          </div>

          <Navigation menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        </header>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dresses/:category" element={<Dresses />} />
            <Route path="/services" element={<Services />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/booking" element={<Booking />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default AppRouter
