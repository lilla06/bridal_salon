import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

const getWeekDates = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)

  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(monday)
    next.setDate(monday.getDate() + index)
    return next
  })
}

const formatDate = (date) => {
  return new Intl.DateTimeFormat('hu-HU', { month: 'short', day: 'numeric', weekday: 'short' }).format(date)
}

const formatDateFull = (date) => {
  return new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(date)
}

const isAdminUser = (currentUser) => Boolean(
  currentUser?.is_admin ||
  currentUser?.user_metadata?.is_admin ||
  currentUser?.app_metadata?.is_admin ||
  currentUser?.email === 'admin@saphira.hu'
)

const AdminBookings = ({ user, onLogout }) => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [slotMap, setSlotMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [draftStatus, setDraftStatus] = useState('booked')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const displayDates = useMemo(() => getWeekDates(selectedDate), [selectedDate])
  const hours = useMemo(() => Array.from({ length: 10 }, (_, index) => `${String(10 + index).padStart(2, '0')}:00`), [])

  useEffect(() => {
    if (!user || !isAdminUser(user)) {
      navigate('/profil')
      return
    }

    const loadSlots = async () => {
      try {
        setLoading(true)
        const start = new Date(displayDates[0])
        start.setHours(0, 0, 0, 0)
        const end = new Date(displayDates[displayDates.length - 1])
        end.setHours(23, 59, 59, 999)

        const { data, error } = await supabase
          .from('availability')
          .select('*')
          .gte('date', start.toISOString().split('T')[0])
          .lte('date', end.toISOString().split('T')[0])

        if (error) throw error

        const nextMap = {}
        displayDates.forEach((date) => {
          const dateStr = date.toISOString().split('T')[0]
          hours.forEach((time) => {
            nextMap[`${dateStr}-${time}`] = {
              date: dateStr,
              time,
              status: 'available',
              blocked_reason: null,
              booked_by_user_id: null,
              booked_at: null,
              id: null
            }
          })
        })

        ;(data || []).forEach((slot) => {
          nextMap[`${slot.date}-${slot.time}`] = { ...slot }
        })

        setSlotMap(nextMap)
      } catch (err) {
        console.error('Admin load error:', err)
        setSlotMap({})
      } finally {
        setLoading(false)
      }
    }

    loadSlots()
  }, [navigate, user, displayDates, hours])

  const handlePrevious = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() - 7)
    setSelectedDate(next)
  }

  const handleNext = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + 7)
    setSelectedDate(next)
  }

  const openSlotEditor = (date, time, slot) => {
    const row = slot || {
      date: date.toISOString().split('T')[0],
      time,
      status: 'available',
      blocked_reason: null,
      booked_by_user_id: null,
      booked_at: null,
      id: null
    }

    setSelectedSlot(row)
    setDraftStatus(row.status || 'available')
  }

  const saveSlotStatus = async () => {
    if (!selectedSlot) return

    setSaving(true)
    try {
      const payload = {
        date: selectedSlot.date,
        time: selectedSlot.time,
        status: draftStatus,
        blocked_reason: draftStatus === 'blocked' ? (selectedSlot.blocked_reason || 'Admin by admin panel') : null,
        booked_by_user_id: draftStatus === 'booked' ? (selectedSlot.booked_by_user_id || null) : null,
        booked_at: draftStatus === 'booked' ? (selectedSlot.booked_at || new Date().toISOString()) : null
      }

      const { error } = await supabase
        .from('availability')
        .upsert(payload, { onConflict: 'date,time' })

      if (error) throw error

      setSlotMap((current) => ({
        ...current,
        [`${selectedSlot.date}-${selectedSlot.time}`]: {
          ...current[`${selectedSlot.date}-${selectedSlot.time}`],
          ...payload,
          id: current[`${selectedSlot.date}-${selectedSlot.time}`]?.id || null
        }
      }))

      setSelectedSlot(null)
    } catch (err) {
      alert(err.message || 'A státusz módosítása sikertelen.')
    } finally {
      setSaving(false)
    }
  }

  const totalBooked = useMemo(
    () => Object.values(slotMap).filter((slot) => slot.status === 'booked' || slot.status === 'blocked').length,
    [slotMap]
  )

  if (!user || !isAdminUser(user)) {
    return null
  }

  return (
    <div className="admin-page">
      <div className="profile-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Összes foglalás</h1>
        </div>
        <button className="secondary-btn" onClick={async () => { await onLogout(); navigate('/'); }}>
          Kijelentkezés
        </button>
      </div>

      <div className="admin-toolbar">
        <span>Összes aktív foglalás: {totalBooked}</span>
      </div>

      <div className="booking-nav">
        <button onClick={handlePrevious} className="nav-btn">← Előző</button>
        <h2 className="date-display">{`${formatDateFull(displayDates[0])} - ${formatDateFull(displayDates[6])}`}</h2>
        <button onClick={handleNext} className="nav-btn">Következő →</button>
      </div>

      {loading ? (
        <p>Betöltés...</p>
      ) : (
        <div className="booking-grid">
          <div className="booking-header-row">
            <div className="time-column">Idő</div>
            {displayDates.map((date, index) => (
              <div key={index} className="date-column">
                <div className="date-label">{formatDate(date)}</div>
              </div>
            ))}
          </div>

          {hours.map((time) => (
            <div key={time} className="time-row">
              <div className="time-label">{time}</div>
              {displayDates.map((date, index) => {
                const dateStr = date.toISOString().split('T')[0]
                const key = `${dateStr}-${time}`
                const slot = slotMap[key] || { date: dateStr, time, status: 'available' }
                const status = slot.status || 'available'
                const className = status === 'available' ? 'available' : status === 'booked' ? 'booked-by-me' : status === 'blocked' ? 'unavailable' : 'past'
                const label = status === 'available' ? '✓' : status === 'booked' ? 'Foglalt' : status === 'blocked' ? 'Blokkolt' : '✗'

                return (
                  <div
                    key={index}
                    className={`time-slot ${className} clickable`}
                    title={status === 'available' ? 'Szabad' : status === 'booked' ? 'Foglalt' : status === 'blocked' ? 'Blokkolt' : status}
                    onClick={() => openSlotEditor(date, time, slot)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="slot-booked-label">{label}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {selectedSlot && (
        <div className="modal-overlay" onClick={() => setSelectedSlot(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedSlot(null)}>✕</button>
            <h2>Időpont részletei</h2>
            <p><strong>Dátum:</strong> {formatDateFull(new Date(`${selectedSlot.date}T12:00:00`))}</p>
            <p><strong>Idő:</strong> {selectedSlot.time}</p>

            {selectedSlot.status === 'booked' || selectedSlot.status === 'blocked' ? (
              <>
                <p><strong>Foglalta:</strong> {selectedSlot.customer_name || selectedSlot.booked_by_user_id || 'Ismeretlen'}</p>
                <p><strong>Email:</strong> {'Nincs megadva a valós adatbázisban'}</p>
              </>
            ) : (
              <p><strong>Státusz:</strong> Szabad</p>
            )}

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Állapot</label>
              <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                <option value="available">Szabad</option>
                <option value="booked">Foglalt</option>
                <option value="blocked">Blokkolt</option>
              </select>
            </div>

            <div className="modal-buttons" style={{ marginTop: '1rem' }}>
              <button className="cancel-btn" onClick={() => setSelectedSlot(null)} disabled={saving}>Mégse</button>
              <button className="confirm-btn" onClick={saveSlotStatus} disabled={saving}>
                {saving ? 'Mentés...' : 'Mentés'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBookings
