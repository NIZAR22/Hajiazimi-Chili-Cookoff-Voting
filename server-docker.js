const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3005;
const appUrl = process.env.APP_URL || `http://localhost:${port}`;

// Database configuration for Docker
const isDocker = process.env.DOCKER === 'true' || process.env.NODE_ENV === 'production';
const dbPath = isDocker 
  ? path.join('/app/data', "chili-cookoff.db")
  : path.join(__dirname, "chili-cookoff.db");

console.log("Environment:", isDocker ? 'Docker' : 'Development');
console.log("Connecting to database at:", dbPath);

// Initialize SQLite database connection
const db = new Database(dbPath);

// Enable foreign keys and WAL mode
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

// Run the schema initialization
console.log('Initializing database with schema...');
const fs = require('fs');
try {
  let schema;
  if (fs.existsSync('./schema.sql')) {
    schema = fs.readFileSync('./schema.sql', 'utf8');
  } else if (fs.existsSync('schema.sql')) {
    schema = fs.readFileSync('schema.sql', 'utf8');
  } else {
    throw new Error('schema.sql file not found');
  }
  
  // Extract SQL commands if wrapped in db.exec
  let sqlCommands = schema;
  const match = schema.match(/db\.exec\(`([\s\S]*)`\);/);
  if (match) {
    sqlCommands = match[1];
  }
  
  db.exec(sqlCommands);
  console.log('Database schema initialized successfully');
} catch (error) {
  console.error('Schema initialization failed:', error);
  process.exit(1);
}

console.log("Database initialized successfully");

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : '*',
  credentials: true
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  if (req.method === "POST" || req.method === "PUT") {
    console.log("Body:", req.body);
  }
  next();
});

// Serve static files in production
if (isDocker || process.env.NODE_ENV === 'production') {
  // Serve the built frontend
  app.use(express.static(path.join(__dirname, 'public')));
}

