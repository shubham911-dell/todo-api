const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");
const logger = require("../middleware/logger");
const uploadController = require("../controllers/upload.controller");

// ============================================
// MULTER ERROR HANDLER MIDDLEWARE
// ============================================
const handleMulterError = (err, req, res, next) => {
    const requestId = Date.now();

    if (err instanceof multer.MulterError) {
        // Multer-specific errors
        switch (err.code) {
            case "LIMIT_FILE_SIZE":
                logger.error(`[MULTER_ERROR_${requestId}] Upload failed - ERROR_FILE_TOO_LARGE`, {
                    userId: req.userId || "unknown",
                    fileSize: err.limit,
                    maxSize: "10MB"
                });
                return res.status(413).json({
                    success: false,
                    error: "ERROR_FILE_TOO_LARGE",
                    code: 4131,
                    message: "File size exceeds the 10MB limit",
                    maxSize: "10MB",
                    requestId
                });
            case "LIMIT_FILE_COUNT":
                logger.error(`[MULTER_ERROR_${requestId}] Upload failed - ERROR_TOO_MANY_FILES`, {
                    userId: req.userId || "unknown"
                });
                return res.status(400).json({
                    success: false,
                    error: "ERROR_TOO_MANY_FILES",
                    code: 4001,
                    message: "Only 1 file can be uploaded at a time",
                    requestId
                });
            case "LIMIT_UNEXPECTED_FILE":
                logger.error(`[MULTER_ERROR_${requestId}] Upload failed - ERROR_WRONG_FIELD_NAME`, {
                    userId: req.userId || "unknown",
                    receivedField: err.field
                });
                return res.status(400).json({
                    success: false,
                    error: "ERROR_WRONG_FIELD_NAME",
                    code: 4002,
                    message: "Use 'image' as the form field key for file upload",
                    hint: "In Postman: Body → form-data → Key should be exactly 'image' (not 'images' or other names)",
                    requestId
                });
            default:
                logger.error(`[MULTER_ERROR_${requestId}] Upload failed - ERROR_UPLOAD_GENERAL`, {
                    userId: req.userId || "unknown",
                    errorCode: err.code,
                    message: err.message
                });
                return res.status(400).json({
                    success: false,
                    error: "ERROR_UPLOAD_GENERAL",
                    code: 4009,
                    message: err.message || "An error occurred during file upload",
                    requestId
                });
        }
    } else if (err) {
        // Custom errors (like invalid file type)
        if (err.code === "INVALID_FILE_TYPE") {
            logger.error(`[MULTER_ERROR_${requestId}] Upload failed - ERROR_INVALID_FILE_TYPE`, {
                userId: req.userId || "unknown",
                receivedType: err.mimetype,
                allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
            });
            return res.status(400).json({
                success: false,
                error: "ERROR_INVALID_FILE_TYPE",
                code: 4003,
                message: err.message,
                allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
                requestId
            });
        }
        // Generic error
        logger.error(`[MULTER_ERROR_${requestId}] Upload failed - ERROR_SERVER`, {
            userId: req.userId || "unknown",
            error: err.message,
            stack: err.stack
        });
        return res.status(500).json({
            success: false,
            error: "ERROR_SERVER",
            code: 5001,
            message: err.message || "An unexpected error occurred during upload",
            requestId
        });
    }
    next();
};

// ============================================
// ROUTES
// ============================================

// List images (Protected)
// GET /api/upload
router.get(
    "/upload",
    auth,
    uploadController.listImages
);

// Upload image (Protected)
// POST /api/upload
router.post(
    "/upload",
    auth,
    upload.single("image"),
    handleMulterError,
    uploadController.uploadImage
);

// Delete image (Protected)
// DELETE /api/upload/:filename
router.delete(
    "/upload/:filename",
    auth,
    uploadController.deleteImage
);

module.exports = router;
