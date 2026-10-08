# FitCommit — Smart Gym Management & AI Fitness Tracking

> **Production-Ready Full-Stack Architecture (College Capstone Project)**  
> Developed strictly in accordance with the FitCommit SRS & UML Specifications (ICS-312).

---

## 1. Project Overview

**FitCommit** is a production-grade full-stack web application designed for modern fitness tracking and smart gym capacity management. The application solves facility congestion and gym adherence challenges through:

1. **Real-Time QR Gym Occupancy & Availability:** Physical entrance placard scanning replaces complex IoT sensors, dynamically computing active attendees and remaining facility capacity.
2. **Dynamic Periodized Workouts & Commitments:** Adaptive volume scaling based on user adherence and consistency scoring.
3. **Personalized Nutrition & Biometrics:** Continuous BMI tracking, calorie targets, macro splits, and multi-preference dietary meal plans.
4. **Modular AI/Heuristic Recommendation Service:** Deterministic rule-based and heuristic engine for workout splits, macronutrients, and instant machine alternatives when equipment is occupied.
5. **Role-Based Facility Access:** Distinct authorization tiers for Base Members, Premium Members, Fitness Trainers, and Administrators.

---

## 2. System Architecture

FitCommit is decoupled into two independent deployable tiers:

```
┌─────────────────────────────────────────────────────────────┐
│                    FitCommit Frontend                       │
│    React 19 • Vite 8.3 • React Router • Scandinavian UI     │
│       Hosted on Vercel / Netlify / Cloudflare Pages         │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST APIs
                               │ Authorization: Bearer <JWT>
┌──────────────────────────────▼──────────────────────────────┐
│                    FitCommit Backend API                    │
│    Node.js • Express 4.19 • Helmet • Rate-Limit • CORS      │
│           Hosted on Render / Railway / Fly.io               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Connection Pool (SSL)
                               │ DATABASE_URL
┌──────────────────────────────▼──────────────────────────────┐
│                  Managed PostgreSQL Database                │
│       Hosted on Supabase / Neon / Render PostgreSQL         │
│         (Seamless SQLite Fallback for Local Dev)            │
└─────────────────────────────────────────────────────────────┘
```

- **Frontend:** Single-Page Application (SPA) built with React 19 and Vite 8.3. Uses Scope Copenhagen Scandinavian aesthetics (minimalist light gray/off-white background `#F2F2F0`, clean borders, typography-driven hierarchy).
- **Backend:** Node.js Express REST API hardened with `helmet`, `express-rate-limit`, strict CORS origin matching, and centralized sanitized error handling.
- **Database:** PostgreSQL connection pool via `pg.Pool` accepting standard cloud `DATABASE_URL` strings with SSL encryption. Features automatic zero-setup embedded SQLite fallback for offline development.

---

## 3. Technologies

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8.3, Lucide React, `qrcode.react`, `html5-qrcode` |
| **Backend** | Node.js, Express.js 4.19, `helmet`, `express-rate-limit`, `cors`, `dotenv` |
| **Authentication**| JSON Web Tokens (`jsonwebtoken`), Salted Hashing (`bcryptjs`) |
| **Database** | PostgreSQL 16 (`pg`), `better-sqlite3` (WAL mode fallback) |
| **Deployment** | Vercel (Frontend), Render / Railway (Backend), Supabase / Neon (Database) |

---

## 4. Environment Variables

FitCommit requires **zero hardcoded URLs** and strictly separates configuration between frontend and backend.

### Frontend (`client/.env`)
```env
# Backend REST API base URL (must include /api)
# Local: http://localhost:5000/api
# Production: https://your-backend-api.onrender.com/api
VITE_API_URL=http://localhost:5000/api

# Frontend public domain (encoded into the physical gym entrance QR code)
# Local: http://localhost:5173
# Production: https://your-fitcommit-app.vercel.app
VITE_APP_URL=http://localhost:5173
```

### Backend (`server/.env`)
```env
# Server Port
PORT=5000

# Environment: 'development' or 'production'
NODE_ENV=development

# Allowed Frontend URL for Production CORS (no trailing slash)
FRONTEND_URL=http://localhost:5173

# Strong JWT Secret Key
JWT_SECRET=fitcommit_super_secure_jwt_secret_key_2026_production

# Managed PostgreSQL Database URL (e.g., Supabase / Neon / Render)
# Leave blank for automatic offline embedded SQLite database
DATABASE_URL=postgresql://postgres:password@your-project.supabase.co:5432/postgres

# Seed initial demo members and gym data (true / false)
RUN_SEED=false
```

