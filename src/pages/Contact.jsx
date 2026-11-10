const Contact = () => {
  return (
    <div className="contact-page">
      <section className="contact-header">
        <h1>Kapcsolat</h1>
        <p>Lépj kapcsolatba velünk – örömmel segítünk!</p>
      </section>

      <section className="contact-container">
        <div className="contact-info">
          <div className="about-section">
            <h2>A Saphira Wedding Salon-ról</h2>
            <p>
              A Saphira Wedding Salon egy exkluzív menyasszonyi szalon, amely az esküvőd napjára az ideális ruhát keresi. 
              Több mint 15 év tapasztalattal, dedikált csapata személyre szabott tanácsadást nyújt minden menyasszonyt számára.
            </p>
            <p>
              Specialitásunk a nemzetközi kollekciók, a személyre szabott próbák és a teljes tanácsadás az ideális ruha 
              megtalálásáig. Az esküvő napja a te napod – segítünk, hogy tökéletes legyen!
            </p>
          </div>

          <div className="contact-details">
            <h3>Elérhetőségek</h3>
            <div className="detail-item">
              <span className="detail-icon">📍</span>
              <div>
                <strong>Cím:</strong>
                <p>Saphira Wedding Salon<br/>Budapest, 1051<br/>Világörökség utca 42.</p>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">📞</span>
              <div>
                <strong>Telefonszám:</strong>
                <p><a href="tel:+36301234567">+36 30 123 4567</a></p>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">✉️</span>
              <div>
                <strong>Email:</strong>
                <p><a href="mailto:info@sapphirasalon.hu">info@sapphirasalon.hu</a></p>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">🕐</span>
              <div>
                <strong>Nyitvatartás:</strong>
                <p>Hétfő - Péntek: 10:00 - 18:00<br/>Szombat: 10:00 - 16:00<br/>Vasárnap: Zárva</p>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-form-section">
          <h3>Küldjön üzenetet</h3>
          <form className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Név</label>
              <input type="text" id="name" name="name" required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" required />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Telefonszám</label>
              <input type="tel" id="phone" name="phone" />
            </div>
            <div className="form-group">
              <label htmlFor="message">Üzenet</label>
              <textarea id="message" name="message" rows="5" required></textarea>
            </div>
            <button type="submit" className="submit-btn">Küldés</button>
          </form>
        </div>
      </section>

      <section className="social-section">
        <h3>Kövesd a Saphira-t</h3>
        <div className="social-links">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-btn">Instagram</a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-btn">Facebook</a>
        </div>
      </section>
    </div>
  )
}

export default Contact
