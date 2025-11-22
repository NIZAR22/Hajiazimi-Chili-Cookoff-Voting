const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Create a new database connection
const db = new sqlite3.Database('./chili-cookoff.db');

// Read schema file
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

// Execute schema
db.exec(schema, (err) => {
    if (err) {
        console.error('Error creating database schema:', err);
    } else {
        console.log('Database schema created successfully');
    }
    db.close();
});