const express = require("express");
const router = express.Router();

// Controllers
const todoController = require("../controllers/todo.controller");

// Middleware
const auth = require("../middleware/auth");

// ============================================
// TODO ROUTES (Protected)
// ============================================

// Test route to verify auth is working
router.get("/test-auth", auth, (req, res) => {
    res.json({
        message: "Auth is working!",
        userId: req.userId
    });
});

// CRUD Operations
router.post("/todos", auth, todoController.createTodo);
router.get("/todos", auth, todoController.getTodos);
router.delete("/todos/:id", auth, todoController.deleteTodo);
router.put("/todos/:id", auth, todoController.updateTodo);



module.exports = router;
