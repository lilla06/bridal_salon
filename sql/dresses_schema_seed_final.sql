-- =========================================================
-- Bridal salon dresses schema + seed data
-- Final clean script for Supabase
-- Safe to run from a clean DB or after reset.
-- =========================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Reset dependent data if needed
-- Uncomment only if you want a full clean rebuild.
DROP TABLE IF EXISTS public.dress_tags CASCADE;
DROP TABLE IF EXISTS public.dress_images CASCADE;
DROP TABLE IF EXISTS public.dress_sizes CASCADE;
DROP TABLE IF EXISTS public.dress_colors CASCADE;
DROP TABLE IF EXISTS public.dress_materials CASCADE;
DROP TABLE IF EXISTS public.dresses CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.sizes CASCADE;
DROP TABLE IF EXISTS public.colors CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.embellishment_styles CASCADE;
DROP TABLE IF EXISTS public.train_lengths CASCADE;
DROP TABLE IF EXISTS public.sleeve_styles CASCADE;
DROP TABLE IF EXISTS public.necklines CASCADE;
DROP TABLE IF EXISTS public.silhouettes CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- 2) Lookup tables
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.silhouettes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.necklines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.sleeve_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.train_lengths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.embellishment_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  hex_code text
);

CREATE TABLE IF NOT EXISTS public.sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