// Health check endpoint
app.get("/health", (req, res) => {
  try {
    // Test database connection
    const result = db.prepare("SELECT 1").get();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      environment: isDocker ? 'docker' : 'development',
      appUrl: appUrl,
      port: port
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Root endpoint - serve frontend in production, API status in development
app.get("/", (req, res) => {
  if (isDocker || process.env.NODE_ENV === 'production') {
    // Serve the main Vue.js app
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    // Development API status
    try {
      const result = db.prepare("SELECT COUNT(*) as count FROM chilis").get();
      res.json({
        status: "ok",
        database: "connected",
        chiliCount: result.count,
        environment: 'development'
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        database: "failed",
        error: error.message,
      });
    }
  }
});

// ========================================
// CHILI ENDPOINTS
// ========================================

// GET all chilis - retrieves all chili entries from database
app.get("/api/chilis", (req, res) => {
  try {
    console.log("GET /api/chilis - fetching from database");

    // Prepare SQL statement for better performance and security
    const stmt = db.prepare(
      "SELECT number, name, cook FROM chilis ORDER BY number ASC"
    );
    const chilis = stmt.all();

    console.log("Found", chilis.length, "chilis in database");
    res.json(chilis);
  } catch (error) {
    console.error("Error fetching chilis:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch chilis", details: error.message });
  }
});

// POST a new chili - creates or updates a chili entry in database
app.post("/api/chilis", (req, res) => {
  try {
    console.log("POST /api/chilis", req.body);

    const { number, name, cook } = req.body || {};

    // Validate required field - number is the unique identifier for each chili
    if (typeof number === "undefined" || number === null) {
      return res.status(400).json({ error: "number is required" });
    }

    // Use INSERT OR REPLACE to handle both create and update scenarios
    // This SQLite syntax will update if number exists, insert if it doesn't
    const stmt = db.prepare(`
      INSERT INTO chilis (number, name, cook) 
      VALUES (?, ?, ?)
      ON CONFLICT(number) DO UPDATE SET 
        name = excluded.name,
        cook = excluded.cook
    `);

    const result = stmt.run(number, name || "", cook || "");

    console.log("Saved chili #", number, "- changes:", result.changes);

    return res.status(201).json({
      message: "Chili saved",
      data: { number, name, cook },
      changes: result.changes,
    });
  } catch (error) {
    console.error("Error saving chili:", error);
    res
      .status(500)
      .json({ error: "Failed to save chili", details: error.message });
  }
});

// DELETE all chilis - resets the entire competition
app.delete("/api/chilis", (req, res) => {
  try {
    console.log("Resetting entire competition - deleting all data");

    // Use transaction to delete in proper order (avoid FK constraint issues)
    const resetCompetition = db.transaction(() => {
      // Delete in reverse dependency order
      const bonusResult = db.prepare("DELETE FROM bonus_scores").run();
      const scoreResult = db.prepare("DELETE FROM scores").run();
      const voteResult = db.prepare("DELETE FROM votes").run();
      const chiliResult = db.prepare("DELETE FROM chilis").run();

      // Reset competition state
      db.prepare(
        `
        UPDATE competition 
        SET status = 'setup', bonus_round_active = 0, updated_at = CURRENT_TIMESTAMP 
        WHERE id = 1
      `
      ).run();

      return {
        chilis: chiliResult.changes,
        scores: scoreResult.changes,
        votes: voteResult.changes,
        bonus_scores: bonusResult.changes,
      };
    });

    const result = resetCompetition();

    console.log("Competition reset:", result);
    res.json({
      message: "Competition reset successfully",
      deleted: result,
    });
  } catch (error) {
    console.error("Error resetting competition:", error);
    res
      .status(500)
      .json({ error: "Failed to reset competition", details: error.message });
  }
});

// DELETE single chili by number - removes specific chili entry
app.delete("/api/chilis/:number", (req, res) => {
  try {
    const number = parseInt(req.params.number);
    console.log("DELETE /api/chilis/" + number);

    // Check if chili exists before attempting delete
    const checkStmt = db.prepare("SELECT number FROM chilis WHERE number = ?");
    const exists = checkStmt.get(number);

    if (!exists) {
      return res.status(404).json({ error: "Chili not found" });
    }

    // Delete the chili entry
    const deleteChili = db.transaction(() => {
      // Delete dependent records first (in reverse FK order)
      const bonusResult = db
        .prepare("DELETE FROM bonus_scores WHERE chili_id = ?")
        .run(number);
      const scoreResult = db
        .prepare("DELETE FROM scores WHERE chili_id = ?")
        .run(number);
      const voteResult = db
        .prepare(
          "DELETE FROM votes WHERE first_place = ? OR second_place = ? OR third_place = ?"
        )
        .run(number, number, number);

      // Finally delete the chili itself
      const chiliResult = db
        .prepare("DELETE FROM chilis WHERE number = ?")
        .run(number);

      return {
        chili: chiliResult.changes,
        scores: scoreResult.changes,
        votes: voteResult.changes,
        bonus_scores: bonusResult.changes,
      };
    });

    const result = deleteChili();

    // console.log('Deleted chili #', number)
    console.log("Deleted chili #", number, "and related data:", result);
    return res.json({
      message: "Chili deleted",
      number,
      deleted: result,
    });
  } catch (error) {
    console.error("Error deleting chili:", error);
    res
      .status(500)
      .json({ error: "Failed to delete chili", details: error.message });
  }
});

// ========================================
// SCORE ENDPOINTS (50-point judging system)
// ========================================

// Each score has 5 categories worth 10 points each (total 50 points)
// POST a score - saves judge's score for a chili
app.post("/api/scores", (req, res) => {
  try {
    console.log("POST /api/scores", req.body);

    const { chili_id, aroma, appearance, taste, heat_level, creativity, judge_id } = req.body || {};

    // chili_id from frontend is the chili NUMBER, not the database ID
    if (typeof chili_id === "undefined" || chili_id === null) {
      return res.status(400).json({ error: "chili_id is required" });
    }

    // Convert chili NUMBER to database ID
    const chiliRow = db.prepare('SELECT id, number FROM chilis WHERE number = ?').get(chili_id);

    if (!chiliRow) {
      return res.status(404).json({ error: `Chili #${chili_id} not found` });
    }

    const total = (aroma || 0) + (appearance || 0) + (taste || 0) + (heat_level || 0) + (creativity || 0);

    // Insert using database ID (chiliRow.id), not the number
    const stmt = db.prepare(`
      INSERT INTO scores (chili_id, aroma, appearance, taste, heat_level, creativity, total_score, judge_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      chiliRow.id,  // Use database ID for foreign key
      aroma || 0,
      appearance || 0,
      taste || 0,
      heat_level || 0,
      creativity || 0,
      total,
      judge_id || null  // Add judge_id to track who scored
    );

    console.log(`Score saved for Chili #${chili_id} (DB ID: ${chiliRow.id}) - Total: ${total}`);

    return res.status(201).json({
      id: result.lastInsertRowid,
      chili_number: chili_id,  // Return the number for frontend
      chili_db_id: chiliRow.id,  // Return DB ID for debugging
      total_score: total,
    });
  } catch (err) {
    console.error("Error saving score:", err);
    return res.status(500).json({ error: "Failed to save score", details: err.message });
  }
});

// GET aggregated scores including bonus points
app.get("/api/scores/final", (req, res) => {
  try {
    console.log("GET /api/scores/final - fetching final scores with bonus points");

    // All JOINs use chilis.id (the primary key / database ID)
    const stmt = db.prepare(`
      SELECT 
        c.number,
        c.name,
        c.cook,
        COUNT(DISTINCT s.id) as score_count,
        ROUND(COALESCE(AVG(s.aroma), 0), 2) as avg_aroma,
        ROUND(COALESCE(AVG(s.appearance), 0), 2) as avg_appearance,
        ROUND(COALESCE(AVG(s.taste), 0), 2) as avg_taste,
        ROUND(COALESCE(AVG(s.heat_level), 0), 2) as avg_heat_level,
        ROUND(COALESCE(AVG(s.creativity), 0), 2) as avg_creativity,
        ROUND(COALESCE(AVG(s.total_score), 0), 2) as avg_total_score,
        COALESCE(MAX(s.total_score), 0) as max_total_score,
        COALESCE(MIN(s.total_score), 0) as min_total_score,
        COALESCE(SUM(b.bonus_points), 0) as total_bonus_points,
        COUNT(DISTINCT b.judge_id) as bonus_voters,
        ROUND(COALESCE(AVG(s.total_score), 0) + COALESCE(SUM(b.bonus_points), 0), 2) as final_score
      FROM chilis c
      LEFT JOIN scores s ON c.id = s.chili_id
      LEFT JOIN bonus_scores b ON c.id = b.chili_id
      GROUP BY c.id, c.number, c.name, c.cook
      ORDER BY final_score DESC, avg_total_score DESC, c.number ASC
    `);

    const results = stmt.all();
    
    // Debug logging to verify data
    console.log(`Final scores calculated for ${results.length} chilis`);
    results.forEach(r => {
      console.log(`Chili #${r.number}: Scores=${r.score_count}, Avg=${r.avg_total_score}, Bonus=${r.total_bonus_points}, Final=${r.final_score}`);
    });

    res.json(results);
  } catch (error) {
    console.error("Error fetching final scores:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch final scores", details: error.message });
  }
});

// GET scores for a specific chili - accepts chili NUMBER and converts to ID
app.get("/api/scores/:chiliId", (req, res) => {
  try {
    const chiliNumber = parseInt(req.params.chiliId);
    console.log("GET /api/scores/" + chiliNumber);

    // Convert chili NUMBER to database ID
    const chiliRow = db.prepare('SELECT id FROM chilis WHERE number = ?').get(chiliNumber);
    
    if (!chiliRow) {
      return res.status(404).json({ error: `Chili #${chiliNumber} not found` });
    }

    // Query using database ID
    const stmt = db.prepare(`
      SELECT * FROM scores 
      WHERE chili_id = ? 
      ORDER BY created_at DESC
    `);
    const scores = stmt.all(chiliRow.id);

    console.log("Found", scores.length, "scores for chili #", chiliNumber);
    res.json(scores);
  } catch (error) {
    console.error("Error fetching scores:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch scores", details: error.message });
  }
});

// GET all scores - returns all scores for all chilis with aggregated statistics
app.get("/api/scores", (req, res) => {
  try {
    console.log("GET /api/scores - fetching all scores");

    // Aggregate scores by chili, joining on database ID
    const stmt = db.prepare(`
      SELECT 
        c.number,
        c.name,
        c.cook,
        COUNT(DISTINCT s.id) as score_count,
        ROUND(COALESCE(AVG(s.aroma), 0), 2) as avg_aroma,
        ROUND(COALESCE(AVG(s.appearance), 0), 2) as avg_appearance,
        ROUND(COALESCE(AVG(s.taste), 0), 2) as avg_taste,
        ROUND(COALESCE(AVG(s.heat_level), 0), 2) as avg_heat_level,
        ROUND(COALESCE(AVG(s.creativity), 0), 2) as avg_creativity,
        ROUND(COALESCE(AVG(s.total_score), 0), 2) as avg_total_score,
        COALESCE(MAX(s.total_score), 0) as max_total_score,
        COALESCE(MIN(s.total_score), 0) as min_total_score
      FROM chilis c
      LEFT JOIN scores s ON c.id = s.chili_id
      GROUP BY c.id, c.number, c.name, c.cook
      ORDER BY avg_total_score DESC, c.number ASC
    `);

    const results = stmt.all();
    console.log("Aggregated scores for", results.length, "chilis");
    res.json(results);
  } catch (error) {
    console.error("Error fetching all scores:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch scores", details: error.message });
  }
});

