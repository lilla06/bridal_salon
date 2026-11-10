import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // Bejelentkezés
        if (!email || !password) {
          setError('Kérjük töltse ki az összes mezőt')
          setLoading(false)
          return
        }

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) {
          setError(signInError.message || 'Bejelentkezés sikertelen')
          setLoading(false)
          return
        }

        if (data.user) {
          console.log('Sikeres bejelentkezés:', data.user.email)
          navigate('/booking')
        }
      } else {
        // Regisztráció
        if (!name || !email || !password || !phone) {
          setError('Kérjük töltse ki az összes mezőt')
          setLoading(false)
          return
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
              phone: phone
            }
          }
        })

        if (signUpError) {
          setError(signUpError.message || 'Regisztráció sikertelen')
          setLoading(false)
          return
        }

        if (data.user) {
          console.log('Sikeres regisztráció:', data.user.email)
          alert('Regisztráció sikeres! Bejelentkeztél az időpontfoglaláshoz.')
          navigate('/booking')
        }
      }
    } catch (err) {
      setError(err.message || 'Hiba történt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <h1>{isLogin ? 'Bejelentkezés' : 'Regisztráció'}</h1>
          <p className="login-subtitle">
            {isLogin
              ? 'Bejelentkezz az időpontfoglaláshoz'
              : 'Regisztrálj az első időpontfoglalásodhoz'}
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}

            {!isLogin && (
              <>
                <div className="form-group">
                  <label htmlFor="name">Teljes név *</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Kiss Mária"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Telefonszám *</label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+36 30 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="email">Email cím *</label>
              <input
                id="email"
                type="email"
                placeholder="info@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Jelszó *</label>
              <input
                id="password"
                type="password"
                placeholder="Minimum 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Feldolgozás...' : isLogin ? 'Bejelentkezés' : 'Regisztráció'}
            </button>
          </form>

          <div className="login-toggle">
            <p>
              {isLogin ? 'Még nincs fiókod?' : 'Van már fiókod?'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                }}
                className="toggle-btn"
              >
                {isLogin ? 'Regisztrálj most' : 'Bejelentkezés'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
