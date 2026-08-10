import { neon } from '@neondatabase/serverless';
import pg from 'pg';
const { Pool } = pg;

const SQL = `
  INSERT INTO topics (id, parent_id, slug, name, color, sort_order)
  VALUES (101, 3, 'website', 'Website', '#60a5fa', 10)
  ON CONFLICT (id) DO UPDATE
    SET parent_id = EXCLUDED.parent_id,
        slug      = EXCLUDED.slug,
        name      = EXCLUDED.name,
        color     = EXCLUDED.color,
        sort_order = EXCLUDED.sort_order
`;

const SEQ = "SELECT setval('topics_id_seq', (SELECT MAX(id) FROM topics))";

// Neon
if (process.env.NEON_DATABASE_URL) {
  const nsql = neon(process.env.NEON_DATABASE_URL);
  await nsql.unsafe(SQL);
  await nsql.unsafe(SEQ);
  console.log('✓ Neon: Website topic inserted');
}

// Local
if (process.env.LOCAL_DATABASE_URL) {
  const pool = new Pool({ connectionString: process.env.LOCAL_DATABASE_URL });
  await pool.query(SQL);
  await pool.query(SEQ);
  await pool.end();
  console.log('✓ Local: Website topic inserted');
}

process.exit(0);
