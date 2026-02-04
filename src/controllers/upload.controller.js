const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const logger = require("../middleware/logger");

// ============================================
// UPLOAD IMAGE
// ============================================
exports.uploadImage = (req, res) => {
    const userId = req.userId;
    const requestId = Date.now();

    logger.info(`[UPLOAD_${requestId}] Image upload attempt by User(${userId})`);

    // No file uploaded
    if (!req.file) {
        const errorMsg = "No file provided in request body";
        logger.error(`[UPLOAD_${requestId}] Upload failed - ERROR_NO_FILE`, { 
            userId,
            reason: errorMsg,
            hint: "Ensure form-data key is 'image' and type is 'File'"
        });
        return res.status(400).json({
            success: false,
            error: "ERROR_NO_FILE",
            code: 4001,
            message: "No image file provided. Please upload an image file.",
            hint: "In Postman: Body → form-data → Key='image', Value=Select a File",
            requestId
        });
    }

    const filename = req.file.filename;
    const filesize = req.file.size;
    const mimetype = req.file.mimetype;

    // Check if file is empty (0 bytes)
    if (filesize === 0) {
        try {
            fs.unlinkSync(req.file.path);
            logger.error(`[UPLOAD_${requestId}] Upload failed - ERROR_EMPTY_FILE`, { 
                userId, 
                filename,
                filesize: 0
            });
        } catch (unlinkErr) {
            logger.error(`[UPLOAD_${requestId}] Failed to delete empty file`, { 
                userId, 
                filename,
                error: unlinkErr.message
            });
        }
        return res.status(400).json({
            success: false,
            error: "ERROR_EMPTY_FILE",
            code: 4002,
            message: "Uploaded file is empty (0 bytes). Please select a valid image.",
            requestId
        });
    }

    logger.info(`[UPLOAD_${requestId}] File received and validated`, { 
        userId,
        filename,
        filesize,
        mimetype
    });

    const imageRecord = {
        userId,
        filename,
        originalName: req.file.originalname,
        size: filesize,
        mimetype,
        path: `/uploads/${filename}`
    };

    db.query(
        "INSERT INTO images (userId, filename, original_name, size, mimetype, path) VALUES (?, ?, ?, ?, ?, ?)",
        [imageRecord.userId, imageRecord.filename, imageRecord.originalName, imageRecord.size, imageRecord.mimetype, imageRecord.path],
        (insertErr) => {
            if (insertErr) {
                logger.error(`[UPLOAD_${requestId}] Upload failed - ERROR_DB_INSERT`, {
                    userId,
                    filename,
                    dbError: insertErr.message
                });
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkErr) {
                    logger.error(`[UPLOAD_${requestId}] Failed to delete file after DB insert error`, {
                        userId,
                        filename,
                        error: unlinkErr.message
                    });
                }
                return res.status(500).json({
                    success: false,
                    error: "ERROR_DB_INSERT",
                    code: 5002,
                    message: "Failed to save image record in database.",
                    requestId
                });
            }

            db.query(
                "UPDATE users SET image_count = image_count + 1 WHERE id = ?",
                [userId],
                (countErr) => {
                    if (countErr) {
                        logger.warn(`[UPLOAD_${requestId}] Image count update failed - WARNING_COUNT_SYNC`, {
                            userId,
                            filename,
                            error: countErr.message
                        });
                    }

                    logger.success(`[UPLOAD_${requestId}] Image uploaded successfully`, {
                        userId,
                        filename,
                        filesize,
                        mimetype
                    });

                    res.status(201).json({
                        success: true,
                        message: "Image uploaded successfully",
                        requestId,
                        file: imageRecord
                    });
                }
            );
        }
    );
};

// ============================================
// LIST IMAGES (for logged-in user)
// ============================================
exports.listImages = (req, res) => {
    const userId = req.userId;
    const requestId = Date.now();

    logger.info(`[LIST_IMAGES_${requestId}] List images request by User(${userId})`);

    db.query(
        "SELECT filename, original_name AS originalName, size, mimetype, path FROM images WHERE userId = ? ORDER BY id DESC",
        [userId],
        (err, results) => {
            if (err) {
                logger.error(`[LIST_IMAGES_${requestId}] List images failed - ERROR_DATABASE`, {
                    userId,
                    dbError: err.message
                });
                return res.status(500).json({
                    success: false,
                    error: "ERROR_DATABASE",
                    code: 5001,
                    message: "Failed to fetch images from database",
                    requestId
                });
            }

            logger.success(`[LIST_IMAGES_${requestId}] Fetched ${results.length} images for User(${userId})`);
            return res.json({
                success: true,
                count: results.length,
                images: results,
                requestId
            });
        }
    );
};

// ============================================
// DELETE IMAGE (optional endpoint)
// ============================================
exports.deleteImage = (req, res) => {
    const { filename } = req.params;
    const userId = req.userId;
    const requestId = Date.now();

    logger.info(`[DELETE_IMAGE_${requestId}] Delete image attempt`, { userId, filename });

    if (!filename || filename.trim() === "") {
        logger.error(`[DELETE_IMAGE_${requestId}] Delete image failed - ERROR_MISSING_FILENAME`, { 
            userId,
            filename: filename || "empty"
        });
        return res.status(400).json({
            success: false,
            error: "ERROR_MISSING_FILENAME",
            code: 4001,
            message: "Filename is required to delete an image",
            requestId
        });
    }

    const filePath = path.join(__dirname, "..", "uploads", filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        logger.error(`[DELETE_IMAGE_${requestId}] Delete image failed - ERROR_FILE_NOT_FOUND`, { 
            userId, 
            filename,
            attemptedPath: filePath
        });
        return res.status(404).json({
            success: false,
            error: "ERROR_FILE_NOT_FOUND",
            code: 4041,
            message: "File not found on server",
            requestId
        });
    }

    try {
        fs.unlinkSync(filePath);

        logger.info(`[DELETE_IMAGE_${requestId}] File deleted from filesystem`, { 
            userId,
            filename,
            path: filePath
        });

        db.query(
            "DELETE FROM images WHERE userId = ? AND filename = ?",
            [userId, filename],
            (deleteErr) => {
                if (deleteErr) {
                    logger.error(`[DELETE_IMAGE_${requestId}] Delete image failed - ERROR_DB_DELETE`, {
                        userId,
                        filename,
                        dbError: deleteErr.message
                    });
                    return res.status(500).json({
                        success: false,
                        error: "ERROR_DB_DELETE",
                        code: 5002,
                        message: "Failed to delete image record from database",
                        requestId
                    });
                }

                db.query(
                    "UPDATE users SET image_count = GREATEST(image_count - 1, 0) WHERE id = ?",
                    [userId],
                    (countErr) => {
                        if (countErr) {
                            logger.warn(`[DELETE_IMAGE_${requestId}] Image count update failed - WARNING_COUNT_SYNC`, {
                                userId,
                                filename,
                                error: countErr.message
                            });
                        }

                        logger.success(`[DELETE_IMAGE_${requestId}] Image deleted successfully`, { userId, filename });
                        res.json({
                            success: true,
                            message: "Image deleted successfully",
                            requestId
                        });
                    }
                );
            }
        );
    } catch (error) {
        logger.error(`[DELETE_IMAGE_${requestId}] Delete image failed - ERROR_FILE_DELETE`, { 
            userId,
            filename,
            error: error.message,
            code: error.code
        });
        res.status(500).json({
            success: false,
            error: "ERROR_FILE_DELETE",
            code: 5001,
            message: "Failed to delete file from filesystem",
            requestId
        });
    }
};
