-- ─────────────────────────────────────────
-- Add "Website" subtopic under "Web & Cloud"
-- ─────────────────────────────────────────
INSERT INTO topics (id, parent_id, slug, name, color, sort_order)
VALUES (101, 3, 'website', 'Website', '#60a5fa', 10)
ON CONFLICT (id) DO UPDATE
  SET parent_id = EXCLUDED.parent_id,
      slug      = EXCLUDED.slug,
      name      = EXCLUDED.name,
      color     = EXCLUDED.color,
      sort_order = EXCLUDED.sort_order;

SELECT setval('topics_id_seq', (SELECT MAX(id) FROM topics));
