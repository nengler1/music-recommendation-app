const crypto = require('crypto')
require('dotenv').config()


// Hashing function for passwords
const hashPassword = (password, username) => {
    return crypto.createHash('sha256').update(password + username).digest('hex')
}

// validate
const authenticate = (authHeader) => {
    if (!authHeader || !authHeader.startsWith("Basic ")) return false
    
    try {
        const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8')
        const [username, password] = decoded.split(':')
        
        return !!username && !!password && users[username] === hashPassword(password, username)
    } catch (err) {
        return false
    }
}

// admin user (in memory)
const admin_pass = process.env.ADMIN_PASS
const users = {
    "natan": hashPassword(admin_pass, "natan"),
}

module.exports = { authenticate }
