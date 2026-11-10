const Services = () => {
  const services = [
    {
      id: 1,
      icon: '👰',
      title: 'Ingyenes 1 Órás Ruhapróba',
      description: 'Fedezd fel a tökéletes ruhát tanácsadónk segítségével. Személyre szabott ajánlások és teljes támogatás az ideális menyasszonyi ruha kiválasztásában.',
      details: [
        'Szemelyesen maradtok egymás mellett',
        'Szakértői tanácsadás',
        'Lehetőség több ruha kipróbálására',
        'Személyre szabott ajánlások'
      ]
    },
    {
      id: 2,
      icon: '📏',
      title: 'Ruha Éretre Igazítás',
      description: 'Gondoskodunk arról, hogy a ruha tökéletesen illeszkedjen az alakodra. Profi szabóink biztosítják az ideális passformát és kényelmet.',
      details: [
        'Méretre szabás',
        'Hossz és szélességi módosítások',
        'Professzionális szabóművek',
        'Gyors kivitelezés'
      ]
    },
    {
      id: 3,
      icon: '💎',
      title: 'Teljes Tanácsadás',
      description: 'Az esküvő napja felkészítésben végig melletted vagyunk. Segítünk a stílus kiválasztásában, kiegészítőkben és minden egyéb szükséges részletben.',
      details: [
        'Stílus tanácsadás',
        'Kiegészítő ajánlások',
        'Smink és frizura konzultáció',
        'Utolsó percen lezajló módosítások'
      ]
    }
  ]

  return (
    <div className="services-page">
      <section className="services-header">
        <h1>Szolgáltatásaink</h1>
        <p>Teljes támogatás az esküvőd napjához</p>
      </section>

      <section className="services-container">
        {services.map((service) => (
          <div key={service.id} className="service-card">
            <div className="service-icon">{service.icon}</div>
            <h2>{service.title}</h2>
            <p className="service-description">{service.description}</p>
            <ul className="service-details">
              {service.details.map((detail, idx) => (
                <li key={idx}>✓ {detail}</li>
              ))}
            </ul>
            <button className="service-btn">Tudj meg többet</button>
          </div>
        ))}
      </section>

      <section className="services-cta">
        <h2>Készülj fel az esküvőddel!</h2>
        <p>Szemelyere szabott tanácsadás és teljes támogatás az ideális menyasszonyi ruha megtalálásához.</p>
        <button className="cta-btn">Foglalj időpontot most</button>
      </section>
    </div>
  )
}

export default Services
