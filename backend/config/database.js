const mysql = require("mysql2/promise");
require("dotenv").config();

// Connection pool (promise-based) instead of a single connection so the
// server can handle many concurrent requests safely.
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "stationery_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true // return DATE/DATETIME columns as plain strings (YYYY-MM-DD)
});

// Quick startup check so a bad connection fails loudly instead of silently.
(async function testConnection() {
    try {
        const conn = await pool.getConnection();
        console.log("Database Connected");
        conn.release();
    } catch (err) {
        console.log("Database Connection Failed");
        console.log(err.message);
    }
})();

module.exports = pool;

// Setup reminder:
// 1) mysql -u root -p < schema.sql
// 2) copy .env.example to .env and fill in DB credentials
// 3) cd backend && npm install
// 4) npm run dev (nodemon) or node server.js

// cd backend
// node server.js