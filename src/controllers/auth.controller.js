const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../middleware/logger");

exports.register = (req, res) => {
  const { username, email, password } = req.body;
  const requestId = Date.now();

  logger.info(`[REGISTER_${requestId}] Registration attempt`, { email, username });

  // Validation
  if (!email || !password || !username) {
    logger.error(`[REGISTER_${requestId}] Registration failed - ERROR_MISSING_FIELDS`, { 
      email, 
      username,
      hasUsername: !!username,
      hasEmail: !!email,
      hasPassword: !!password
    });
    return res.status(400).json({
      success: false,
      error: "ERROR_MISSING_FIELDS",
      code: 4001,
      message: "Email, username, and password are all required",
      missingFields: {
        username: !username,
        email: !email,
        password: !password
      },
      requestId
    });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = `
    INSERT INTO users (username, email, password, todo_count, image_count)
    VALUES (?, ?, ?, 0, 0)
  `;

  db.query(sql, [username, email, hashedPassword], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        const isDuplicate = err.message.includes("email") ? "email" : "username";
        logger.error(`[REGISTER_${requestId}] Registration failed - ERROR_DUPLICATE_${isDuplicate.toUpperCase()}`, { 
          email,
          username,
          duplicateField: isDuplicate
        });
        return res.status(409).json({
          success: false,
          error: `ERROR_DUPLICATE_${isDuplicate.toUpperCase()}`,
          code: 4091,
          message: `This ${isDuplicate} is already registered`,
          field: isDuplicate,
          requestId
        });
      }
      logger.error(`[REGISTER_${requestId}] Registration failed - ERROR_DATABASE`, { 
        email,
        username,
        dbError: err.message,
        code: err.code
      });
      return res.status(500).json({
        success: false,
        error: "ERROR_DATABASE",
        code: 5001,
        message: "Database error during registration",
        requestId
      });
    }

    logger.success(`[REGISTER_${requestId}] User registered successfully`, {
      userId: result.insertId,
      email,
      username
    });
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: result.insertId,
      requestId
    });
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  const requestId = Date.now();

  logger.info(`[LOGIN_${requestId}] Login attempt`, { email });

  // Validation
  if (!email || !password) {
    logger.error(`[LOGIN_${requestId}] Login failed - ERROR_MISSING_CREDENTIALS`, {
      hasEmail: !!email,
      hasPassword: !!password
    });
    return res.status(400).json({
      success: false,
      error: "ERROR_MISSING_CREDENTIALS",
      code: 4001,
      message: "Email and password are required",
      missingFields: {
        email: !email,
        password: !password
      },
      requestId
    });
  }

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      logger.error(`[LOGIN_${requestId}] Login failed - ERROR_DATABASE`, { 
        email,
        dbError: err.message
      });
      return res.status(500).json({
        success: false,
        error: "ERROR_DATABASE",
        code: 5001,
        message: "Database error during login",
        requestId
      });
    }

    if (results.length === 0) {
      logger.error(`[LOGIN_${requestId}] Login failed - ERROR_USER_NOT_FOUND`, { email });
      return res.status(401).json({
        success: false,
        error: "ERROR_USER_NOT_FOUND",
        code: 4011,
        message: "Invalid email or password",
        requestId
      });
    }

    const user = results[0];

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      logger.error(`[LOGIN_${requestId}] Login failed - ERROR_INVALID_PASSWORD`, { email });
      return res.status(401).json({
        success: false,
        error: "ERROR_INVALID_PASSWORD",
        code: 4012,
        message: "Invalid email or password",
        requestId
      });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    logger.success(`[LOGIN_${requestId}] Login successful`, { userId: user.id, email });
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        todo_count: user.todo_count,
        image_count: user.image_count
      },
      requestId
    });
  });
};

