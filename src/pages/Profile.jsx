import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

const Profile = ({ user, onLogout }) => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const userName = user?.user_metadata?.name || user?.name || user?.email || ''

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const loadBookings = async () => {
      try {
        setLoading(true)
        const today = new Date().toISOString().split('T')[0]
        const { data, error } = await supabase
          .from('availability')
          .select('*')
          .eq('booked_by_user_id', user.id)
          .gte('date', today)
          .in('status', ['booked', 'blocked'])

        if (error) throw error
        setBookings((data || []).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)))
      } catch (err) {
        console.error('Profile load error:', err)
        setBookings([])
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [user])

  const totalBookings = useMemo(() => bookings.length, [bookings])

  const cancelBooking = async (booking) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('availability')
        .update({
          status: 'available',
          booked_by_user_id: null,
          booked_at: null,
          blocked_reason: null
        })
        .eq('id', booking.id)

      if (error) throw error

      setBookings((current) => current.filter((item) => item.id !== booking.id))
    } catch (err) {
      alert(err.message || 'A foglalás törlése sikertelen.')
    }
  }

  if (!user) {
    return (
      <div className="profile-page empty-state-box">
        <h1>Profil</h1>
        <p>Még nincs bejelentkezve.</p>
        <div className="profile-actions">
          <Link to="/login" className="primary-btn">Belépés / regisztráció</Link>
          <Link to="/booking" className="secondary-btn">Időpontfoglalás</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div>
          <p className="eyebrow">Profil</p>
          <h1>{userName}</h1>
        </div>
        <button className="secondary-btn" onClick={async () => { await onLogout(); navigate('/'); }}>
          Kijelentkezés
        </button>
      </div>

      <div className="profile-section">
        <div className="profile-summary">
          <h2>Aktuális foglalásaim</h2>
          <span>{totalBookings} foglalás</span>
        </div>

        {loading ? (
          <p>Betöltés...</p>
        ) : totalBookings === 0 ? (
          <div className="empty-state-box">
            <p>Még nincs foglalása.</p>
            <Link to="/booking" className="primary-btn">Időpontfoglalás</Link>
          </div>
        ) : (
          <div className="booking-list">
            {bookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-card-header">
                  <strong>{booking.date}</strong>
                  <span>{booking.time}</span>
                </div>
                <p className="booking-status">Státusz: {booking.status === 'booked' ? 'Lefoglalva' : booking.status}</p>
                <div className="booking-actions">
                  <button className="danger-btn" onClick={() => cancelBooking(booking)}>Törlés</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
