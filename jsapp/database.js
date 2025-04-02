const sqlite3 = require('sqlite3').verbose()

// Create database connection
const db = new sqlite3.Database('./sqlite3.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err){
        console.error("Database Connection Error:", err)
    } else { 
        console.log("Connected to the SQLite database.")
    }
        
})

// Create Tables
db.serialize(() => {
    // user
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        spotify_id TEXT UNIQUE,
        name TEXT
    );
    `)

    // admins
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'author'))
    );
    `)
    
    // playlists
    db.run(`CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        user_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `)

    // tracks
    db.run(`CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        artist TEXT,
        popularity INTEGER,
        uri TEXT,
        playlist_id INTEGER,
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
    );
    `)
})

module.exports = db