// ========================================
// VOTE ENDPOINTS (attendee voting system)
// ========================================

// POST a vote - saves attendee's top 3 picks (5pts, 3pts, 1pt)
app.post("/api/votes", (req, res) => {
  try {
    console.log("POST /api/votes", req.body);

    const { first_place, second_place, third_place, ip_address, user_agent } =
      req.body;

    // Validate required fields
    if (!first_place || !second_place || !third_place) {
      return res
        .status(400)
        .json({ error: "Must select first, second, and third place" });
    }

    // Validate all three are different chilis
    if (
      first_place === second_place ||
      first_place === third_place ||
      second_place === third_place
    ) {
      return res
        .status(400)
        .json({ error: "Must select three different chilis" });
    }

    // Insert vote into database
    const stmt = db.prepare(`
      INSERT INTO votes (first_place, second_place, third_place, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      first_place,
      second_place,
      third_place,
      ip_address || null,
      user_agent || null
    );

    console.log(
      "Vote saved - 1st:",
      first_place,
      "2nd:",
      second_place,
      "3rd:",
      third_place
    );

    return res.status(201).json({
      message: "Vote saved",
      id: result.lastInsertRowid,
    });
  } catch (error) {
    console.error("Error saving vote:", error);
    res
      .status(500)
      .json({ error: "Failed to save vote", details: error.message });
  }
});

// GET vote results - calculates winner with tiebreaker logic
app.get("/api/votes/results", (req, res) => {
  try {
    console.log("GET /api/votes/results - calculating results");

    // Calculate points for each chili (1st = 5pts, 2nd = 3pts, 3rd = 1pt)
    const stmt = db.prepare(`
      SELECT 
        c.number,
        c.name,
        c.cook,
        SUM(CASE 
          WHEN v.first_place = c.number THEN 5
          WHEN v.second_place = c.number THEN 3
          WHEN v.third_place = c.number THEN 1
          ELSE 0
        END) as total_points,
        SUM(CASE WHEN v.first_place = c.number THEN 1 ELSE 0 END) as first_place_votes,
        SUM(CASE WHEN v.second_place = c.number THEN 1 ELSE 0 END) as second_place_votes,
        SUM(CASE WHEN v.third_place = c.number THEN 1 ELSE 0 END) as third_place_votes,
        COUNT(DISTINCT v.id) as total_votes_received
      FROM chilis c
      LEFT JOIN votes v ON c.number IN (v.first_place, v.second_place, v.third_place)
      GROUP BY c.number, c.name, c.cook
      ORDER BY 
        total_points DESC, 
        first_place_votes DESC, 
        second_place_votes DESC
    `);

    const results = stmt.all();

    // Get total vote count
    const voteCountStmt = db.prepare("SELECT COUNT(*) as count FROM votes");
    const voteCount = voteCountStmt.get();

    console.log("Vote results calculated for", results.length, "chilis");
    console.log("Total votes cast:", voteCount.count);

    res.json({
      results,
      totalVotes: voteCount.count,
      votingSystem: {
        firstPlace: 5,
        secondPlace: 3,
        thirdPlace: 1,
      },
    });
  } catch (error) {
    console.error("Error calculating vote results:", error);
    res
      .status(500)
      .json({ error: "Failed to calculate results", details: error.message });
  }
});

// ========================================
// COMPETITION STATUS ENDPOINTS
// ========================================

// GET competition status - returns current competition state (setup/voting/closed)
app.get("/api/competition/status", (req, res) => {
  try {
    const stmt = db.prepare("SELECT status FROM competition WHERE id = 1");
    const result = stmt.get();
    res.json({ status: result.status });
  } catch (error) {
    console.error("Error getting competition status:", error);
    res
      .status(500)
      .json({ error: "Failed to get status", details: error.message });
  }
});

// POST competition status - updates competition state (admin only)
app.post("/api/competition/status", (req, res) => {
  try {
    const { status } = req.body;

    // Validate status value - must be one of three allowed states
    if (!["setup", "voting", "closed"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Invalid status. Must be: setup, voting, or closed" });
    }

    const stmt = db.prepare(`
      UPDATE competition 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = 1
    `);
    stmt.run(status);

    console.log("Competition status updated to:", status);
    res.json({ message: "Status updated", status });
  } catch (error) {
    console.error("Error updating status:", error);
    res
      .status(500)
      .json({ error: "Failed to update status", details: error.message });
  }
});

// GET admin statistics - returns overview of competition data
app.get("/api/admin/stats", (req, res) => {
  try {
    const chiliCount = db.prepare("SELECT COUNT(*) as count FROM chilis").get();
    const voteCount = db.prepare("SELECT COUNT(*) as count FROM votes").get();
    const scoreCount = db.prepare("SELECT COUNT(*) as count FROM scores").get();
    const status = db
      .prepare("SELECT status FROM competition WHERE id = 1")
      .get();

    res.json({
      totalChilis: chiliCount.count,
      totalVotes: voteCount.count,
      totalScores: scoreCount.count,
      competitionStatus: status.status,
    });
  } catch (error) {
    console.error("Error getting admin stats:", error);
    res
      .status(500)
      .json({ error: "Failed to get stats", details: error.message });
  }
});

// ========================================
// BONUS ROUND ENDPOINTS
// ========================================

// GET bonus round status
app.get("/api/competition/bonus/status", (req, res) => {
  try {
    const stmt = db.prepare(
      "SELECT bonus_round_active FROM competition WHERE id = 1"
    );
    const result = stmt.get();

    // If no competition record exists, create one
    if (!result) {
      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO competition (id, status, bonus_round_active, created_at, updated_at)
        VALUES (1, 'setup', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
      insertStmt.run();
      return res.json({ bonus_round_active: false });
    }

    res.json({ bonus_round_active: !!result.bonus_round_active });
  } catch (error) {
    console.error("Error getting bonus round status:", error);
    res
      .status(500)
      .json({
        error: "Failed to get bonus round status",
        details: error.message,
      });
  }
});

// DEBUG: Check bonus scores in database
app.get("/api/debug/bonus-scores", (req, res) => {
  try {
    const bonusScores = db.prepare("SELECT * FROM bonus_scores").all();
    const chilis = db.prepare("SELECT id, number, name FROM chilis").all();

    res.json({
      bonus_scores: bonusScores,
      chilis,
      note: "Check if chili_id matches chili number",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST start bonus round - admin only
app.post("/api/competition/bonus/start", (req, res) => {
  try {
    console.log("Starting bonus round");

    const stmt = db.prepare(`
      UPDATE competition 
      SET bonus_round_active = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = 1
    `);
    const result = stmt.run();

    // If no rows were updated, create the competition record
    if (result.changes === 0) {
      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO competition (id, status, bonus_round_active, created_at, updated_at)
        VALUES (1, 'voting', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
      insertStmt.run();
    }

    console.log("Bonus round started");
    res.json({ message: "Bonus round started", bonus_round_active: true });
  } catch (error) {
    console.error("Error starting bonus round:", error);
    res
      .status(500)
      .json({ error: "Failed to start bonus round", details: error.message });
  }
});

// POST end bonus round - admin only
app.post("/api/competition/bonus/end", (req, res) => {
  try {
    console.log("Ending bonus round");

    const stmt = db.prepare(`
      UPDATE competition 
      SET bonus_round_active = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = 1
    `);
    stmt.run();

    console.log("Bonus round ended");
    res.json({ message: "Bonus round ended", bonus_round_active: false });
  } catch (error) {
    console.error("Error ending bonus round:", error);
    res
      .status(500)
      .json({ error: "Failed to end bonus round", details: error.message });
  }
});

// POST bonus scores - submit judge's bonus points (max 10 total across all chilis)
app.post("/api/bonus-scores", (req, res) => {
  try {
    console.log("POST /api/bonus-scores", req.body);

    const { bonus_scores, judge_id } = req.body;

    // Validate input structure
    if (!Array.isArray(bonus_scores) || !judge_id) {
      return res
        .status(400)
        .json({ error: "bonus_scores array and judge_id are required" });
    }

    // Validate total points don't exceed 10
    const totalPoints = bonus_scores.reduce(
      (sum, score) => sum + (score.bonus_points || 0),
      0
    );
    if (totalPoints > 10) {
      return res.status(400).json({
        error: "Total bonus points cannot exceed 10",
        totalPoints,
        maxPoints: 10,
      });
    }

    // Check if judge already submitted bonus scores
    const existingStmt = db.prepare(
      "SELECT COUNT(*) as count FROM bonus_scores WHERE judge_id = ?"
    );
    const existing = existingStmt.get(judge_id);
    if (existing.count > 0) {
      return res
        .status(400)
        .json({ error: "Judge has already submitted bonus scores" });
    }

    // Prepare insert statement - uses database ID as foreign key
    const insertStmt = db.prepare(`
      INSERT INTO bonus_scores (chili_id, bonus_points, judge_id)
      VALUES (?, ?, ?)
    `);

    // Transaction to insert all bonus scores atomically
    const insertBonusScores = db.transaction((scores) => {
      const inserted = [];
      
      for (const score of scores) {
        if (score.bonus_points > 0) {
          // Convert chili NUMBER to database ID
          const chiliRow = db.prepare('SELECT id, number FROM chilis WHERE number = ?').get(score.chili_id);
          
          if (chiliRow) {
            console.log(`Inserting bonus: Chili #${score.chili_id} (DB ID: ${chiliRow.id}), points=${score.bonus_points}, judge=${judge_id}`);
            insertStmt.run(chiliRow.id, score.bonus_points, judge_id);
            inserted.push({ chili_number: score.chili_id, db_id: chiliRow.id, points: score.bonus_points });
          } else {
            console.error(`Chili #${score.chili_id} not found in database - skipping`);
          }
        }
      }
      
      return inserted;
    });

    const inserted = insertBonusScores(bonus_scores);

    console.log(`Bonus scores saved for judge ${judge_id} - Total: ${totalPoints}, Inserted: ${inserted.length}`);

    return res.status(201).json({
      message: "Bonus scores saved",
      judge_id,
      total_points: totalPoints,
      inserted_count: inserted.length,
      details: inserted
    });
  } catch (error) {
    console.error("Error saving bonus scores:", error);
    res
      .status(500)
      .json({ error: "Failed to save bonus scores", details: error.message });
  }
});

