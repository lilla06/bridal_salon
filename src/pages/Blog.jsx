const Blog = () => {
  const blogPosts = [
    {
      id: 1,
      title: 'A Tökéletes Menyasszonyi Ruha Kiválasztása',
      date: '2026-07-28',
      category: 'Stílus',
      excerpt: 'Útmutató az ideális menyasszonyi ruha kiválasztásához. Ismerd meg a különféle fazonokat és melyik passou legjobban az alakodra.',
      image: 'https://via.placeholder.com/400x250?text=Perfect+Dress'
    },
    {
      id: 2,
      title: 'Trendy Menyasszonyi Kiegészítők 2026-ban',
      date: '2026-07-20',
      category: 'Kiegészítők',
      excerpt: 'Fedezd fel az idei év legdivatosabb kiegészítőit. Gyöngyöktől kezdve fátylon át az elegáns ékszerekig.',
      image: 'https://via.placeholder.com/400x250?text=Accessories'
    },
    {
      id: 3,
      title: 'Ruha Ápolás és Tisztítás Útmutató',
      date: '2026-07-15',
      category: 'Gondozás',
      excerpt: 'Hogyan gondozd az esküvő után a menyasszonyi ruhádat? Praktikus tippek a hosszú élettartamú ruhaápoláshoz.',
      image: 'https://via.placeholder.com/400x250?text=Care+Guide'
    },
    {
      id: 4,
      title: 'Menyasszonyi Ruhafazonok: A-vonalú vs Báli Ruha',
      date: '2026-07-10',
      category: 'Stílus',
      excerpt: 'Mely fazon passzik az alakodra jobban? Összehasonlítás és tippek az ideális fazon kiválasztásához.',
      image: 'https://via.placeholder.com/400x250?text=Styles'
    }
  ]

  return (
    <div className="blog-page">
      <section className="blog-header">
        <h1>Blog</h1>
        <p>Tippek és inspiráció az esküvőd napjához</p>
      </section>

      <section className="blog-container">
        <div className="blog-grid">
          {blogPosts.map((post) => (
            <article key={post.id} className="blog-card">
              <div className="blog-image">
                <img src={post.image} alt={post.title} />
              </div>
              <div className="blog-content">
                <span className="blog-category">{post.category}</span>
                <h3>{post.title}</h3>
                <p className="blog-date">{new Date(post.date).toLocaleDateString('hu-HU')}</p>
                <p className="blog-excerpt">{post.excerpt}</p>
                <a href="#" className="blog-link">Tovább olvasás →</a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Blog