-- 3) Main dress table
CREATE TABLE IF NOT EXISTS public.dresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  sale_price numeric(10,2),
  public_description text,
  admin_notes text,
  is_published boolean NOT NULL DEFAULT false,
  is_available boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  silhouette_id uuid REFERENCES public.silhouettes(id) ON DELETE SET NULL,
  neckline_id uuid REFERENCES public.necklines(id) ON DELETE SET NULL,
  sleeve_style_id uuid REFERENCES public.sleeve_styles(id) ON DELETE SET NULL,
  train_length_id uuid REFERENCES public.train_lengths(id) ON DELETE SET NULL,
  embellishment_style_id uuid REFERENCES public.embellishment_styles(id) ON DELETE SET NULL,
  main_image_url text,
  gallery_image_urls text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dresses
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS price numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS public_description text,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS silhouette_id uuid REFERENCES public.silhouettes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS neckline_id uuid REFERENCES public.necklines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sleeve_style_id uuid REFERENCES public.sleeve_styles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS train_length_id uuid REFERENCES public.train_lengths(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS embellishment_style_id uuid REFERENCES public.embellishment_styles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS main_image_url text,
  ADD COLUMN IF NOT EXISTS gallery_image_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS dresses_slug_unique_idx
ON public.dresses (slug)
WHERE slug IS NOT NULL;

-- 4) Join tables
CREATE TABLE IF NOT EXISTS public.dress_materials (
  dress_id uuid NOT NULL REFERENCES public.dresses(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  PRIMARY KEY (dress_id, material_id)
);

CREATE TABLE IF NOT EXISTS public.dress_colors (
  dress_id uuid NOT NULL REFERENCES public.dresses(id) ON DELETE CASCADE,
  color_id uuid NOT NULL REFERENCES public.colors(id) ON DELETE CASCADE,
  PRIMARY KEY (dress_id, color_id)
);

CREATE TABLE IF NOT EXISTS public.dress_sizes (
  dress_id uuid NOT NULL REFERENCES public.dresses(id) ON DELETE CASCADE,
  size_id uuid NOT NULL REFERENCES public.sizes(id) ON DELETE CASCADE,
  stock int NOT NULL DEFAULT 0,
  available boolean NOT NULL DEFAULT true,
  PRIMARY KEY (dress_id, size_id)
);

CREATE TABLE IF NOT EXISTS public.dress_tags (
  dress_id uuid NOT NULL REFERENCES public.dresses(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (dress_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.dress_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dress_id uuid NOT NULL REFERENCES public.dresses(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dress_images
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS dress_images_dress_url_unique_idx
ON public.dress_images (dress_id, image_url)
WHERE dress_id IS NOT NULL AND image_url IS NOT NULL;

-- 5) Seed lookup data
INSERT INTO public.categories (name, slug)
SELECT v.name, v.slug
FROM (VALUES
  ('A-vonalú ruha', 'a-line'),
  ('Báli ruha', 'ball-gown'),
  ('Sellő fazonú ruha', 'mermaid'),
  ('Egyenes fazonú ruha', 'sheath')
) AS v(name, slug)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE c.slug = v.slug
);

INSERT INTO public.silhouettes (name)
SELECT v.name
FROM (VALUES
  ('A-vonalú'),
  ('Báli'),
  ('Sellő'),
  ('Egyenes')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.silhouettes s WHERE s.name = v.name
);

INSERT INTO public.necklines (name)
SELECT v.name
FROM (VALUES
  ('V-nyak'),
  ('Széles nyak'),
  ('U-nyak'),
  ('Sima nyak')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.necklines n WHERE n.name = v.name
);

INSERT INTO public.sleeve_styles (name)
SELECT v.name
FROM (VALUES
  ('Ujjatlan'),
  ('Rövid ujj'),
  ('Hosszú ujj'),
  ('Pántos')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.sleeve_styles s WHERE s.name = v.name
);

INSERT INTO public.train_lengths (name)
SELECT v.name
FROM (VALUES
  ('Nincs'),
  ('Közepes'),
  ('Hosszú'),
  ('Extra hosszú')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.train_lengths t WHERE t.name = v.name
);

INSERT INTO public.embellishment_styles (name)
SELECT v.name
FROM (VALUES
  ('Klasszikus'),
  ('Csillogó kristály'),
  ('Virágos'),
  ('Minimalista'),
  ('Kézzel hímzett')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.embellishment_styles e WHERE e.name = v.name
);

INSERT INTO public.materials (name)
SELECT v.name
FROM (VALUES
  ('Szatén'),
  ('Tüll'),
  ('Selyem'),
  ('Kréta'),
  ('Organza'),
  ('Chiffon')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.materials m WHERE m.name = v.name
);

INSERT INTO public.colors (name, hex_code)
SELECT v.name, v.hex_code
FROM (VALUES
  ('Fehér', '#FFFFFF'),
  ('Ivory', '#F8F2E6'),
  ('Krém', '#F3E6D3'),
  ('Ezüst', '#C7C9CC'),
  ('Rózsaszín', '#F7D9E5'),
  ('Bézs', '#D9C7AE')
) AS v(name, hex_code)
WHERE NOT EXISTS (
  SELECT 1 FROM public.colors c WHERE c.name = v.name
);

INSERT INTO public.sizes (label, sort_order)
SELECT v.label, v.sort_order
FROM (VALUES
  ('XS', 1),
  ('S', 2),
  ('M', 3),
  ('L', 4),
  ('XL', 5),
  ('36', 6),
  ('38', 7),
  ('40', 8),
  ('42', 9)
) AS v(label, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.sizes s WHERE s.label = v.label
);

INSERT INTO public.tags (name)
SELECT v.name
FROM (VALUES
  ('Női'),
  ('Modern'),
  ('Klasszikus'),
  ('Hosszú uszály'),
  ('Nyár'),
  ('Esküvő'),
  ('Lágy anyag'),
  ('Luxus')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tags t WHERE t.name = v.name
);

-- 6) Seed dresses
WITH cat_a AS (
  SELECT id FROM public.categories WHERE slug = 'a-line'
),
cat_ball AS (
  SELECT id FROM public.categories WHERE slug = 'ball-gown'
),
cat_mermaid AS (
  SELECT id FROM public.categories WHERE slug = 'mermaid'
),
cat_sheath AS (
  SELECT id FROM public.categories WHERE slug = 'sheath'
),
sil_a AS (
  SELECT id FROM public.silhouettes WHERE name = 'A-vonalú'
),
sil_ball AS (
  SELECT id FROM public.silhouettes WHERE name = 'Báli'
),
sil_mermaid AS (
  SELECT id FROM public.silhouettes WHERE name = 'Sellő'
),
sil_sheath AS (
  SELECT id FROM public.silhouettes WHERE name = 'Egyenes'
),
neck_v AS (
  SELECT id FROM public.necklines WHERE name = 'V-nyak'
),
neck_wide AS (
  SELECT id FROM public.necklines WHERE name = 'Széles nyak'
),
sleeve_short AS (
  SELECT id FROM public.sleeve_styles WHERE name = 'Rövid ujj'
),
sleeve_long AS (
  SELECT id FROM public.sleeve_styles WHERE name = 'Hosszú ujj'
),
train_medium AS (
  SELECT id FROM public.train_lengths WHERE name = 'Közepes'
),
train_long AS (
  SELECT id FROM public.train_lengths WHERE name = 'Hosszú'
),
emb_classic AS (
  SELECT id FROM public.embellishment_styles WHERE name = 'Klasszikus'
),
emb_glitter AS (
  SELECT id FROM public.embellishment_styles WHERE name = 'Csillogó kristály'
)
INSERT INTO public.dresses (
  name,
  slug,
  category_id,
  price,
  sale_price,
  public_description,
  admin_notes,
  is_published,
  is_available,
  is_featured,
  silhouette_id,
  neckline_id,
  sleeve_style_id,
  train_length_id,
  embellishment_style_id,
  main_image_url,
  gallery_image_urls
)
SELECT v.name,
       v.slug,
       v.category_id,
       v.price,
       v.sale_price,
       v.public_description,
       v.admin_notes,
       v.is_published,
       v.is_available,
       v.is_featured,
       v.silhouette_id,
       v.neckline_id,
       v.sleeve_style_id,
       v.train_length_id,
       v.embellishment_style_id,
       v.main_image_url,
       v.gallery_image_urls
FROM (VALUES
  (
    'Ivory A-line ruha',
    'ivory-a-line-ruha',
    (SELECT id FROM cat_a),
    285000,
    249000,
    'Elegáns, könnyed A-vonalú ruha, amely a klasszikus esküvői látványt párosítja a modern eleganciával.',
    'Kíváló választás kényelmes, könnyen szerelhető próba esetén. Sűrűbb anyagú szatén kivitel.',
    true,
    true,
    true,
    (SELECT id FROM sil_a),
    (SELECT id FROM neck_v),
    (SELECT id FROM sleeve_short),
    (SELECT id FROM train_medium),
    (SELECT id FROM emb_classic),
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf',
    ARRAY[
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1'
    ]
  ),
  (
    'Fehér báli ruha kristály díszítéssel',
    'feher-bali-ruha-kristaly-diszites',
    (SELECT id FROM cat_ball),
    395000,
    349000,
    'Tündöklő, báli ruhasziluett a különleges estékre, finom kristálydíszítéssel és teljes uszállyal.',
    'Ritkán elérhető. Különösen alkalmas nagyobb, fényes eseményekre. A próbán ajánlott a csipke cipő.',
    true,
    true,
    true,
    (SELECT id FROM sil_ball),
    (SELECT id FROM neck_wide),
    (SELECT id FROM sleeve_long),
    (SELECT id FROM train_long),
    (SELECT id FROM emb_glitter),
    'https://images.unsplash.com/photo-1566174053879-31528523f8ae',
    ARRAY[
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b'
    ]
  ),
  (
    'Mermaid fazonú ezüstös ruhadarab',
    'mermaid-fazonu-ezustos-ruhadarab',
    (SELECT id FROM cat_mermaid),
    420000,
    NULL,
    'A sziluett a test köré simul, a mermaid-vonal modern és szexi eleganciát ad az esküvői megjelenéshez.',
    'Sűrű szaténruházat, nagyon különleges megjelenés. Ajánlott a próbán való pontos mértékfelvétel.',
    true,
    true,
    false,
    (SELECT id FROM sil_mermaid),
    (SELECT id FROM neck_v),
    (SELECT id FROM sleeve_long),
    (SELECT id FROM train_medium),
    (SELECT id FROM emb_classic),
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c',
    ARRAY[
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1'
    ]
  ),
  (
    'Lágyszövetes sheath ruha',
    'lagyszovetes-sheath-ruha',
    (SELECT id FROM cat_sheath),
    260000,
    229000,
    'Vékony, könnyű és elegáns egyenes ruha, amely természetes mozgást biztosít a nagy nap során.',
    'Különösen kedvelt nyári esküvőkre. Könnyű, mozgékony anyag. Tüll és selyem kombináció.',
    true,
    true,
    false,
    (SELECT id FROM sil_sheath),
    (SELECT id FROM neck_wide),
    (SELECT id FROM sleeve_short),
    (SELECT id FROM train_medium),
    (SELECT id FROM emb_classic),
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
    ARRAY[
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf'
    ]
  )
) AS v(name, slug, category_id, price, sale_price, public_description, admin_notes, is_published, is_available, is_featured, silhouette_id, neckline_id, sleeve_style_id, train_length_id, embellishment_style_id, main_image_url, gallery_image_urls)
WHERE NOT EXISTS (
  SELECT 1 FROM public.dresses d WHERE d.slug = v.slug
);

-- 7) Add attribute relationships for the seeded dresses
INSERT INTO public.dress_materials (dress_id, material_id)
SELECT d.id, m.id
FROM public.dresses d
JOIN public.materials m ON m.name IN ('Szatén', 'Tüll')
WHERE d.slug IN ('ivory-a-line-ruha', 'feher-bali-ruha-kristaly-diszites')
AND NOT EXISTS (
  SELECT 1 FROM public.dress_materials dm
  WHERE dm.dress_id = d.id AND dm.material_id = m.id
);

INSERT INTO public.dress_materials (dress_id, material_id)
SELECT d.id, m.id
FROM public.dresses d
JOIN public.materials m ON m.name IN ('Selyem', 'Organza')
WHERE d.slug IN ('mermaid-fazonu-ezustos-ruhadarab', 'lagyszovetes-sheath-ruha')
AND NOT EXISTS (
  SELECT 1 FROM public.dress_materials dm
  WHERE dm.dress_id = d.id AND dm.material_id = m.id
);

INSERT INTO public.dress_colors (dress_id, color_id)
SELECT d.id, c.id
FROM public.dresses d
JOIN public.colors c ON c.name IN ('Fehér', 'Ivory')
WHERE d.slug IN ('ivory-a-line-ruha', 'feher-bali-ruha-kristaly-diszites')
AND NOT EXISTS (
  SELECT 1 FROM public.dress_colors dc
  WHERE dc.dress_id = d.id AND dc.color_id = c.id
);

INSERT INTO public.dress_colors (dress_id, color_id)
SELECT d.id, c.id
FROM public.dresses d
JOIN public.colors c ON c.name IN ('Ezüst', 'Krém')
WHERE d.slug IN ('mermaid-fazonu-ezustos-ruhadarab', 'lagyszovetes-sheath-ruha')
AND NOT EXISTS (
  SELECT 1 FROM public.dress_colors dc
  WHERE dc.dress_id = d.id AND dc.color_id = c.id
);

INSERT INTO public.dress_sizes (dress_id, size_id, stock, available)
SELECT d.id, s.id, 2, true
FROM public.dresses d
JOIN public.sizes s ON s.label IN ('S', 'M', 'L')
WHERE d.slug = 'ivory-a-line-ruha'
AND NOT EXISTS (
  SELECT 1 FROM public.dress_sizes ds
  WHERE ds.dress_id = d.id AND ds.size_id = s.id
);

INSERT INTO public.dress_sizes (dress_id, size_id, stock, available)
SELECT d.id, s.id, 1, true
FROM public.dresses d
JOIN public.sizes s ON s.label IN ('M', 'L', 'XL')
WHERE d.slug = 'feher-bali-ruha-kristaly-diszites'
AND NOT EXISTS (
  SELECT 1 FROM public.dress_sizes ds
  WHERE ds.dress_id = d.id AND ds.size_id = s.id
);

INSERT INTO public.dress_sizes (dress_id, size_id, stock, available)
SELECT d.id, s.id, 0, false
FROM public.dresses d
JOIN public.sizes s ON s.label IN ('S', 'M', 'L')
WHERE d.slug = 'mermaid-fazonu-ezustos-ruhadarab'
AND NOT EXISTS (
  SELECT 1 FROM public.dress_sizes ds
  WHERE ds.dress_id = d.id AND ds.size_id = s.id
);

INSERT INTO public.dress_sizes (dress_id, size_id, stock, available)
SELECT d.id, s.id, 3, true
FROM public.dresses d
JOIN public.sizes s ON s.label IN ('XS', 'S', 'M')
WHERE d.slug = 'lagyszovetes-sheath-ruha'
AND NOT EXISTS (
  SELECT 1 FROM public.dress_sizes ds
  WHERE ds.dress_id = d.id AND ds.size_id = s.id
);

INSERT INTO public.dress_tags (dress_id, tag_id)
SELECT d.id, t.id
FROM public.dresses d
JOIN public.tags t ON t.name IN ('Modern', 'Klasszikus', 'Esküvő')
WHERE d.slug = 'ivory-a-line-ruha'
AND NOT EXISTS (
  SELECT 1 FROM public.dress_tags dt
  WHERE dt.dress_id = d.id AND dt.tag_id = t.id
);

INSERT INTO public.dress_tags (dress_id, tag_id)
SELECT d.id, t.id
FROM public.dresses d
JOIN public.tags t ON t.name IN ('Luxus', 'Hosszú uszály', 'Esküvő')
WHERE d.slug = 'feher-bali-ruha-kristaly-diszites'
AND NOT EXISTS (
  SELECT 1 FROM public.dress_tags dt
  WHERE dt.dress_id = d.id AND dt.tag_id = t.id
);

INSERT INTO public.dress_tags (dress_id, tag_id)
SELECT d.id, t.id
FROM public.dresses d
JOIN public.tags t ON t.name IN ('Modern', 'Női', 'Luxus')
WHERE d.slug = 'mermaid-fazonu-ezustos-ruhadarab'
AND NOT EXISTS (
  SELECT 1 FROM public.dress_tags dt
  WHERE dt.dress_id = d.id AND dt.tag_id = t.id
);

INSERT INTO public.dress_tags (dress_id, tag_id)
SELECT d.id, t.id
FROM public.dresses d
JOIN public.tags t ON t.name IN ('Nyár', 'Modern', 'Lágy anyag')
WHERE d.slug = 'lagyszovetes-sheath-ruha'
AND NOT EXISTS (
  SELECT 1 FROM public.dress_tags dt
  WHERE dt.dress_id = d.id AND dt.tag_id = t.id
);

-- 8) Add sample dress image rows
INSERT INTO public.dress_images (dress_id, image_url, sort_order, is_primary)
SELECT DISTINCT d.id, x.url, x.sort_order, x.is_primary
FROM public.dresses d
CROSS JOIN LATERAL (
  VALUES
    (d.main_image_url, 0, true),
    ('https://images.unsplash.com/photo-1524504388940-b1c1722653e1', 1, false),
    ('https://images.unsplash.com/photo-1520854221256-17451cc331bf', 2, false)
) AS x(url, sort_order, is_primary)
WHERE d.slug = 'ivory-a-line-ruha'
AND NOT EXISTS (
  SELECT 1 FROM public.dress_images di
  WHERE di.dress_id = d.id AND di.image_url = x.url
);

