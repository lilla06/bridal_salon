import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import Dresses from './pages/Dresses'
import Services from './pages/Services'
import Blog from './pages/Blog'
import Contact from './pages/Contact'
import Booking from './pages/Booking'
import Login from './pages/Login'
import Profile from './pages/Profile'
import AdminBookings from './pages/AdminBookings'
import { supabase } from './services/supabaseClient'
import './App.css'

function AppRouter() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const syncUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)
      } catch (err) {
        console.error('Session sync error:', err)
      }
    }

    syncUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription?.unsubscribe?.()
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <Router>
      <div className="app">
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

          <Navigation user={user} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dresses/:category" element={<Dresses />} />
            <Route path="/services" element={<Services />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/booking" element={<Booking user={user} />} />
            <Route path="/profil" element={<Profile user={user} onLogout={handleLogout} />} />
            <Route path="/admin" element={<AdminBookings user={user} onLogout={handleLogout} />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default AppRouter
