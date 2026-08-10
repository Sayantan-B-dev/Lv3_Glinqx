-- Make topic_id, description required on links table
-- Run AFTER removing links with null topic_id or null description

ALTER TABLE links ALTER COLUMN description SET NOT NULL;

ALTER TABLE links ALTER COLUMN topic_id SET NOT NULL;

ALTER TABLE links DROP CONSTRAINT IF EXISTS links_topic_id_fkey;
ALTER TABLE links ADD CONSTRAINT links_topic_id_fkey
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE RESTRICT;
