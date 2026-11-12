import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

const Login = ({ setUser }) => {
  const isAdminUser = (user) => Boolean(
    user?.is_admin ||
    user?.user_metadata?.is_admin ||
    user?.app_metadata?.is_admin ||
    user?.email === 'admin@saphira.hu'
  )

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
          let isAdmin = isAdminUser(data.user)

          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', data.user.id)
            .maybeSingle()

          if (!profileError && profileData?.is_admin !== undefined) {
            isAdmin = Boolean(profileData.is_admin)
          }

          const enrichedUser = {
            ...data.user,
            is_admin: isAdmin,
            user_metadata: {
              ...(data.user.user_metadata || {}),
              is_admin: isAdmin,
            },
          }

          console.log('Sikeres bejelentkezés:', data.user.email, { isAdmin, profileData })
          setUser(enrichedUser)
          const nextPath = isAdmin ? '/admin' : '/profil'
          navigate(nextPath)
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
          setUser(data.user)
          alert('Regisztráció sikeres! Bejelentkeztél az időpontfoglaláshoz.')
          navigate('/profil')
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
