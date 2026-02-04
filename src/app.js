// ============================================
// 1. ENVIRONMENT & DEPENDENCIES
// ============================================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const colors = require("colors");

// ============================================
// 2. DATABASE CONNECTION
// ============================================
require("./config/db");

// ============================================
// 3. ROUTE IMPORTS
// ============================================
const authRoutes = require("./routes/auth.routes");
const todoRoutes = require("./routes/todo.routes");
const uploadRoutes = require("./routes/upload.routes");

// ============================================
// 4. MIDDLEWARE IMPORTS
// ============================================
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

// ============================================
// 5. APP INITIALIZATION
// ============================================
const app = express();

// ============================================
// 6. MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// HTTP Request Logger (morgan)
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
} else {
    app.use(morgan("combined"));
}

// Custom request logger
app.use((req, res, next) => {
    logger.request(req.method, req.originalUrl, req.userId);
    next();
});

// ============================================
// 7. ROUTES
// ============================================
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Todo API is running 🚀",
        version: "1.0.0",
        endpoints: {
            auth: "/api/register, /api/login",
            todos: "/api/todos",
            upload: "/api/upload"
        }
    });
});

app.use("/api", authRoutes);
app.use("/api", todoRoutes);
app.use("/api", uploadRoutes);

// ============================================
// 8. ERROR HANDLER (Must be last!)
// ============================================
app.use(errorHandler);

// ============================================
// 9. EXPORT
// ============================================
module.exports = app;
