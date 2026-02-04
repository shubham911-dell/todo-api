const db = require("../config/db");
const logger = require("../middleware/logger");

// CREATE TODO (for logged-in user)
exports.createTodo = (req, res) => {
  const { title } = req.body;
  const userId = req.userId; // Set by auth middleware
  const requestId = Date.now();

  logger.info(`[CREATE_TODO_${requestId}] Create todo attempt by User(${userId})`);

  if (!title || title.trim() === "") {
    logger.error(`[CREATE_TODO_${requestId}] Create todo failed - ERROR_MISSING_TITLE`, { userId });
    return res.status(400).json({
      success: false,
      error: "ERROR_MISSING_TITLE",
      code: 4001,
      message: "Todo title is required and cannot be empty",
      requestId
    });
  }

  const sql = "INSERT INTO todos (title, userId) VALUES (?, ?)";

  db.query(sql, [title, userId], (err, result) => {
    if (err) {
      logger.error(`[CREATE_TODO_${requestId}] Create todo failed - ERROR_DATABASE`, {
        userId,
        title,
        dbError: err.message,
        code: err.code
      });
      return res.status(500).json({
        success: false,
        error: "ERROR_DATABASE",
        code: 5001,
        message: "Failed to create todo in database",
        requestId
      });
    }

    const todoId = result.insertId;

    db.query(
      "UPDATE users SET todo_count = todo_count + 1 WHERE id = ?",
      [userId],
      (countErr) => {
        if (countErr) {
          logger.warn(`[CREATE_TODO_${requestId}] Todo count update failed - WARNING_COUNT_SYNC`, { 
            userId, 
            todoId, 
            error: countErr.message 
          });
        }

        logger.success(`[CREATE_TODO_${requestId}] Todo created successfully`, {
          todoId,
          title,
          userId
        });
        res.status(201).json({
          success: true,
          message: "Todo created successfully",
          todo: {
            id: todoId,
            title,
            completed: false
          },
          requestId
        });
      }
    );
  });
};

// GET TODOS (only for logged-in user)
exports.getTodos = (req, res) => {
  const userId = req.userId;
  const requestId = Date.now();

  logger.info(`[GET_TODOS_${requestId}] Get todos request by User(${userId})`);

  db.query("SELECT * FROM todos WHERE userId = ?", [userId], (err, results) => {
    if (err) {
      logger.error(`[GET_TODOS_${requestId}] Get todos failed - ERROR_DATABASE`, {
        userId,
        dbError: err.message
      });
      return res.status(500).json({
        success: false,
        error: "ERROR_DATABASE",
        code: 5001,
        message: "Failed to fetch todos from database",
        requestId
      });
    }

    logger.success(`[GET_TODOS_${requestId}] Fetched ${results.length} todos for User(${userId})`);
    res.json({
      success: true,
      count: results.length,
      todos: results,
      requestId
    });
  });
};

// DELETE TODO (only if it belongs to logged-in user)
exports.deleteTodo = (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const requestId = Date.now();

  logger.info(`[DELETE_TODO_${requestId}] Delete todo attempt`, { todoId: id, userId });

  if (!id || isNaN(id)) {
    logger.error(`[DELETE_TODO_${requestId}] Delete todo failed - ERROR_INVALID_ID`, { 
      todoId: id,
      userId 
    });
    return res.status(400).json({
      success: false,
      error: "ERROR_INVALID_ID",
      code: 4001,
      message: "Todo ID must be a valid number",
      requestId
    });
  }

  const sql = "DELETE FROM todos WHERE id = ? AND userId = ?";

  db.query(sql, [id, userId], (err, result) => {
    if (err) {
      logger.error(`[DELETE_TODO_${requestId}] Delete todo failed - ERROR_DATABASE`, { 
        todoId: id,
        userId,
        dbError: err.message
      });
      return res.status(500).json({
        success: false,
        error: "ERROR_DATABASE",
        code: 5001,
        message: "Failed to delete todo from database",
        requestId
      });
    }

    if (result.affectedRows === 0) {
      logger.error(`[DELETE_TODO_${requestId}] Delete todo failed - ERROR_NOT_FOUND_OR_UNAUTHORIZED`, {
        todoId: id,
        userId,
        reason: "Todo not found or user is not the owner"
      });
      return res.status(404).json({
        success: false,
        error: "ERROR_NOT_FOUND_OR_UNAUTHORIZED",
        code: 4041,
        message: "Todo not found or you don't have permission to delete it",
        requestId
      });
    }

    db.query(
      "UPDATE users SET todo_count = GREATEST(todo_count - 1, 0) WHERE id = ?",
      [userId],
      (countErr) => {
        if (countErr) {
          logger.warn(`[DELETE_TODO_${requestId}] Todo count update failed - WARNING_COUNT_SYNC`, { 
            userId, 
            todoId: id,
            error: countErr.message 
          });
        }

        logger.success(`[DELETE_TODO_${requestId}] Todo deleted successfully`, { todoId: id, userId });
        res.json({
          success: true,
          message: "Todo deleted successfully",
          requestId
        });
      }
    );
  });
};

// UPDATE TODO (only if it belongs to logged-in user)
exports.updateTodo = (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;
  const userId = req.userId;
  const requestId = Date.now();

  logger.info(`[UPDATE_TODO_${requestId}] Update todo attempt`, { todoId: id, userId, title, completed });

  if (!id || isNaN(id)) {
    logger.error(`[UPDATE_TODO_${requestId}] Update todo failed - ERROR_INVALID_ID`, { 
      todoId: id,
      userId
    });
    return res.status(400).json({
      success: false,
      error: "ERROR_INVALID_ID",
      code: 4001,
      message: "Todo ID must be a valid number",
      requestId
    });
  }

  if (title !== undefined && (!title || title.trim() === "")) {
    logger.error(`[UPDATE_TODO_${requestId}] Update todo failed - ERROR_INVALID_TITLE`, { 
      todoId: id,
      userId,
      title
    });
    return res.status(400).json({
      success: false,
      error: "ERROR_INVALID_TITLE",
      code: 4002,
      message: "Todo title cannot be empty",
      requestId
    });
  }

  const sql = `
    UPDATE todos
    SET title = ?, completed = ?
    WHERE id = ? AND userId = ?
  `;

  db.query(sql, [title, completed, id, userId], (err, result) => {
    if (err) {
      logger.error(`[UPDATE_TODO_${requestId}] Update todo failed - ERROR_DATABASE`, {
        todoId: id,
        userId,
        dbError: err.message
      });
      return res.status(500).json({
        success: false,
        error: "ERROR_DATABASE",
        code: 5001,
        message: "Failed to update todo in database",
        requestId
      });
    }

    if (result.affectedRows === 0) {
      logger.error(`[UPDATE_TODO_${requestId}] Update todo failed - ERROR_NOT_FOUND_OR_UNAUTHORIZED`, {
        todoId: id,
        userId,
        reason: "Todo not found or user is not the owner"
      });
      return res.status(404).json({
        success: false,
        error: "ERROR_NOT_FOUND_OR_UNAUTHORIZED",
        code: 4041,
        message: "Todo not found or you don't have permission to update it",
        requestId
      });
    }

    logger.success(`[UPDATE_TODO_${requestId}] Todo updated successfully`, {
      todoId: id,
      title,
      completed,
      userId
    });
    res.json({
      success: true,
      message: "Todo updated successfully",
      todo: {
        id,
        title,
        completed
      },
      requestId
    });
  });
};
