# CricValley - Premier Cricket Tournament Management System

A production-ready Cricket Tournament Management System built with React, Vite, TypeScript, Tailwind CSS, Express.js, Prisma ORM, and Socket.IO.

---

## 🌟 Key Features

### 🏆 Public Web Portal
- **Ongoing Matches & Live Score Cards**: Displays ongoing match scores, upcoming fixtures, and finished match results.
- **Tournament Hub**: Browse leagues, participating teams, points tables with Net Run Rate (NRR) calculation, and knockout brackets.
- **Player & Team Profiles**: View career statistics and squad rosters.
- **Global Search**: Search bar to find tournaments, teams, players, and fixtures instantly.

### ⚡ Admin Management Hub
- **Spreadsheet Data Grid Bulk Add Imports**: Interactive Excel-style Data Grid UI for bulk adding Teams, Players, and Matches with dynamic row insertion/deletion.
- **Direct Score & Winner Updater**: Set match scores directly, update match status (Ongoing / Finished), and declare winning teams.
- **Tournament, Team, Player & Match CRUD**: Full single & bulk management.
- **Swagger / OpenAPI Specs**: Interactive API documentation at `http://localhost:5000/api-docs`.

---

## 🚀 Quick Start (Local Setup)

```bash
# Install backend dependencies & initialize database
cd backend
npm install
npx prisma db push
npx prisma db seed

# Install frontend dependencies
cd ../frontend
npm install
```

### Run Servers
- Backend API: `http://localhost:5000` (API Docs: `http://localhost:5000/api-docs`)
- Frontend Web App: `http://localhost:5173`

---

## 🔐 Default Admin Credentials

- **Email**: `admin@cricket.com`
- **Password**: `admin123`
