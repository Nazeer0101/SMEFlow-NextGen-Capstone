# SMEFlow — Digital Operations Management Platform

**3MTT Airtel-NextGen Capstone Project**  
**Track:** Software Engineering & Development / Full-Stack Development

SMEFlow is a full-stack web application designed to help small and medium-sized enterprises organise selected operational information in one digital workspace.

## Project goal

Small businesses may keep customer information, tasks and useful resources in notebooks, spreadsheets and different messaging applications. SMEFlow provides a single web interface for managing these records.

## Main features

- User registration and login
- Protected application access
- Dashboard statistics
- Customer management
- Task management
- Task status tracking
- Resource management
- Add, edit and delete operations
- Search and filtering
- Responsive interface
- REST API
- PostgreSQL persistence
- Input validation
- Password hashing
- Security headers
- Rate limiting
- Environment-variable configuration
- Automated frontend smoke test
- Production deployment configuration

## Technology

- React
- Vite
- JavaScript
- Node.js
- Express
- PostgreSQL
- Git/GitHub
- Render

## Repository structure

This project intentionally keeps the application source files at the repository root so the project can be uploaded easily through the GitHub web interface.

```text
SMEFlow-NextGen-Capstone/
├── .env.example
├── .gitignore
├── README.md
├── app.jsx
├── app.test.jsx
├── db.js
├── index.html
├── package.json
├── render.yaml
├── server.js
├── styles.css
├── test-setup.js
├── vite.config.js
└── vitest.config.js
```

## Important note about database code

The main server currently contains the database initialisation and API logic so that the source remains easy to upload as a flat project. A separate database service is still required for persistent production data.

## Local setup

### 1. Install Node.js

Install a current LTS release of Node.js from the official website:

https://nodejs.org/

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment variables

Copy `.env.example` to `.env` and provide a PostgreSQL connection string and a strong JWT secret.

Example:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=use-a-long-random-secret
PORT=3000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Never commit `.env` to GitHub.

### 4. Run the development environment

```bash
npm run dev
```

The Vite development server normally runs at:

```text
http://localhost:5173
```

The Express API normally runs at:

```text
http://localhost:3000
```

### 5. Health check

Open:

```text
http://localhost:3000/api/health
```

A working server should return JSON showing the application status.

## Production build

```bash
npm run build
npm start
```

In production, Express serves the built React application and the API from the same service.

## Database

SMEFlow uses PostgreSQL.

The server creates the required tables automatically when `DATABASE_URL` is available.

Core tables:

- users
- customers
- tasks
- resources

The application uses parameterised SQL queries rather than building SQL statements from raw user input.

## Security approach

The project includes:

- bcrypt password hashing
- JWT-based authentication
- protected API routes
- user-specific database queries
- server-side validation
- Helmet security headers
- rate limiting
- controlled CORS configuration
- environment variables for secrets
- no committed production credentials

This is a learning/capstone project. A production business system would require further security review, monitoring, backup and operational controls.

## Testing

Run:

```bash
npm test
```

The test suite currently includes a basic frontend smoke test. Additional API and integration tests will be added as development progresses.

## Deployment

The included `render.yaml` provides a starting point for deploying the full application to Render.

Required production environment variables:

```text
DATABASE_URL
JWT_SECRET
CLIENT_URL
NODE_ENV=production
```

After deployment, test:

```text
/api/health
```

and the main application URL before submitting the project.

## Development workflow

The project should be developed in small, traceable stages:

1. Create the repository
2. Run the application
3. Configure PostgreSQL
4. Test registration and login
5. Test customer management
6. Test task management
7. Test resource management
8. Test search/filtering
9. Test mobile/responsive layout
10. Run automated tests
11. Deploy
12. Test the public deployment
13. Record the demonstration
14. Complete the capstone submission

## Official resources

- React: https://react.dev/
- MDN Web Docs: https://developer.mozilla.org/
- Node.js: https://nodejs.org/docs/latest/api/
- Express: https://expressjs.com/
- PostgreSQL: https://www.postgresql.org/docs/
- GitHub: https://docs.github.com/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
- Render: https://render.com/docs

## Project status

**Status: Development in progress**

Features will only be described as complete after they have been implemented and tested.

## Author

**Naziru Sanusi Inuwa**

3MTT Airtel-NextGen Fellow  
Software Engineering & Development / Full-Stack Development

**Project:** SMEFlow — Digital Operations Management Platform