exports.updateProfile = (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  const userId = req.userId;
  const requestId = Date.now();

  logger.info(`[PROFILE_${requestId}] Update profile attempt`, {
    userId,
    hasUsername: username !== undefined,
    changePassword: !!newPassword
  });

  if ((username === undefined || username === null) && !newPassword) {
    logger.error(`[PROFILE_${requestId}] Update profile failed - ERROR_NO_CHANGES`, { userId });
    return res.status(400).json({
      success: false,
      error: "ERROR_NO_CHANGES",
      code: 4001,
      message: "Provide a username or a new password to update",
      requestId
    });
  }

  if (username !== undefined && String(username).trim() === "") {
    logger.error(`[PROFILE_${requestId}] Update profile failed - ERROR_INVALID_USERNAME`, { userId });
    return res.status(400).json({
      success: false,
      error: "ERROR_INVALID_USERNAME",
      code: 4002,
      message: "Username cannot be empty",
      requestId
    });
  }

  if (newPassword && !currentPassword) {
    logger.error(`[PROFILE_${requestId}] Update profile failed - ERROR_MISSING_CURRENT_PASSWORD`, { userId });
    return res.status(400).json({
      success: false,
      error: "ERROR_MISSING_CURRENT_PASSWORD",
      code: 4003,
      message: "Current password is required to set a new password",
      requestId
    });
  }

  db.query("SELECT * FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) {
      logger.error(`[PROFILE_${requestId}] Update profile failed - ERROR_DATABASE`, {
        userId,
        dbError: err.message
      });
      return res.status(500).json({
        success: false,
        error: "ERROR_DATABASE",
        code: 5001,
        message: "Database error while fetching user",
        requestId
      });
    }

    if (results.length === 0) {
      logger.error(`[PROFILE_${requestId}] Update profile failed - ERROR_USER_NOT_FOUND`, { userId });
      return res.status(404).json({
        success: false,
        error: "ERROR_USER_NOT_FOUND",
        code: 4041,
        message: "User not found",
        requestId
      });
    }

    const user = results[0];
    const finalUsername = username !== undefined ? String(username).trim() : user.username;

    const proceedWithUpdate = (finalPasswordHash) => {
      db.query(
        "UPDATE users SET username = ?, password = ? WHERE id = ?",
        [finalUsername, finalPasswordHash, userId],
        (updateErr) => {
          if (updateErr) {
            if (updateErr.code === "ER_DUP_ENTRY") {
              logger.error(`[PROFILE_${requestId}] Update profile failed - ERROR_DUPLICATE_USERNAME`, {
                userId,
                username: finalUsername
              });
              return res.status(409).json({
                success: false,
                error: "ERROR_DUPLICATE_USERNAME",
                code: 4091,
                message: "Username already exists",
                requestId
              });
            }
            logger.error(`[PROFILE_${requestId}] Update profile failed - ERROR_DATABASE`, {
              userId,
              dbError: updateErr.message
            });
            return res.status(500).json({
              success: false,
              error: "ERROR_DATABASE",
              code: 5001,
              message: "Database error while updating user",
              requestId
            });
          }

          logger.success(`[PROFILE_${requestId}] Profile updated successfully`, { userId });
          return res.json({
            success: true,
            message: "Profile updated successfully",
            user: {
              id: user.id,
              username: finalUsername,
              email: user.email,
              todo_count: user.todo_count,
              image_count: user.image_count
            },
            requestId
          });
        }
      );
    };

    if (newPassword) {
      const isMatch = bcrypt.compareSync(currentPassword, user.password);
      if (!isMatch) {
        logger.error(`[PROFILE_${requestId}] Update profile failed - ERROR_INVALID_CURRENT_PASSWORD`, { userId });
        return res.status(401).json({
          success: false,
          error: "ERROR_INVALID_CURRENT_PASSWORD",
          code: 4011,
          message: "Current password is incorrect",
          requestId
        });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      proceedWithUpdate(hashedPassword);
    } else {
      proceedWithUpdate(user.password);
    }
  });
};
