const mysql = require("mysql2");

// Logger will be initialized after this module loads
let logger;
try {
    logger = require("../middleware/logger");
} catch (e) {
    // Fallback if logger not available during initial load
    logger = {
        info: console.log,
        success: console.log,
        error: console.error,
        warn: console.warn
    };
}

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

logger.info("Attempting to connect to MySQL database...", {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME,
    user: process.env.DB_USER
});

db.connect((err) => {
    if (err) {
        logger.error("❌ Database connection failed!", {
            code: err.code,
            errno: err.errno,
            message: err.message,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME
        });
        console.error("\n⚠️  Make sure MySQL is running and credentials are correct in .env file\n");
    } else {
        logger.success(`✅ MySQL connected successfully!`, {
            host: process.env.DB_HOST,
            database: process.env.DB_NAME
        });
    }
});

// Connection error handler
db.on("error", (err) => {
    logger.error("Database error occurred", {
        code: err.code,
        message: err.message
    });
});

module.exports = db;
