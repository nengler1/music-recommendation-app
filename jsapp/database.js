const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./users.db')

db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        spotify_id TEXT UNIQUE,
        username TEXT UNIQUE,
        password TEXT
    )
`)

module.exports = db