INSERT INTO public.dress_images (dress_id, image_url, sort_order, is_primary)
SELECT DISTINCT d.id, x.url, x.sort_order, x.is_primary
FROM public.dresses d
CROSS JOIN LATERAL (
  VALUES
    (d.main_image_url, 0, true),
    ('https://images.unsplash.com/photo-1566174053879-31528523f8ae', 1, false),
    ('https://images.unsplash.com/photo-1529139574466-a303027c1d8b', 2, false)
) AS x(url, sort_order, is_primary)
WHERE d.slug = 'feher-bali-ruha-kristaly-diszites'
AND NOT EXISTS (
  SELECT 1 FROM public.dress_images di
  WHERE di.dress_id = d.id AND di.image_url = x.url
);

-- 9) Optional RLS for public dress listing and admin moderation
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    ALTER TABLE public.dresses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.dress_images ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.dress_materials ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.dress_colors ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.dress_sizes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.dress_tags ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "dresses_public_read" ON public.dresses;
    DROP POLICY IF EXISTS "dresses_admin_write" ON public.dresses;
    DROP POLICY IF EXISTS "dress_images_public_read" ON public.dress_images;
    DROP POLICY IF EXISTS "dress_images_admin_write" ON public.dress_images;

    CREATE POLICY "dresses_public_read"
    ON public.dresses
    FOR SELECT
    USING (is_published = true);

    CREATE POLICY "dresses_admin_write"
    ON public.dresses
    FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.is_admin = true
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.is_admin = true
      )
    );

    CREATE POLICY "dress_images_public_read"
    ON public.dress_images
    FOR SELECT
    USING (true);

    CREATE POLICY "dress_images_admin_write"
    ON public.dress_images
    FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.is_admin = true
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.is_admin = true
      )
    );
  END IF;
END $$;

COMMIT;

-- =========================================================
-- END
-- =========================================================