> **Security Note:** Never commit `.env` or files containing secrets to version control. Both root `.gitignore` and `server/.gitignore` exclude `.env*` files (except `.env.example`).

---

## 5. Local Development Setup

### Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)
- (Optional) PostgreSQL installed locally or a free Supabase project

### Step 1: Clone Repository & Install Dependencies
```bash
git clone <your-repo-url>
cd fitcommit

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Configure Environment Files
```bash
# In client/
cp .env.example .env

# In server/
cp .env.example .env
```

### Step 3: Run the Application
Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
# Health check: http://localhost:5000/health
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Vite runs on http://localhost:5173
```

---

## 6. Database Setup

### Option A: Managed Cloud PostgreSQL (Supabase / Neon / Render) — Production Recommended
1. Create a free project at [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. Copy your connection URI (`postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres`).
3. Set `DATABASE_URL` in `server/.env`.
4. When `server.js` boots, it automatically runs `CREATE TABLE IF NOT EXISTS` schema migrations and applies the partial unique index:
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS uq_gym_active_session 
   ON gym_attendance(user_id, gym_id) 
   WHERE status IN ('ACTIVE', 'CHECKED_IN') AND check_out_time IS NULL;
   ```

### Option B: Zero-Config Embedded Database (Local Development)
- If `DATABASE_URL` is omitted, FitCommit instantly boots using `better-sqlite3` in WAL mode (`server/fitcommit.db`). No database installation is required.

---

## 7. Production Build & Deployment

### Step 1: Validate Build Locally
```bash
# Verify client builds cleanly
cd client
npm run build

# Verify backend tests pass
cd ../server
npm test
```

### Step 2: Deploy Backend (Render / Railway / Fly.io)
1. Link your Git repository on [Render](https://render.com).
2. Create a **Web Service**:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `NODE_ENV` = `production`
     - `PORT` = `10000` (Render default)
     - `DATABASE_URL` = `postgresql://postgres:xxx@your-supabase-db:5432/postgres`
     - `JWT_SECRET` = `[RandomStrongString]`
     - `FRONTEND_URL` = `https://your-frontend.vercel.app`
     - `RUN_SEED` = `false`
3. Note your backend URL: `https://fitcommit-api.onrender.com`.

### Step 3: Deploy Frontend (Vercel / Netlify)
1. Link your Git repository on [Vercel](https://vercel.com).
2. Configure Project Settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variables:**
     - `VITE_API_URL` = `https://fitcommit-api.onrender.com/api`
     - `VITE_APP_URL` = `https://your-frontend.vercel.app`
3. Deploy! The frontend is now live over HTTPS.

---

## 8. QR Gym Check-In Flow (Production Telemetry)

The physical gym entry system tracks live facility capacity without IoT hardware:

```
User arrives at gym
       │
       ▼
Scans physical QR Code Placard with phone camera
       │
       ▼
Phone opens: https://fitcommit.example.com/gym/check-in?gym=FITCOMMIT-GYM-001
       │
       ├─ If NOT logged in: Redirect to login while preserving gym parameter.
       │
       ▼
User sees live availability:
  • FitCommit Central Gym
  • 37 / 100 Members Inside
  • 63 Spots Available
       │
       ▼
User taps [CONFIRM GYM CHECK-IN]
       │
Backend validates:
  1. Authenticated user
  2. Valid gym code (FITCOMMIT-GYM-001)
  3. Active gym pass / Premium membership
  4. Capacity check (Rejects if currentMembers >= capacity)
  5. Duplicate check (Rejects if active session exists; DB unique constraint)
       │
       ▼
Active session created (Status = 'ACTIVE', check_in_time = NOW)
Occupancy increases: 37 → 38 (62 spots available)
       │
When leaving, user taps [CHECK OUT]:
Active session finalized (Status = 'COMPLETED', check_out_time = NOW)
Occupancy automatically decreases: 38 → 37 (63 spots available)
```

### Dynamic Calculation (Source of Truth)
Occupancy is **never stored as a hardcoded or manually incremented number**. It is calculated from active sessions:
```sql
SELECT COUNT(*) FROM gym_attendance 
WHERE gym_id = 1 AND status IN ('ACTIVE', 'CHECKED_IN') AND check_out_time IS NULL;
```
Remaining capacity: `availableSpots = capacity - currentMembers`.

---

## 9. Key REST API Endpoints

### Health & Liveness
- `GET /health`: Platform deployment health check (returns `{ status: "ok", database: "connected", dbType: "postgres" }`)
- `GET /api/health`: System version and runtime diagnostics

### Authentication
- `POST /api/auth/register`: Create user account (hashes password with bcrypt)
- `POST /api/auth/login`: Authenticate and receive JWT
- `POST /api/auth/demo-login`: Fast one-click login for presentation personas
- `GET /api/auth/me`: Current user context

### Gym Occupancy & QR Attendance
- `GET /api/gym/occupancy`: Public/Member live occupancy (`capacity`, `currentMembers`, `availableSpots`, `occupancyPercentage`)
- `POST /api/gym/check-in`: Authenticated check-in (validates gym, active pass, capacity, duplicates)
- `POST /api/gym/check-out`: End session, record duration, decrement occupancy
- `GET /api/gym/my-attendance`: Member session history and analytics

### AI Recommendation Service
- `POST /api/recommendations/workout`: Personalized workout recommendations with adaptive volume scaling
- `POST /api/recommendations/diet`: Meal plan tailored to caloric targets and dietary preferences
- `POST /api/recommendations/macros`: Biometric macronutrient target calculations
- `POST /api/recommendations/alternatives`: Immediate exercise alternatives when specific gym equipment is occupied

### Admin Management (`ADMIN` Role)
- `GET /api/admin/metrics`: Platform analytics
- `GET /api/admin/users`: User role moderation (`BASE_MEMBER` ↔ `PREMIUM_MEMBER`)
- `GET /api/admin/gym/occupancy`: Real-time facility occupancy dashboard
- `GET /api/admin/gym/attendance`: Audit log of latest 50 check-ins/outs

---

## 10. Demo Personas for Evaluation

| Persona | Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- | :--- |
| **Sumith Raj** | `PREMIUM_MEMBER` | `sumith.raj@fitcommit.ac.in` | `sumith123` | Full access: Gym QR check-in, Trainer messaging, Machine sensor simulation |
| **Hemanth Kumar** | `BASE_MEMBER` | `hemanth.kumar@fitcommit.ac.in` | `hemanth123` | Digital workouts, BMI, Diet plans (Gym entry prompts upgrade) |
| **Alex Mercer** | `TRAINER` | `alex.mercer@fitcommit.ac.in` | `trainer123` | Trainer dashboard, trainee allocation |
| **Sarah Jenkins** | `ADMIN` | `sarah.admin@fitcommit.ac.in` | `admin123` | Admin dashboard, QR Plaque generator, Attendance audit |

---

## 11. Troubleshooting & FAQ

1. **Why does camera QR scanning require HTTPS?**  
   Modern mobile browsers (Chrome, Safari, iOS WebKit) disable `navigator.mediaDevices.getUserMedia` on insecure HTTP connections. In local Wi-Fi testing, use the manual button or check-in URL. In production, HTTPS is enforced automatically by Vercel/Render.

2. **CORS Error on Deployed App:**  
   Ensure `FRONTEND_URL` in `server/.env` exactly matches your frontend domain (e.g., `https://fitcommit.vercel.app`) without a trailing slash.

3. **Database Connection Refused (PostgreSQL):**  
   Check your `DATABASE_URL`. Cloud providers like Supabase require SSL connection pooling (`sslmode=require`). FitCommit automatically configures `{ rejectUnauthorized: false }` for cloud connection strings.

4. **Duplicate Check-in Rejection:**  
   If a user scans twice without checking out, the backend rejects the attempt with `400 Bad Request` ("You are already inside the gym"). The member must tap **Check Out** before scanning in again.

---

## 12. Verification Checklist

- [x] Decoupled, independent frontend and backend directories
- [x] Zero hardcoded localhost URLs in production configurations
- [x] Environment variable documentation (`.env.example`)
- [x] Secrets excluded from git (`.gitignore`)
- [x] PostgreSQL connection pooling with `DATABASE_URL` & SSL
- [x] Production security headers (`helmet`) & rate limiting (`express-rate-limit`)
- [x] Strict CORS restriction based on `FRONTEND_URL`
- [x] Root `/health` liveness probe endpoint
- [x] Real QR generation (`qrcode.react`) encoding `${VITE_APP_URL}/gym/check-in?gym=FITCOMMIT-GYM-001`
- [x] Printable entrance placard with PNG download
- [x] Occupancy derived directly from active database sessions
- [x] Database-level partial unique index preventing duplicate concurrent check-ins
- [x] Automatic capacity limit enforcement
- [x] 100% test pass rate across occupancy and recommendation test suites
- [x] Clean, error-free production build (`npm run build`)
