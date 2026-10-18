export const sql = String.raw`
-- Paper Trail initial schema.
-- Invariant: a fact cannot exist without at least one source. Sources reference
-- facts through a DEFERRED foreign key so a fact and its sources can be written
-- in one transaction (sources first), and triggers reject sourceless facts.

CREATE TABLE facts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sentence TEXT NOT NULL CHECK (length(sentence) BETWEEN 1 AND 200),
  category TEXT NOT NULL CHECK (length(category) BETWEEN 1 AND 40),
  year INTEGER NOT NULL CHECK (year BETWEEN -3000 AND 2100),
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C')),
  status TEXT NOT NULL DEFAULT 'verified' CHECK (status IN ('verified', 'disputed', 'retired')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fact_id INTEGER NOT NULL REFERENCES facts(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
  url TEXT NOT NULL CHECK (url LIKE 'https://%' OR url LIKE 'http://%'),
  archive_url TEXT CHECK (archive_url IS NULL OR archive_url LIKE 'https://%' OR archive_url LIKE 'http://%'),
  publisher TEXT NOT NULL CHECK (length(publisher) BETWEEN 1 AND 120),
  -- At most 25 words: at most 24 single spaces between words (Zod also normalises whitespace).
  quote TEXT NOT NULL CHECK (
    length(trim(quote)) > 0
    AND length(trim(quote)) - length(replace(trim(quote), ' ', '')) <= 24
  ),
  last_checked_at INTEGER,
  last_status_code INTEGER
);
CREATE INDEX sources_fact_id_idx ON sources(fact_id);

CREATE TRIGGER facts_require_source
AFTER INSERT ON facts
WHEN NOT EXISTS (SELECT 1 FROM sources WHERE fact_id = NEW.id)
BEGIN
  SELECT RAISE(ABORT, 'a fact requires at least one source');
END;

CREATE TRIGGER sources_keep_last_on_delete
BEFORE DELETE ON sources
WHEN EXISTS (SELECT 1 FROM facts WHERE id = OLD.fact_id)
  AND (SELECT COUNT(*) FROM sources WHERE fact_id = OLD.fact_id) <= 1
BEGIN
  SELECT RAISE(ABORT, 'cannot remove the last source of a fact');
END;

CREATE TRIGGER sources_keep_last_on_move
BEFORE UPDATE OF fact_id ON sources
WHEN NEW.fact_id <> OLD.fact_id
  AND EXISTS (SELECT 1 FROM facts WHERE id = OLD.fact_id)
  AND (SELECT COUNT(*) FROM sources WHERE fact_id = OLD.fact_id) <= 1
BEGIN
  SELECT RAISE(ABORT, 'cannot remove the last source of a fact');
END;

CREATE TABLE guesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anon_id TEXT NOT NULL CHECK (length(anon_id) BETWEEN 8 AND 64),
  fact_id INTEGER NOT NULL REFERENCES facts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('number', 'truefalse')),
  guess REAL NOT NULL,
  truth REAL NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 50 AND 100),
  correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX guesses_anon_idx ON guesses(anon_id, created_at);

CREATE TABLE claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 300),
  verdict TEXT NOT NULL CHECK (verdict IN ('TRUE', 'FALSE', 'MISLEADING')),
  one_line_verdict TEXT NOT NULL CHECK (length(one_line_verdict) BETWEEN 1 AND 200),
  -- JSON array of source ids; must be non-empty.
  source_ids TEXT NOT NULL CHECK (json_valid(source_ids) AND json_array_length(source_ids) >= 1)
);

CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK (length(email) BETWEEN 3 AND 254),
  confirmed_at INTEGER
);

CREATE TABLE sponsors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  text TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 200),
  url TEXT NOT NULL CHECK (url LIKE 'https://%'),
  active_from INTEGER NOT NULL,
  active_to INTEGER NOT NULL,
  CHECK (active_to > active_from)
);
`;
