# personal-vault

Secure personal document and credential storage with client-side zero-knowledge encryption, 4-digit master PIN verification, and sub-second performance.

---

## Features

- **Document & File Security**: Client-side encrypted storage for PDFs, Word files, images, credentials, and sensitive private keys.
- **Categorized Storage**: Dedicated category managers for **Documents**, **Photos**, **Passwords / Logins**, and **Secret Files**.
- **Master Security PIN**: 4-digit PIN with bcrypt hashing, failed attempt tracking, and automatic temporary brute-force lockout.
- **Sub-Second Performance**: In-memory caching, Neon PostgreSQL connection pool keepalive (45s), and client-side SWR caching for instant category switching.
- **Deployment Ready**: Fully decoupled backend and frontend with centralized `BASE_URL` routing and `.env` support.

---

## Project Structure

```text
personal-vault/
├── client/                      # Frontend Application (React + Vite + TailwindCSS)
│   ├── .env.example             # Template for VITE_API_URL
│   ├── src/
│   │   ├── components/          # AddItemModal, PinModal, Sidebar, etc.
│   │   ├── context/             # AuthContext (JWT & session management)
│   │   └── utils/
│   │       └── apiPath.js       # Centralized API endpoints with BASE_URL
│   └── package.json
│
├── server/                      # Backend API (Node.js + Express + Neon PostgreSQL)
│   ├── .env.example             # Template for DATABASE_URL & JWT_SECRET
│   ├── db/                      # Neon PostgreSQL connection pool & migrations
│   ├── routes/                  # auth.js, pin.js, vault.js, audit.js
│   ├── middleware/              # JWT authentication & rate limiting
│   └── server.js                # Express server entry point
│
├── tests/                       # Automated security and API verification suite
└── package.json                 # Root script runner for concurrent dev & tests
```

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Environment Variables
* **Server**: Copy `server/.env.example` to `server/.env` and configure your `DATABASE_URL` and `JWT_SECRET`.
* **Client**: Copy `client/.env.example` to `client/.env` (defaults to `http://localhost:5000`).

### 3. Run Client & Backend Simultaneously
```bash
npm run dev
```
* **Frontend**: `http://localhost:5173`
* **Backend API**: `http://localhost:5000`

### 4. Run Automated Security Test Suite
```bash
npm test
```

---

## Deployment Guide

### Step 1: Deploy Backend (e.g. Render, Railway, Fly.io, or VPS)
1. Point your deployment host to the `server/` directory.
2. Build command: `npm install`
3. Start command: `npm start`
4. Set Environment Variables:
   - `DATABASE_URL`: Your PostgreSQL connection string (Neon, Supabase, or AWS RDS).
   - `JWT_SECRET`: A secure random string for JWT session signing.
   - `PORT`: `5000` (or assigned by platform).
5. Copy your deployed backend URL (e.g. `https://your-backend.onrender.com`).

### Step 2: Deploy Frontend (e.g. Vercel, Netlify, Cloudflare Pages)
1. Point your deployment host to the `client/` directory.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set Environment Variable:
   - `VITE_API_URL`: Your deployed backend URL from Step 1 (e.g. `https://your-backend.onrender.com`).

---

## License
MIT
