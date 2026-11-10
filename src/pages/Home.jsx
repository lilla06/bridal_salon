const Home = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Találd meg a ruhát, amelyben igazán <span className="highlight">önmagad</span> vagy.</h1>
            <p>Szemelyere szabott ruhaproba, exkluziv kollekcio, es egy elmeny, ami csak rolad szol.</p>
            <div className="hero-buttons">
              <button className="btn-primary">IDŐPONTFOGLALÁS →</button>
              <button className="btn-secondary">KOLLEKCIÓNK →</button>
            </div>
          </div>
          <div className="hero-image">
            <div className="image-placeholder">Menyasszonyi Ruha Fotó</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">👗</div>
          <h3>SZEMELYÉRE SZABOTT<br/>PROBAK</h3>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💎</div>
          <h3>EXKLUZÍV<br/>NEMZETKÖZI<br/>KOLLEKCIÓK</h3>
        </div>
        <div className="feature-card">
          <div className="feature-icon">👰</div>
          <h3>PRÉMIUM ELMENY<br/>ROLAD SZOL</h3>
        </div>
        <div className="feature-card">
          <div className="feature-icon">❤️</div>
          <h3>AZ EMLÉK, AMI<br/>ÖROK MARAD</h3>
        </div>
      </section>

      {/* Footer Note */}
      <section className="footer-section">
        <div className="footer-content">
          <p className="footer-tagline">MERT A NAGY NAP<br/>MINDEN PILLANATA</p>
          <p className="footer-highlight">rólad szól.</p>
        </div>
      </section>
    </>
  )
}

export default Home
