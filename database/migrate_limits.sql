-- Enforce uniform text limits on links table

-- Truncate existing oversize descriptions first
UPDATE links SET description = LEFT(description, 500)
  WHERE char_length(description) > 500;

ALTER TABLE links ADD CONSTRAINT links_description_length
  CHECK (char_length(description) <= 500);
