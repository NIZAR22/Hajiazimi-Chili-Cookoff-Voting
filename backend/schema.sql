// Create tables if they don't exist
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS chilis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number INTEGER UNIQUE NOT NULL,
    name TEXT,
    cook TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chili_id INTEGER NOT NULL,
    aroma INTEGER NOT NULL CHECK(aroma BETWEEN 0 AND 10),
    appearance INTEGER NOT NULL CHECK(appearance BETWEEN 0 AND 10),
    taste INTEGER NOT NULL CHECK(taste BETWEEN 0 AND 10),
    heat_level INTEGER NOT NULL CHECK(heat_level BETWEEN 0 AND 10),
    creativity INTEGER NOT NULL CHECK(creativity BETWEEN 0 AND 10),
    total_score INTEGER NOT NULL,
    judge_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chili_id) REFERENCES chilis(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bonus_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chili_id INTEGER NOT NULL,
    bonus_points INTEGER NOT NULL CHECK(bonus_points >= 0 AND bonus_points <= 10),
    judge_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chili_id) REFERENCES chilis(id) ON DELETE CASCADE,
    UNIQUE (judge_id, chili_id)
  );

  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_place INTEGER NOT NULL,
    second_place INTEGER NOT NULL,
    third_place INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (first_place) REFERENCES chilis(id) ON DELETE CASCADE,
    FOREIGN KEY (second_place) REFERENCES chilis(id) ON DELETE CASCADE,
    FOREIGN KEY (third_place) REFERENCES chilis(id) ON DELETE CASCADE,
    CHECK (first_place != second_place AND first_place != third_place AND second_place != third_place)
  );

  CREATE TABLE IF NOT EXISTS competition (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    status TEXT DEFAULT 'setup' CHECK(status IN ('setup','voting','closed')),
    bonus_round_active INTEGER DEFAULT 0 CHECK(bonus_round_active IN (0,1)),
    admin_password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TRIGGER IF NOT EXISTS trg_competition_updated_at
  AFTER UPDATE ON competition
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN
    UPDATE competition SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

  CREATE INDEX IF NOT EXISTS idx_chilis_number ON chilis(number);
  CREATE INDEX IF NOT EXISTS idx_scores_chili_id ON scores(chili_id);
  CREATE INDEX IF NOT EXISTS idx_scores_judge_id ON scores(judge_id);
  CREATE INDEX IF NOT EXISTS idx_bonus_chili_id ON bonus_scores(chili_id);
  CREATE INDEX IF NOT EXISTS idx_bonus_judge_id ON bonus_scores(judge_id);
  CREATE INDEX IF NOT EXISTS idx_votes_first ON votes(first_place);
  CREATE INDEX IF NOT EXISTS idx_votes_second ON votes(second_place);
  CREATE INDEX IF NOT EXISTS idx_votes_third ON votes(third_place);

  INSERT OR IGNORE INTO competition (id, status, bonus_round_active, admin_password)
  VALUES (1, 'setup', 0, 'admin123');
`);
