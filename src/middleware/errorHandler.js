const logger = require("./logger");

// Centralized error handler middleware
const errorHandler = (err, req, res, next) => {
    // Log the error with details
    logger.error(
        `Error in ${req.method} ${req.originalUrl}`,
        {
            message: err.message,
            stack: err.stack,
            userId: req.userId || "Unauthenticated",
        }
    );

    // Determine status code
    const statusCode = err.statusCode || 500;

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

module.exports = errorHandler;
