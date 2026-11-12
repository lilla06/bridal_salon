import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

const Dresses = () => {
  const { category } = useParams()
  const [dresses, setDresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDresses()
  }, [category])

  const fetchDresses = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('dresses')
        .select(`
          *,
          categories:category_id (
            id,
            slug,
            name
          )
        `)

      if (fetchError) throw fetchError

      let filteredDresses = data || []

      if (category && category !== 'all') {
        const normalizedCategory = category === 'straight' ? 'sheath' : category
        filteredDresses = filteredDresses.filter(
          (dress) => dress.categories?.slug === normalizedCategory
        )
      }

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
      sheath: 'Egyenes fazonú ruhák',
      straight: 'Egyenes fazonú ruhák'
    }
    return labels[category] || 'Ruhák'
  }

  return (
    <div className="dresses-page">
      <div className="dresses-header">
        <h1>{getCategoryLabel()}</h1>
        <p>Fedezd fel gyönyörű menyasszonyi ruháinkat</p>
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
            const imageUrl = dress.main_image_url || dress.gallery_image_urls?.[0]
            return (
              <div key={dress.id} className="dress-card">
                {imageUrl && (
                  <img src={imageUrl} alt={dress.name} className="dress-image" />
                )}
                <div className="dress-info">
                  <h3>{dress.name}</h3>
                  <p className="dress-style">{dress.categories?.name || 'Ruhafazon'}</p>
                  {dress.price && <p className="dress-price">{dress.price} Ft</p>}
                  {dress.public_description && (
                    <p className="dress-description">{dress.public_description}</p>
                  )}
                  <button className="dress-btn">Részletek megtekintése</button>
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
