import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../services/supabaseClient'

const SALON_INFO = {
  name: 'Saphira Wedding Salon',
  address: 'Budapest, 1051\nVilágörökség utca 42.'
}

const Booking = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [availableSlots, setAvailableSlots] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 768)
  const [mockedSlots, setMockedSlots] = useState(null)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  
  // Modal states
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading2, setAuthLoading2] = useState(false)
  
  // Booking confirmation
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  
  // Cancel booking modal
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelSlotData, setCancelSlotData] = useState(null)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[checkAuth] Checking session...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('[checkAuth] getSession result:', session?.user?.email)
        
        if (session?.user) {
          setUser(session.user)
          console.log('[checkAuth] User set from session:', session.user.email)
        } else {
          setUser(null)
          console.log('[checkAuth] No session found')
        }
      } catch (err) {
        console.error('[checkAuth] Error getting session:', err)
        setUser(null)
      }
      
      setAuthLoading(false)

      try {
        console.log('[checkAuth] Setting up auth state listener...')
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          console.log('[onAuthStateChange] Event:', _event, 'User:', session?.user?.email)
          setUser(session?.user || null)
        })

        return () => {
          console.log('[checkAuth] Cleaning up auth state listener')
          subscription?.unsubscribe?.()
        }
      } catch (err) {
        console.error('[checkAuth] Error setting up auth state listener:', err)
      }
    }

    checkAuth()
  }, [])

  // Generate dates for display
  const getWeekDates = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    
    const week = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      week.push(new Date(date))
    }
    return week
  }

  const getDayDate = (date) => {
    return [new Date(date)]
  }

  // Listen to window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Determine which dates to display - memoized to prevent flickering
  const isMobile = windowWidth < 768
  const displayDates = useMemo(() => {
    return isMobile ? getDayDate(selectedDate) : getWeekDates(selectedDate)
  }, [selectedDate, isMobile])

  // Fetch availability from Supabase
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get date range for query
        const startDate = new Date(displayDates[0])
        startDate.setHours(0, 0, 0, 0)
        
        const endDate = new Date(displayDates[displayDates.length - 1])
        endDate.setHours(23, 59, 59, 999)

        // Create slots object with default availability (all available = ✓)
        const slotsByDateTime = {}
        displayDates.forEach(date => {
          const dateStr = date.toISOString().split('T')[0]
          for (let hour = 10; hour < 19; hour++) {
            const timeStr = `${hour.toString().padStart(2, '0')}:00`
            const key = `${dateStr}-${timeStr}`
            slotsByDateTime[key] = {
              status: 'available',
              isDefault: true
            }
          }
        })

        // Query only booked/blocked slots from database
        const { data, error: fetchError } = await supabase
          .from('availability')
          .select('*')
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0])
          .in('status', ['booked', 'blocked'])

        if (fetchError) throw fetchError

        // Override only non-available slots
        if (data && data.length > 0) {
          data.forEach(slot => {
            const key = `${slot.date}-${slot.time}`
            if (slotsByDateTime[key]) {
              slotsByDateTime[key] = {
                status: slot.status, // 'booked' or 'blocked'
                bookedBy: slot.booked_by_user_id,
                bookedAt: slot.booked_at,
                blockedReason: slot.blocked_reason,
                isDefault: false
              }
            }
          })
        }

        setAvailableSlots(slotsByDateTime)
      } catch (err) {
        console.error('Error fetching availability:', err)
        // Cache and use mock data only once
        if (!mockedSlots) {
          const mockSlots = {}
          displayDates.forEach(date => {
            const dateStr = date.toISOString().split('T')[0]
            for (let hour = 10; hour < 19; hour++) {
              const timeStr = `${hour.toString().padStart(2, '0')}:00`
              const key = `${dateStr}-${timeStr}`
              mockSlots[key] = {
                status: 'available',
                isDefault: true
              }
            }
          })
          setMockedSlots(mockSlots)
          setAvailableSlots(mockSlots)
        } else {
          setAvailableSlots(mockedSlots)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [displayDates, mockedSlots])

  const handlePrevious = () => {
    const newDate = new Date(selectedDate)
    if (isMobile) {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() - 7)
    }
    setSelectedDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(selectedDate)
    if (isMobile) {
      newDate.setDate(newDate.getDate() + 1)
    } else {
      newDate.setDate(newDate.getDate() + 7)
    }
    setSelectedDate(newDate)
  }

  const formatDate = (date) => {
    const options = { month: 'short', day: 'numeric', weekday: 'short' }
    return date.toLocaleDateString('hu-HU', options)
  }

  const formatDateFull = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
    return date.toLocaleDateString('hu-HU', options)
  }

  const handleSlotClick = (date, time) => {
    console.log('[handleSlotClick] Called with date:', date, 'time:', time, 'user:', user)
    if (!user) {
      console.log('[handleSlotClick] No user, opening login modal')
      setShowLoginModal(true)
      return
    }

    const key = `${date.toISOString().split('T')[0]}-${time}`
    const slotData = availableSlots[key]
    console.log('[handleSlotClick] Slot data:', slotData)
    
    if (slotData && slotData.status === 'available') {
      setSelectedSlot({ date, time })
      setShowConfirmation(true)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading2(true)

    try {
      if (isLoginMode) {
        if (!email || !password) {
          setAuthError('Kérjük töltse ki az összes mezőt')
          setAuthLoading2(false)
          return
        }

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) {
          setAuthError(signInError.message || 'Bejelentkezés sikertelen')
          setAuthLoading2(false)
          return
        }

        if (data.user) {
          setUser(data.user)
          setShowLoginModal(false)
          setEmail('')
          setPassword('')
        }
      } else {
        if (!name || !email || !password || !phone) {
          setAuthError('Kérjük töltse ki az összes mezőt')
          setAuthLoading2(false)
          return
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, phone }
          }
        })

        if (signUpError) {
          setAuthError(signUpError.message || 'Regisztráció sikertelen')
          setAuthLoading2(false)
          return
        }

        if (data.user) {
          setUser(data.user)
          setShowLoginModal(false)
          setEmail('')
          setPassword('')
          setName('')
          setPhone('')
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Hiba történt')
    } finally {
      setAuthLoading2(false)
    }
  }

  const handleConfirmBooking = async () => {
    console.log('[handleConfirmBooking] Called')
    console.log('[handleConfirmBooking] selectedSlot:', selectedSlot)
    console.log('[handleConfirmBooking] user:', user)

    if (!selectedSlot || !user) {
      console.log('[handleConfirmBooking] Missing selectedSlot or user, returning')
      alert('Bejelentkezés szükséges!')
      return
    }

    setBookingSubmitting(true)
    try {
      const dateStr = selectedSlot.date.toISOString().split('T')[0]
      const todayStr = new Date().toISOString().split('T')[0]
      const now = new Date().toISOString()

      const { data: existingFutureBookings, error: existingError } = await supabase
        .from('availability')
        .select('id, date, time, status')
        .eq('booked_by_user_id', user.id)
        .gte('date', todayStr)
        .in('status', ['booked', 'blocked'])

      if (existingError) throw existingError

      if ((existingFutureBookings || []).length > 0) {
        alert('Már van egy jövőbeni foglalásod. Előbb mond le a meglévő időpontot, mielőtt újat foglalnál.')
        setBookingSubmitting(false)
        return
      }

      console.log('[handleConfirmBooking] Attempting booking with:', {
        date: dateStr,
        time: selectedSlot.time,
        user_id: user.id,
        status: 'booked',
        booked_at: now
      })

      const { data, error } = await supabase
        .from('availability')
        .upsert({
          date: dateStr,
          time: selectedSlot.time,
          status: 'booked',
          booked_by_user_id: user.id,
          booked_at: now,
          blocked_reason: null
        }, {
          onConflict: 'date,time'
        })

      console.log('[handleConfirmBooking] UPSERT response:', { data, error })

      if (error) {
        console.error('[handleConfirmBooking] UPSERT error:', error)
        alert(`Foglalás sikertelen: ${error.message}`)
        setError(`Foglalás sikertelen: ${error.message}`)
        setBookingSubmitting(false)
        return
      }

      console.log('[handleConfirmBooking] UPSERT successful:', data)

      const key = `${dateStr}-${selectedSlot.time}`
      setAvailableSlots(prev => ({
        ...prev,
        [key]: {
          status: 'booked',
          bookedBy: user.id
        }
      }))

      alert(`Sikeres foglalás! ${formatDateFull(selectedSlot.date)} ${selectedSlot.time}`)
      setSelectedDate(new Date(selectedSlot.date))
      setShowConfirmation(false)
      setSelectedSlot(null)

      setTimeout(() => {
        console.log('[handleConfirmBooking] Refreshing availability from database...')
        setLoading(true)
      }, 500)
    } catch (err) {
      console.error('[handleConfirmBooking] Exception:', err)
      alert(`Hiba: ${err.message}`)
      setError(err.message || 'Hiba történt a foglalás során')
    } finally {
      setBookingSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setShowLoginModal(false)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const handleCancelBooking = async (date, time) => {
    console.log('[handleCancelBooking] Called', date, time)
    
    if (!user) {
      console.log('[handleCancelBooking] No user')
      return
    }

    setCancelSubmitting(true)
    try {
      const dateStr = date.toISOString().split('T')[0]
      console.log('[handleCancelBooking] Cancelling booking:', dateStr, time, 'user:', user.id)
      
      const { data, error } = await supabase
        .from('availability')
        .update({
          status: 'available',
          booked_by_user_id: null,
          booked_at: null,
          blocked_reason: null
        })
        .eq('date', dateStr)
        .eq('time', time)
        .eq('booked_by_user_id', user.id)

      console.log('[handleCancelBooking] Response:', { data, error })

      if (error) {
        console.error('[handleCancelBooking] Error:', error)
        alert(`Lemondás sikertelen: ${error.message}`)
        setCancelSubmitting(false)
        return
      }

      console.log('[handleCancelBooking] Cancel successful')
      
      // Immediately update the UI by refreshing availableSlots
      const key = `${dateStr}-${time}`
      setAvailableSlots(prev => ({
        ...prev,
        [key]: { status: 'available', bookedBy: null }
      }))
      
      // Close modal and show success
      setSelectedDate(new Date(date))
      setShowCancelModal(false)
      setCancelSlotData(null)
      alert(`Foglalás lemondva! ${formatDateFull(date)} ${time}`)
      
      // Also refresh from database for accuracy
      setLoading(true)
    } catch (err) {
      console.error('[handleCancelBooking] Exception:', err)
      alert(err.message || 'Hiba történt a lemondás során')
    } finally {
      setCancelSubmitting(false)
    }
  }


  const generateHours = () => {
    const hours = []
    for (let i = 10; i < 20; i++) {
      hours.push(`${i.toString().padStart(2, '0')}:00`)
    }
    return hours
  }

  const hours = generateHours()

  if (authLoading) {
    return <div className="booking-page"><div className="booking-container">Betöltés...</div></div>
  }

  return (
    <div className="booking-page">
      <div className="booking-header">
        <div className="booking-header-top">
          <div>
            <h1>Időpontfoglalás</h1>
            <p>Válassz egy szabad időpontot az esküvői ruhapróbádhoz</p>
          </div>
          {user && (
            <div className="user-info">
              <span className="user-email">{user.email}</span>
              <button onClick={handleLogout} className="logout-btn">Kijelentkezés</button>
            </div>
          )}
        </div>
      </div>

      <div className="booking-container">
        {/* Date Navigation */}
        <div className="booking-nav">
          <button onClick={handlePrevious} className="nav-btn">← Előző</button>
          <h2 className="date-display">
            {isMobile ? formatDateFull(selectedDate) : `${formatDateFull(displayDates[0])} - ${formatDateFull(displayDates[6])}`}
          </h2>
          <button onClick={handleNext} className="nav-btn">Következő →</button>
        </div>

        {/* Calendar/Time Slot Grid */}
        <div className="booking-grid">
          {/* Header with dates */}
          <div className="booking-header-row">
            <div className="time-column">Idő</div>
            {displayDates.map((date, idx) => (
              <div key={idx} className="date-column">
                <div className="date-label">{formatDate(date)}</div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          {hours.map(time => (
            <div key={time} className="time-row">
              <div className="time-label">{time}</div>
              {displayDates.map((date, idx) => {
                const dateStr = date.toISOString().split('T')[0]
                const key = `${dateStr}-${time}`
                const slotData = availableSlots[key]
                const isPast = date < new Date()
                const isMyBooking = user && slotData && slotData.status === 'booked' && slotData.bookedBy === user.id
                
                // Determine slot status
                let className = 'available'
                let icon = '✓'
                let title = user ? 'Kattints a foglaláshoz' : 'Jelentkezz be a foglaláshoz'
                
                if (isPast) {
                  className = 'past'
                  icon = '✗'
                  title = 'Múlt'
                } else if (isMyBooking) {
                  className = 'booked-by-me'
                  icon = '✓'
                  title = 'Az én foglalásom - kattints a lemondáshoz'
                } else if (slotData && (slotData.status === 'booked' || slotData.status === 'blocked')) {
                  className = 'unavailable'
                  icon = '✗'
                  title = slotData.status === 'blocked' ? 'Blokkolt időpont' : 'Foglalt'
                }

                return (
                  <div
                    key={idx}
                    className={`time-slot ${className} ${user && (className === 'available' || className === 'booked-by-me') ? 'clickable' : ''}`}
                    title={title}
                    onClick={() => {
                      if (isMyBooking) {
                        console.log('[SlotClick] Opening cancel modal for:', date, time)
                        setCancelSlotData({ date, time, slotData })
                        setShowCancelModal(true)
                      } else {
                        handleSlotClick(date, time)
                      }
                    }}
                    style={{
                      cursor: user && (className === 'available' || className === 'booked-by-me') ? 'pointer' : 'default'
                    }}
                  >
                    {isMyBooking ? (
                      <span className="slot-booked-label">Lefoglalva</span>
                    ) : icon}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Login Button - shown when not logged in */}
        {!user && (
          <div className="booking-footer">
            <button onClick={() => {
              console.log('[LOGIN BUTTON] Opening modal')
              setShowLoginModal(true)
            }} className="login-btn">
              Belépés az időpontfoglaláshoz
            </button>
            <p className="booking-info">Bejelentkezés után rögzítheted az időpontodat</p>
          </div>
        )}
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLoginModal(false)}>✕</button>
            <h2>{isLoginMode ? 'Bejelentkezés' : 'Regisztráció'}</h2>
            
            <form onSubmit={handleLogin}>
              {authError && <div className="error-message">{authError}</div>}
              
              {!isLoginMode && (
                <>
                  <div className="form-group">
                    <label>Teljes név *</label>
                    <input
                      type="text"
                      placeholder="Kiss Mária"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Telefonszám *</label>
                    <input
                      type="tel"
                      placeholder="+36 30 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label>Email cím *</label>
                <input
                  type="email"
                  placeholder="info@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Jelszó *</label>
                <input
                  type="password"
                  placeholder="Minimum 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <button type="submit" className="login-btn" disabled={authLoading2}>
                {authLoading2 ? 'Feldolgozás...' : isLoginMode ? 'Bejelentkezés' : 'Regisztráció'}
              </button>
            </form>
            
            <button 
              className="toggle-link"
              onClick={() => {
                setIsLoginMode(!isLoginMode)
                setAuthError('')
              }}
            >
              {isLoginMode ? 'Nincs még fiókod? Regisztrálj most' : 'Van már fiókod? Bejelentkezés'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && selectedSlot && (
        <div className="modal-overlay" onClick={() => setShowConfirmation(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowConfirmation(false)}>✕</button>
            <h2>Időpont megerősítése</h2>
            
            <p className="confirmation-text">
              Biztosan ezt az időpontot szeretnéd választani?
            </p>
            
            <div className="confirmation-details">
              <p><strong>Dátum:</strong> {formatDateFull(selectedSlot.date)}</p>
              <p><strong>Idő:</strong> {selectedSlot.time}</p>
            </div>
            
            <div className="modal-buttons">
              <button 
                onClick={() => setShowConfirmation(false)}
                className="cancel-btn"
              >
                Mégse
              </button>
              <button 
                onClick={handleConfirmBooking}
                className="confirm-btn"
                disabled={bookingSubmitting}
              >
                {bookingSubmitting ? 'Mentés...' : 'Foglalás megerősítése'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && cancelSlotData && (
        <div className="modal-overlay" onClick={() => !cancelSubmitting && setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => !cancelSubmitting && setShowCancelModal(false)}
            >
              ✕
            </button>
            <h2>Foglalás lemondása</h2>
            
            <div className="confirmation-details">
              <p><strong>Szalon:</strong> {SALON_INFO.name}</p>
              <p><strong>Cím:</strong> {SALON_INFO.address}</p>
              <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #ddd' }} />
              <p><strong>Foglalt időpont:</strong></p>
              <p>Dátum: {formatDateFull(cancelSlotData.date)}</p>
              <p>Idő: {cancelSlotData.time}</p>
            </div>
            
            <div className="modal-buttons">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="cancel-btn"
                disabled={cancelSubmitting}
              >
                Mégsem
              </button>
              <button 
                onClick={() => handleCancelBooking(cancelSlotData.date, cancelSlotData.time)}
                className="confirm-btn"
                disabled={cancelSubmitting}
                style={{ backgroundColor: '#d32f2f' }}
              >
                {cancelSubmitting ? 'Lemondás...' : 'Foglalás lemondása'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Booking
