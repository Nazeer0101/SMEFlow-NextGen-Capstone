# SMEFlow — NextGen Full-Stack Capstone

SMEFlow is a full-stack web application for helping small and medium-sized enterprises organise customers, tasks and useful business resources in one digital workspace.

## Stack
- React + Vite
- JavaScript
- React Router
- Node.js + Express
- PostgreSQL
- JWT authentication
- bcrypt password hashing
- Vitest + React Testing Library
- Git/GitHub
- Vercel (frontend) + Render (backend)

## Project structure
```text
smeflow/
├── client/     # React frontend
└── server/     # Express API
```

## Local development

### 1. Backend
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Set these variables in `.env`:
- `PORT=5000`
- `DATABASE_URL=...`
- `JWT_SECRET=use-a-long-random-secret`
- `CLIENT_URL=http://localhost:5173`

The backend creates the required tables automatically on startup.

### 2. Frontend
In another terminal:
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Set:
```text
VITE_API_URL=http://localhost:5000/api
```

## Production deployment

### Backend — Render
Create a PostgreSQL database and a Web Service from the `server` directory/repository. Build command:
```bash
npm install
```
Start command:
```bash
npm start
```
Set `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, and `PORT`.

### Frontend — Vercel
Deploy the `client` directory and set:
```text
VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api
```

## Security
- Passwords are hashed with bcrypt.
- JWT is used for authenticated API access.
- Input validation is performed on the server.
- CORS is restricted through `CLIENT_URL`.
- Helmet security headers are enabled.
- Rate limiting is applied to API requests.
- Secrets belong in environment variables, never source control.

## Testing
```bash
cd client
npm install
npm test
```

## Capstone evidence
Keep screenshots of:
1. Landing page
2. Registration/login
3. Dashboard
4. Customer CRUD
5. Task CRUD/status update
6. Resource CRUD
7. Responsive mobile view
8. GitHub repository
9. Deployed application
10. Test results
