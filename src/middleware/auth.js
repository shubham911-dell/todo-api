const jwt = require("jsonwebtoken");
const logger = require("./logger");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Log the authentication attempt
  logger.info(`Auth check for ${req.method} ${req.originalUrl}`);

  if (!authHeader) {
    logger.warn(`No authorization header provided for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({
      success: false,
      message: "No token provided. Please login first."
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    logger.warn(`Invalid authorization header format for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({
      success: false,
      message: "Invalid token format. Use 'Bearer <token>'"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    logger.success(`Authentication successful for User(${req.userId}) - ${req.method} ${req.originalUrl}`);
    next();
  } catch (err) {
    logger.error(`Invalid or expired token for ${req.method} ${req.originalUrl}`, err);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again."
    });
  }
};
