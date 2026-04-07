# FinTrack - Expense Tracker

A modern, SaaS-quality expense tracking web application built with React, NestJS, and MongoDB. Designed for personal and professional use with PWA support for mobile home screen installation.

## Features

- **Dashboard** — Financial overview with interactive charts (Recharts), AI spending predictions, and recent transactions
- **Expense & Income Tracking** — Full CRUD with categories, payment methods, vendors, receipt attachments, and tags
- **Receipt Scanner** — OCR-powered bill scanning using Tesseract.js to auto-fill expense forms
- **Budget Planning** — Category-wise budget limits with progress bars and 80%/100% alerts
- **Recurring Expenses** — Automated transaction creation via cron jobs (daily/weekly/monthly/yearly)
- **Bill Reminders** — Email and in-app notifications for upcoming bills
- **Loan & EMI Tracking** — Loan management with amortization schedules and EMI payment tracking
- **Investment Portfolio** — Manual tracking for stocks, mutual funds, crypto, and fixed deposits
- **AI Auto-Categorization** — Rule-based vendor-to-category mapping that learns from user behavior
- **Custom Automation Rules** — If-then rules for auto-categorizing, notifications, and type setting
- **Reports & Export** — PDF, Excel, and CSV export with customizable date ranges
- **Notifications** — In-app, email, and WhatsApp (optional) notifications
- **Dark Mode** — Full light/dark theme support
- **PWA** — Installable on mobile home screen with offline capability

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, TailwindCSS 4, Radix UI |
| State | Zustand (global), TanStack Query (server) |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts |
| Backend | NestJS, TypeScript, Mongoose |
| Database | MongoDB |
| Auth | Google OAuth 2.0, JWT + Refresh Tokens |
| OCR | Tesseract.js |
| Exports | pdfkit, exceljs, json2csv |
| Notifications | Nodemailer |
| Scheduling | @nestjs/schedule (cron jobs) |

## Project Structure

```
├── backend/                  # NestJS API server
│   ├── src/
│   │   ├── common/           # Guards, decorators, interfaces
│   │   ├── modules/
│   │   │   ├── auth/         # Google OAuth, JWT strategies
│   │   │   ├── users/        # User profile management
│   │   │   ├── expenses/     # Transaction CRUD + analytics
│   │   │   ├── categories/   # Category management
│   │   │   ├── budgets/      # Budget tracking
│   │   │   ├── recurring/    # Recurring expense automation
│   │   │   ├── reminders/    # Bill reminder system
│   │   │   ├── loans/        # Loan & EMI tracking
│   │   │   ├── investments/  # Investment portfolio
│   │   │   ├── notifications/# In-app notification system
│   │   │   ├── automation/   # Custom automation rules
│   │   │   └── exports/      # PDF/Excel/CSV generation
│   │   └── schemas/          # MongoDB/Mongoose schemas
│   └── uploads/              # Receipt image storage
│
├── frontend/                 # React SPA
│   ├── public/               # PWA manifest, service worker, icons
│   └── src/
│       ├── components/
│       │   ├── ui/           # Reusable UI components (shadcn-style)
│       │   └── layout/       # Sidebar, Header, AppLayout
│       ├── pages/            # Route pages
│       ├── services/         # API client (axios)
│       ├── store/            # Zustand store
│       ├── types/            # TypeScript interfaces
│       └── utils/            # Helpers, formatters
```

## Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Google OAuth credentials

## Setup

### 1. Clone and install

```bash
# Backend
cd backend
cp .env.example .env
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

### 2. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services > Credentials**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Set authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
6. Copy Client ID and Secret to `backend/.env`

### 3. Configure environment

**backend/.env**
```env
MONGODB_URI=mongodb://localhost:27017/expense-tracker
JWT_SECRET=your-super-secret-jwt-key-change-this
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
PORT=3000
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:3000/api
```

### 4. Run development servers

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | OAuth callback |
| POST | `/api/auth/refresh` | Refresh JWT token |
| GET | `/api/auth/me` | Get current user |
| GET/POST | `/api/expenses` | List/Create transactions |
| GET | `/api/expenses/stats/monthly` | Monthly statistics |
| GET | `/api/expenses/stats/categories` | Category breakdown |
| GET | `/api/expenses/stats/trends` | Monthly trends |
| GET | `/api/expenses/stats/prediction` | AI spending prediction |
| POST | `/api/expenses/upload-receipt` | Upload receipt image |
| POST | `/api/expenses/train-vendor` | Train vendor mapping |
| GET/POST | `/api/categories` | Category CRUD |
| GET/POST | `/api/budgets` | Budget CRUD |
| GET/POST | `/api/recurring` | Recurring expense CRUD |
| GET/POST | `/api/reminders` | Reminder CRUD |
| GET/POST | `/api/loans` | Loan CRUD |
| GET | `/api/loans/:id/schedule` | EMI amortization schedule |
| GET/POST | `/api/investments` | Investment CRUD |
| GET | `/api/investments/summary` | Portfolio summary |
| GET | `/api/notifications` | List notifications |
| GET | `/api/exports/csv` | Export as CSV |
| GET | `/api/exports/excel` | Export as Excel |
| GET | `/api/exports/pdf` | Export as PDF |
| GET/POST | `/api/automation/rules` | Automation rule CRUD |

## Deployment

### Frontend (Vercel / Netlify)

```bash
cd frontend
npm run build
# Deploy the `dist` folder
```

**Vercel**: Connect your repo and set root directory to `frontend`.

**Netlify**: Set build command to `npm run build` and publish directory to `dist`.

### Backend (Render / Railway)

Set environment variables in the hosting dashboard:
- `MONGODB_URI` — Your MongoDB Atlas connection string
- `JWT_SECRET` — Strong random string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth credentials
- `GOOGLE_CALLBACK_URL` — `https://your-api.onrender.com/api/auth/google/callback`
- `FRONTEND_URL` — Your frontend URL

### Database (MongoDB Atlas)

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Whitelist your IP (or 0.0.0.0/0 for hosting)
4. Copy the connection string to `MONGODB_URI`

## PWA Installation

1. Open the app on your mobile browser (Chrome recommended)
2. Tap the browser menu
3. Select "Add to Home Screen"
4. The app will install as a standalone app with an icon

## License

MIT
