# Todo API + Frontend

A full-stack Todo app with:
- ✅ User registration & login (JWT)
- ✅ Todo CRUD
- ✅ Image upload & gallery per user
- ✅ Profile update (username/password)
- ✅ MySQL storage
- ✅ Frontend UI (HTML/CSS/JS)

---

## 📁 Project Structure

```
todo-api/
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── uploads/
│   └── config/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── README.md
└── package.json
```

---

## ✅ Requirements

- Node.js (18+)
- MySQL (8+)
- npm
- VS Code (recommended)

---

## ⚙️ Database Setup

Login to MySQL and run:

```
CREATE DATABASE todo_app;
USE todo_app;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    todo_count INT NOT NULL DEFAULT 0,
    image_count INT NOT NULL DEFAULT 0
);

CREATE TABLE todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    size INT NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);
```

---

## 🔧 Backend Setup

1. Install dependencies:
```
cd c:\Users\shubh\OneDrive\Desktop\todo-api
npm install
```

2. Configure DB in:
```
src/config/db.js
```
Set:
- host
- user
- password
- database = `todo_app`

3. Start server:
```
npm start
```

Server runs at:
```
http://localhost:5000
```

---

## 🖥️ Frontend Setup

Open frontend:

```
c:\Users\shubh\OneDrive\Desktop\todo-api\frontend\index.html
```

Best option:
- Use VS Code Live Server
- OR open directly in browser

---

## 🔐 Authentication

- Register → Login → Token stored in localStorage
- Token is required for all protected routes

---

## ✅ API Endpoints

### Auth
- POST `/api/register`
- POST `/api/login`
- PUT `/api/profile`

### Todos
- GET `/api/todos`
- POST `/api/todos`
- PUT `/api/todos/:id`
- DELETE `/api/todos/:id`

### Uploads
- POST `/api/upload` (form-data: key=`image`)
- GET `/api/upload`
- DELETE `/api/upload/:id`

---

## 📦 Upload Rules

- Max size: 10MB
- Field name must be: `image`
- Stored in: `src/uploads`

---

## ✅ Things to change when running on another system

1. **Database credentials** in `src/config/db.js`
2. **API base URL** in `frontend/app.js`
3. **Ports** if different (`5000` or `5500`)

---

## ✅ Common Issues

### 1) CORS error
Enable CORS in backend:
```
app.use(cors({ origin: '*' }));
```

### 2) Image not showing
Ensure:
- `GET /api/upload` returns rows
- file exists in `src/uploads`

---

## ✅ Example Request (Postman)

**Upload Image**
```
POST http://localhost:5000/api/upload
Headers: Authorization: Bearer <token>
Body: form-data, key=image, type=File
```

---

## ✅ License
For development use only.