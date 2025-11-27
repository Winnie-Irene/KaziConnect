require('dotenv').config();
const mysql = require('mysql2');

const connectionString = process.env.MYSQL_URL;

let pool;

if (connectionString) {
    // Use Railway URL if provided
    pool = mysql.createPool(connectionString);
} else {
    // Fallback to manual host/port
   const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: { rejectUnauthorized: true } 
});
}

const promisePool = pool.promise();

promisePool.getConnection()
    .then(conn => {
        console.log('✅ Database connected successfully!');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

module.exports = { pool, promisePool };