// DEBUG: Check what final scores query returns
app.get("/api/debug/final-scores", (req, res) => {
  try {
    console.log('DEBUG: Final scores query');
    
    // Check what data exists
    const chilis = db.prepare('SELECT * FROM chilis ORDER BY number').all();
    const scores = db.prepare('SELECT * FROM scores').all();
    const bonusScores = db.prepare('SELECT * FROM bonus_scores').all();
    
    console.log('Chilis:', chilis.length);
    console.log('Regular scores:', scores.length);
    console.log('Bonus scores:', bonusScores.length);
    
    // Run the actual final scores query
    const stmt = db.prepare(`
      SELECT 
        c.number,
        c.name,
        c.cook,
        COUNT(DISTINCT s.id) as score_count,
        ROUND(AVG(s.aroma), 2) as avg_aroma,
        ROUND(AVG(s.appearance), 2) as avg_appearance,
        ROUND(AVG(s.taste), 2) as avg_taste,
        ROUND(AVG(s.heat_level), 2) as avg_heat_level,
        ROUND(AVG(s.creativity), 2) as avg_creativity,
        ROUND(AVG(s.total_score), 2) as avg_total_score,
        MAX(s.total_score) as max_total_score,
        MIN(s.total_score) as min_total_score,
        COALESCE(SUM(b.bonus_points), 0) as total_bonus_points,
        COUNT(DISTINCT b.judge_id) as bonus_voters,
        ROUND(COALESCE(AVG(s.total_score), 0) + COALESCE(SUM(b.bonus_points), 0), 2) as final_score
      FROM chilis c
      LEFT JOIN scores s ON c.id = s.chili_id 
      LEFT JOIN bonus_scores b ON c.id = b.chili_id 
      GROUP BY c.id, c.number, c.name, c.cook
      ORDER BY final_score DESC, avg_total_score DESC, avg_taste DESC
    `);
    
    const results = stmt.all();
    
    res.json({
      chilis,
      scores,
      bonusScores,
      finalResults: results,
      debug: 'Check if bonus points are showing up in final results'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// ERROR HANDLERS
// ========================================

// In production, catch-all handler for Vue.js routing (before 404)
if (isDocker || process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
      return next();
    }
    
    // For GET requests to non-API routes, serve the Vue app
    if (req.method === 'GET') {
      return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
    
    next();
  });
}

// 404 handler - catches any unmatched routes and logs them for debugging
app.use((req, res) => {
  console.log("404 Not Found:", req.method, req.url);
  res.status(404).json({ error: "Not Found", path: req.url });
});

// Graceful shutdown - close database connection when server stops
process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  db.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down gracefully...");
  db.close();
  process.exit(0);
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
  console.log("App URL:", appUrl);
  console.log("Database:", dbPath);
  console.log("Environment:", isDocker ? 'Docker/Production' : 'Development');
});