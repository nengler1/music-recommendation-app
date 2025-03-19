const crypto = require('crypto')
require('dotenv').config()
const db = require('./database')
const auth = require('basic-auth')

// Hashing function for passwords
const hashPassword = (password, username) => {
    return crypto.createHash('sha256').update(password + username).digest('hex')
}

function authenticate(authHeader) {
    return new Promise((resolve) => {
        if (!authHeader || !authHeader.startsWith("Basic ")) {
            console.log("Missing or incorrect Authorization header format")
            return resolve(null)
        }

        try {
            const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8')
            const [username, password] = decoded.split(':')

            db.get("SELECT username, role, hashed_password FROM admins WHERE username = ?", [username], (err, row) => {
                if (err) {
                    console.log("Database error:", err.message)
                    return resolve(null)
                }
                if (!row) {
                    console.log("User not found in database");
                    return resolve(null)
                }

                const hashed_input_password = hashPassword(password, username)

                if (row.hashed_password === hashed_input_password) {
                    return resolve({ username: row.username, role: row.role })
                } else {
                    return resolve(null)
                }
            });

        } catch (err) {
            console.log("Error during process:", err.message)
            return resolve(null)
        }
    })
}

// admin user
const insertAdmin = (username, password) => {
    const hashed_password = hashPassword(password, username)
    const admin_query = db.prepare(`INSERT INTO admins (username, hashed_password, role) VALUES (?, ?, ?)`)
    admin_query.run(username, hashed_password, "admin", (err) => {
        if(err){
            console.error("Admin already exists or error:", err.message)
        }
    })
}

//insertAdmin("admin", process.env.ADMIN_PASS)

//db.run(`DELETE FROM admins WHERE id = 4`)

module.exports = { authenticate, hashPassword }
