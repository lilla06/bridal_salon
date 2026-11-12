import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

const Dresses = () => {
  const { category } = useParams()
  const activeCategory = category || 'all'
  const [dresses, setDresses] = useState([])
  const [categoryTiles, setCategoryTiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hoveredDressId, setHoveredDressId] = useState(null)

  useEffect(() => {
    fetchDresses()
  }, [category])

  const fetchDresses = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (categoryError) throw categoryError

      const { data, error: fetchError } = await supabase
        .from('dresses')
        .select('*, categories:category_id (id, slug, name)')
        .eq('is_published', true)

      if (fetchError) throw fetchError

      const categoryImages = categoryData.map((cat) => {
        const firstDress = (data || []).find((dress) => dress.category_id === cat.id)
        return {
          ...cat,
          image: firstDress?.main_image_url || firstDress?.gallery_image_urls?.[0] || null
        }
      })

      let filteredDresses = data || []

      if (activeCategory && activeCategory !== 'all') {
        filteredDresses = filteredDresses.filter(
          (dress) => dress.categories?.slug === activeCategory
        )
      }

      setCategoryTiles(categoryImages)
      setDresses(filteredDresses)
    } catch (err) {
      setError(err.message)
      console.error('Hiba a ruhák betöltésekor:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryLabel = () => {
    const labels = {
      all: 'Összes ruha',
      'a-line': 'A-vonalú ruhák',
      'ball-gown': 'Báli ruhák',
      mermaid: 'Sellő fazonú ruhák',
      sheath: 'Egyenes fazonú ruhák'
    }
    return labels[activeCategory] || 'Ruhák'
  }

  return (
    <div className="dresses-page">
      <div className="dresses-header">
        <h1>{getCategoryLabel()}</h1>
        <p>Fedezd fel gyönyörű menyasszonyi ruháinkat</p>
      </div>

      <div className="category-tile-grid">
        {categoryTiles.map((categoryItem) => (
          <Link
            key={categoryItem.id}
            to={categoryItem.slug === 'all' ? '/dresses/all' : `/dresses/${categoryItem.slug}`}
            className={`category-tile ${activeCategory === categoryItem.slug ? 'active' : ''}`}
          >
            <img src={categoryItem.image || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1'} alt={categoryItem.name} />
            <span>{categoryItem.name}</span>
          </Link>
        ))}
      </div>

      {error && <div className="error-message">Hiba a betöltéskor: {error}</div>}

      {loading ? (
        <div className="loading">Betöltés...</div>
      ) : dresses.length === 0 ? (
        <div className="no-dresses">
          <p>Ebben a kategóriában még nincsenek ruhák konfigurálva.</p>
          <p>A Supabase adatbázishoz csatlakozva tekinthess meg ruhagyűjteményeket.</p>
        </div>
      ) : (
        <div className="dresses-grid">
          {dresses.map((dress) => {
            const primaryImage = dress.main_image_url || dress.gallery_image_urls?.[0]
            const secondaryImage = dress.gallery_image_urls?.[1] || primaryImage
            const imageUrl = hoveredDressId === dress.id ? secondaryImage : primaryImage

            return (
              <div key={dress.id} className="dress-card">
                <Link to={`/dress/${dress.slug}`} className="dress-image-link">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={dress.name}
                      className="dress-image"
                      onMouseEnter={() => setHoveredDressId(dress.id)}
                      onMouseLeave={() => setHoveredDressId(null)}
                    />
                  )}
                </Link>
                <div className="dress-info">
                  <h3>{dress.name}</h3>
                  <p className="dress-style">{dress.categories?.name || 'Ruhafazon'}</p>
                  {dress.price && <p className="dress-price">{dress.price.toLocaleString('hu-HU')} Ft</p>}
                  {dress.public_description && (
                    <p className="dress-description">{dress.public_description}</p>
                  )}
                  <Link to={`/dress/${dress.slug}`} className="dress-btn">Részletek megtekintése</Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Dresses
