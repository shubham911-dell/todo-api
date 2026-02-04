const colors = require("colors");

// Configure colors theme
colors.setTheme({
    info: "cyan",
    success: "green",
    warn: "yellow",
    error: "red",
    debug: "blue",
});

// Timestamp helper
const getTimestamp = () => {
    return new Date().toISOString().replace("T", " ").substring(0, 19);
};

// Logger utility
const logger = {
    info: (message, data = null) => {
        console.log(`[${getTimestamp()}] ℹ️  INFO:`.info, message);
        if (data) console.log(data);
    },

    success: (message, data = null) => {
        console.log(`[${getTimestamp()}] ✅ SUCCESS:`.success, message);
        if (data) console.log(data);
    },

    error: (message, error = null) => {
        console.log(`[${getTimestamp()}] ❌ ERROR:`.error, message);
        if (error) {
            if (error.stack) {
                console.log(error.stack.error);
            } else {
                console.log(error);
            }
        }
    },

    warn: (message, data = null) => {
        console.log(`[${getTimestamp()}] ⚠️  WARNING:`.warn, message);
        if (data) console.log(data);
    },

    debug: (message, data = null) => {
        if (process.env.NODE_ENV === "development") {
            console.log(`[${getTimestamp()}] 🔍 DEBUG:`.debug, message);
            if (data) console.log(data);
        }
    },

    request: (method, url, userId = null) => {
        const userInfo = userId ? `User(${userId})` : "Unauthenticated";
        console.log(
            `[${getTimestamp()}] 📥 REQUEST:`.info,
            `${method} ${url} - ${userInfo}`
        );
    },

    response: (method, url, statusCode, userId = null) => {
        const userInfo = userId ? `User(${userId})` : "Unauthenticated";
        const color = statusCode >= 400 ? "error" : "success";
        console.log(
            `[${getTimestamp()}] 📤 RESPONSE:`.success,
            `${method} ${url} - ${statusCode} - ${userInfo}`
        );
    },
};

module.exports = logger;
