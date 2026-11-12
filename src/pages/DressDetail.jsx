import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

const DressDetail = () => {
  const { slug } = useParams()
  const [dress, setDress] = useState(null)
  const [gallery, setGallery] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [category, setCategory] = useState(null)
  const [sizes, setSizes] = useState([])
  const [materials, setMaterials] = useState([])
  const [colors, setColors] = useState([])
  const [tags, setTags] = useState([])

  useEffect(() => {
    const fetchDressDetail = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: dressData, error: dressError } = await supabase
          .from('dresses')
          .select('*')
          .eq('slug', slug)
          .maybeSingle()

        if (dressError) throw dressError
        if (!dressData) {
          throw new Error('A ruha nem található.')
        }

        const [categoryRes, imagesRes, sizeRowsRes, materialRowsRes, colorRowsRes, tagRowsRes] = await Promise.all([
          dressData.category_id
            ? supabase.from('categories').select('*').eq('id', dressData.category_id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          supabase.from('dress_images').select('*').eq('dress_id', dressData.id).order('sort_order', { ascending: true }),
          supabase.from('dress_sizes').select('*').eq('dress_id', dressData.id),
          supabase.from('dress_materials').select('*').eq('dress_id', dressData.id),
          supabase.from('dress_colors').select('*').eq('dress_id', dressData.id),
          supabase.from('dress_tags').select('*').eq('dress_id', dressData.id)
        ])

        if (categoryRes.error) throw categoryRes.error
        if (imagesRes.error) throw imagesRes.error
        if (sizeRowsRes.error) throw sizeRowsRes.error
        if (materialRowsRes.error) throw materialRowsRes.error
        if (colorRowsRes.error) throw colorRowsRes.error
        if (tagRowsRes.error) throw tagRowsRes.error

        const imageList = [
          ...(dressData.gallery_image_urls || []),
          ...(imagesRes.data || []).map((item) => item.image_url).filter(Boolean),
          dressData.main_image_url
        ].filter(Boolean)

        const uniqueGallery = [...new Map(imageList.map((url) => [url, url])).values()]

        const sizeIds = [...new Set((sizeRowsRes.data || []).map((item) => item.size_id).filter(Boolean))]
        let sizeList = []
        if (sizeIds.length > 0) {
          const { data: sizeData, error: sizeError } = await supabase
            .from('sizes')
            .select('*')
            .in('id', sizeIds)

          if (sizeError) throw sizeError

          sizeList = (sizeRowsRes.data || []).map((item) => {
            const sizeMeta = sizeData?.find((size) => size.id === item.size_id)
            return {
              ...item,
              label: sizeMeta?.label || 'Ismeretlen méret'
            }
          })
        }

        const materialIds = [...new Set((materialRowsRes.data || []).map((item) => item.material_id).filter(Boolean))]
        let materialList = []
        if (materialIds.length > 0) {
          const { data: materialData, error: materialError } = await supabase
            .from('materials')
            .select('*')
            .in('id', materialIds)

          if (materialError) throw materialError
          materialList = materialData || []
        }

        const colorIds = [...new Set((colorRowsRes.data || []).map((item) => item.color_id).filter(Boolean))]
        let colorList = []
        if (colorIds.length > 0) {
          const { data: colorData, error: colorError } = await supabase
            .from('colors')
            .select('*')
            .in('id', colorIds)

          if (colorError) throw colorError
          colorList = colorData || []
        }

        const tagIds = [...new Set((tagRowsRes.data || []).map((item) => item.tag_id).filter(Boolean))]
        let tagList = []
        if (tagIds.length > 0) {
          const { data: tagData, error: tagError } = await supabase
            .from('tags')
            .select('*')
            .in('id', tagIds)

          if (tagError) throw tagError
          tagList = tagData || []
        }

        const [silhouetteRes, necklineRes, sleeveRes, trainRes, embellishmentRes] = await Promise.all([
          dressData.silhouette_id
            ? supabase.from('silhouettes').select('*').eq('id', dressData.silhouette_id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          dressData.neckline_id
            ? supabase.from('necklines').select('*').eq('id', dressData.neckline_id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          dressData.sleeve_style_id
            ? supabase.from('sleeve_styles').select('*').eq('id', dressData.sleeve_style_id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          dressData.train_length_id
            ? supabase.from('train_lengths').select('*').eq('id', dressData.train_length_id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          dressData.embellishment_style_id
            ? supabase.from('embellishment_styles').select('*').eq('id', dressData.embellishment_style_id).maybeSingle()
            : Promise.resolve({ data: null, error: null })
        ])

        if (silhouetteRes.error) throw silhouetteRes.error
        if (necklineRes.error) throw necklineRes.error
        if (sleeveRes.error) throw sleeveRes.error
        if (trainRes.error) throw trainRes.error
        if (embellishmentRes.error) throw embellishmentRes.error

        setDress({
          ...dressData,
          category: categoryRes.data,
          silhouette: silhouetteRes.data,
          neckline: necklineRes.data,
          sleeveStyle: sleeveRes.data,
          trainLength: trainRes.data,
          embellishment: embellishmentRes.data
        })
        setCategory(categoryRes.data)
        setGallery(uniqueGallery)
        setSizes(sizeList)
        setMaterials(materialList)
        setColors(colorList)
        setTags(tagList)
      } catch (err) {
        setError(err.message)
        console.error('Hiba a ruha betöltésekor:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDressDetail()
  }, [slug])

  if (loading) {
    return <div className="loading">Betöltés...</div>
  }

  if (error) {
    return <div className="error-message">Hiba a betöltéskor: {error}</div>
  }

  if (!dress) {
    return <div className="error-message">Nem található ruha.</div>
  }

  const lastKnownPrice = dress.sale_price ?? dress.price ?? 0
  const priceLabel = dress.is_available === false ? 'Utolsó ismert ár' : 'Ár'

  return (
    <div className="dress-detail-page">
      <div className="dress-detail-header">
        <Link to="/dresses/all" className="back-link">← Vissza a ruhákhoz</Link>
      </div>

      <div className="dress-detail-layout">
        <div className="dress-gallery">
          {gallery.map((image, index) => (
            <img key={`${image}-${index}`} src={image} alt={`${dress.name} ${index + 1}`} className="dress-gallery-image" />
          ))}
        </div>

        <div className="dress-detail-info">
          <p className="dress-detail-category">{category?.name || 'Ruha'}</p>
          <h1>{dress.name}</h1>

          <div className="dress-price-block">
            <span className="price-label">{priceLabel}</span>
            <strong>{lastKnownPrice.toLocaleString('hu-HU')} Ft</strong>
            {!dress.is_available && <span className="not-available">Jelenleg nem elérhető</span>}
          </div>

          <div className="dress-description-box">
            <p>{dress.public_description || 'Leírás hamarosan.'}</p>
          </div>

          <div className="dress-detail-meta">
            <div>
              <h3>Attribútumok</h3>
              <ul>
                {dress.silhouette && <li><strong>Silhuett:</strong> {dress.silhouette.name}</li>}
                {dress.neckline && <li><strong>Nyakvonal:</strong> {dress.neckline.name}</li>}
                {dress.sleeveStyle && <li><strong>Ujjstílus:</strong> {dress.sleeveStyle.name}</li>}
                {dress.trainLength && <li><strong>Uszály:</strong> {dress.trainLength.name}</li>}
                {dress.embellishment && <li><strong>Díszítés:</strong> {dress.embellishment.name}</li>}
                {materials.length > 0 && <li><strong>Anyagok:</strong> {materials.map((material) => material.name).join(', ')}</li>}
                {colors.length > 0 && <li><strong>Színek:</strong> {colors.map((color) => color.name).join(', ')}</li>}
                {tags.length > 0 && <li><strong>Címkék:</strong> {tags.map((tag) => tag.name).join(', ')}</li>}
              </ul>
            </div>

            <div>
              <h3>Elérhetőség</h3>
              {sizes.length > 0 ? (
                <ul className="size-list">
                  {sizes.map((sizeItem) => (
                    <li key={`${sizeItem.size_id}-${sizeItem.label}`}>
                      <span>{sizeItem.label}</span>
                      <span className={sizeItem.available ? 'size-available' : 'size-unavailable'}>
                        {sizeItem.available ? `Raktáron (${sizeItem.stock ?? 0})` : 'Nem elérhető'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Jelenleg nincs megadott méretinformáció.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DressDetail
