# ⬡ TaskFlow — Team Task Manager

A full-stack web app for managing projects and tasks with **role-based access control** (Admin/Member).

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com))

### 1. Clone & Install

```bash
git clone <your-repo>
cd team-task-manager
npm run install:all
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

**server/.env:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/team-task-manager
JWT_SECRET=your_super_secret_key_here_make_it_long
NODE_ENV=development
```

### 3. Run Dev Server

```bash
# From project root
npm run dev
```

- Frontend (local dev): http://localhost:5173
- Production: https://task-manager-production-0ae1.up.railway.app
- Backend API: https://task-manager-production-0ae1.up.railway.app/api

## 📁 Project Structure

```
team-task-manager/
├── client/                  # Vite + React frontend
│   └── src/
│       ├── components/      # Layout, TaskCard
│       ├── context/         # AuthContext (JWT)
│       └── pages/           # Login, Register, Dashboard, Projects, ProjectDetail
└── server/                  # Express + MongoDB backend
    ├── config/              # DB connection
    ├── middleware/          # JWT auth, role guard
    ├── models/              # User, Project, Task (Mongoose)
    └── routes/              # auth, projects, tasks, users
```

## 🔑 Role-Based Access

| Action                   | Admin | Member        |
|--------------------------|-------|---------------|
| Create projects          | ✅    | ❌            |
| Add/remove members       | ✅    | ❌            |
| Create tasks             | ✅    | ❌ (own proj) |
| Update task status       | ✅    | ✅ (own tasks)|
| Delete tasks/projects    | ✅    | ❌            |
| View all projects        | ✅    | ✅ (assigned) |

## 🌐 API Endpoints

| Method | Route                     | Description           | Auth |
|--------|---------------------------|-----------------------|------|
| POST   | /api/auth/register        | Register user         | —    |
| POST   | /api/auth/login           | Login                 | —    |
| GET    | /api/auth/me              | Current user          | JWT  |
| GET    | /api/projects             | List projects         | JWT  |
| POST   | /api/projects             | Create project        | Admin|
| GET    | /api/projects/:id         | Get project           | JWT  |
| PUT    | /api/projects/:id         | Update project        | Owner|
| DELETE | /api/projects/:id         | Delete project        | Admin|
| GET    | /api/projects/:id/tasks   | Project tasks         | JWT  |
| POST   | /api/tasks                | Create task           | Admin|
| GET    | /api/tasks/dashboard      | User dashboard tasks  | JWT  |
| PUT    | /api/tasks/:id            | Update task           | JWT  |
| DELETE | /api/tasks/:id            | Delete task           | Admin|

## 🚢 Deploy on Railway

1. Push to GitHub
2. Create new Railway project → "Deploy from GitHub repo"
3. Add **two services**: one for `server/`, one for `client/`
4. Add MongoDB plugin or use MongoDB Atlas
5. Set environment variables in Railway dashboard
6. Set `VITE_API_URL=https://task-manager-production-0ae1.up.railway.app/api` in client (see `client/.env`)

## 📹 Tech Stack

- **Frontend**: Vite + React 18, React Router v6, Axios
- **Backend**: Node.js, Express 4, JWT auth
- **Database**: MongoDB + Mongoose ODM
- **Styling**: Pure CSS with CSS variables (dark theme)
