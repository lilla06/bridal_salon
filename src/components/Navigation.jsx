import { useState } from 'react'
import { Link } from 'react-router-dom'

const Navigation = ({ menuOpen, setMenuOpen }) => {
  const [dressDropdownOpen, setDressDropdownOpen] = useState(false)

  const dressCategories = [
    { label: 'Összes ruha', value: 'all' },
    { label: 'A-vonalú ruha', value: 'a-line' },
    { label: 'Báli ruha', value: 'ball-gown' },
    { label: 'Sellő fazonú ruha', value: 'mermaid' },
    { label: 'Egyenes fazonú ruha', value: 'straight' }
  ]

  const handleMenuItemClick = () => {
    setMenuOpen(false)
  }

  const handleDressDropdownToggle = (e) => {
    e.preventDefault()
    setDressDropdownOpen(!dressDropdownOpen)
  }

  const handleDressSubClick = () => {
    setMenuOpen(false)
    setDressDropdownOpen(false)
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand-logo" aria-label="Saphira salon home">
        <img src="/saphira.png" alt="Saphira salon logo" className="brand-wordmark" />
      </Link>
      <button 
        className="hamburger" 
        onClick={() => setMenuOpen(!menuOpen)} 
        aria-label="Menu"
      >
        <span className={menuOpen ? 'open' : ''}></span>
        <span className={menuOpen ? 'open' : ''}></span>
        <span className={menuOpen ? 'open' : ''}></span>
      </button>
      <ul className={`nav-menu ${menuOpen ? 'active' : ''}`}>
        <li>
          <Link to="/" onClick={handleMenuItemClick}>
            FŐOLDAL
          </Link>
        </li>
        <li 
          className="dropdown"
          onMouseEnter={() => setDressDropdownOpen(true)}
          onMouseLeave={() => setDressDropdownOpen(false)}
        >
          <button
            className="dropdown-toggle"
            onClick={handleDressDropdownToggle}
          >
            RUHÁINK
          </button>
          <ul className={`dropdown-menu ${dressDropdownOpen ? 'active' : ''}`}>
            {dressCategories.map((category) => (
              <li key={category.value}>
                <Link 
                  to={`/dresses/${category.value}`} 
                  onClick={handleDressSubClick}
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </li>
        <li>
          <Link to="/services" onClick={handleMenuItemClick}>
            SZOLGÁLTATÁSOK
          </Link>
        </li>
        <li>
          <Link to="/blog" onClick={handleMenuItemClick}>
            BLOG
          </Link>
        </li>
        <li>
          <Link to="/contact" onClick={handleMenuItemClick}>
            KAPCSOLAT
          </Link>
        </li>
      </ul>
      <Link to="/booking" className="booking-btn">IDŐPONTFOGLALÁS</Link>
    </nav>
  )
}

export default Navigation
