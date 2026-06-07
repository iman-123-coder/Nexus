# 🚀 Business Nexus Platform

A full-stack web platform connecting **entrepreneurs** and **investors** — featuring real-time chat, video calls, meeting scheduling, document management, and a built-in wallet system.

**Live Demo:** [nexus-five-lemon.vercel.app](https://nexus-five-lemon.vercel.app)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## Overview

Business Nexus is a two-sided SaaS platform where:

- **Entrepreneurs** showcase their startups, find investors, schedule meetings, share documents, and manage funding.
- **Investors** discover startups, connect with founders, conduct video calls, and track portfolio activity.

Both roles share a real-time messaging system, wallet, and meeting scheduler — all backed by a REST API with JWT authentication and Socket.IO for live features.

---

## ✨ Features

### Auth
- Register / Login with role selection (Entrepreneur or Investor)
- OTP email verification via [Resend](https://resend.com)
- JWT-based authentication with protected routes
- Forgot password / reset password flow

### Dashboard
- Role-specific dashboards with live stats
- Wallet balance display
- Recent transactions summary
- Upcoming meetings widget
- Recommended investors / startups

### Chat (Real-time)
- Socket.IO powered messaging
- Online/offline presence indicators
- Typing indicators
- Conversation history persisted in MongoDB

### Video Calls
- WebRTC peer-to-peer video calls
- Room ID based joining (shareable link)
- Camera / microphone toggle
- Picture-in-picture local preview
- Call duration timer

### Meetings
- Schedule meetings with any platform user
- Accept / Reject incoming meeting requests
- Conflict detection
- Email notifications on status change

### Documents
- Upload files (PDF, DOCX, images up to 10MB)
- Share documents with other users
- E-signature via canvas drawing
- Download, delete, version tracking

### Payments (Stripe Sandbox)
- Wallet deposit
- Withdraw funds
- Transfer between users
- Full transaction history with status badges

### Security
- bcrypt password hashing
- Rate limiting (global + strict auth limits)
- NoSQL injection prevention (express-mongo-sanitize)
- XSS protection (xss-clean)
- Helmet security headers
- CORS whitelisting

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| Video | WebRTC |
| Auth | JWT, bcryptjs |
| Email | Resend |
| Payments | Stripe (sandbox) |
| File Storage | Cloudinary |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |

---

## 📁 Project Structure

```
Nexus Project/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── documentController.js
│   │   ├── meetingController.js
│   │   ├── paymentController.js
│   │   └── profileController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT protect + role authorize
│   │   └── upload.js            # Multer / Cloudinary
│   ├── models/
│   │   ├── Document.js
│   │   ├── Meeting.js
│   │   ├── Message.js
│   │   ├── Transaction.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── documents.js
│   │   ├── meetings.js
│   │   ├── messages.js
│   │   ├── payments.js
│   │   └── profile.js
│   ├── utils/
│   │   └── email.js             # Resend email utility
│   ├── uploads/                 # Local dev uploads
│   ├── .env
│   ├── server.js
│   └── socket.js                # Socket.IO event handlers
│
└── src/                         # Frontend (Vite + React + TS)
    ├── api/
    │   └── axios.ts             # Axios instance + interceptors
    ├── components/
    │   ├── chat/
    │   ├── collaboration/
    │   ├── entrepreneur/
    │   ├── investor/
    │   ├── layout/              # DashboardLayout, Navbar, Sidebar
    │   └── ui/                  # Button, Card, Badge, Avatar, Input
    ├── context/
    │   └── AuthContext.tsx
    ├── pages/
    │   ├── auth/                # Login, Register, OTP, ForgotPassword
    │   ├── chat/
    │   ├── dashboard/           # EntrepreneurDashboard, InvestorDashboard
    │   ├── documents/
    │   ├── entrepreneurs/
    │   ├── investors/
    │   ├── meetings/
    │   ├── payments/
    │   ├── profile/
    │   ├── settings/
    │   └── video/
    ├── types/
    │   └── index.ts
    ├── utils/
    │   └── validation.ts
    └── App.tsx
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Stripe account (test mode)
- Resend account (for OTP emails)
- Cloudinary account (for file storage)

### 1. Clone the repo

```bash
git clone https://github.com/iman-123-coder/Nexus.git
cd Nexus
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env` (see [Environment Variables](#environment-variables) below).

```bash
node server.js
```

Backend runs at `http://localhost:5000`

### 3. Frontend setup

```bash
# From project root
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 🔑 Environment Variables

### Backend — `backend/.env`

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/nexus
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173

# Email
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Payments
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend — `.env` (project root)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

> For production, set `VITE_API_URL` and `VITE_SOCKET_URL` to your Railway backend URL in Vercel's environment variables.

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/users` | Get all other users |

### Meetings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/meetings/create` | Schedule a meeting |
| GET | `/api/meetings` | Get user's meetings |
| GET | `/api/meetings/:id` | Get single meeting |
| PUT | `/api/meetings/:id/status` | Accept / Reject |
| DELETE | `/api/meetings/:id` | Cancel meeting |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload a document |
| GET | `/api/documents` | Get user's documents |
| PUT | `/api/documents/:id/share` | Share with user |
| PUT | `/api/documents/:id/sign` | E-sign document |
| DELETE | `/api/documents/:id` | Delete document |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages` | Get all conversations |
| GET | `/api/messages/:userId` | Get messages with user |
| POST | `/api/messages` | Send a message |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/deposit` | Create deposit intent |
| POST | `/api/payments/deposit/confirm` | Confirm deposit |
| POST | `/api/payments/withdraw` | Withdraw funds |
| POST | `/api/payments/transfer` | Transfer to user |
| GET | `/api/payments/history` | Transaction history |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/profile/update` | Update profile |
| POST | `/api/profile/avatar` | Upload avatar |

---

## 🌐 Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Set environment variables:
   - `VITE_API_URL` → your Railway backend URL + `/api`
   - `VITE_SOCKET_URL` → your Railway backend URL
4. Deploy — Vercel auto-deploys on every push to `main`

### Backend → Railway

1. Create new project in [Railway](https://railway.app)
2. Connect GitHub repo, set root directory to `backend`
3. Set all environment variables from `backend/.env`
4. Railway auto-deploys on push

### MongoDB → Atlas

1. Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Whitelist `0.0.0.0/0` for Railway access
3. Copy connection string to `MONGO_URI`

---

## 🔌 Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `user-online` | Client → Server | Register presence |
| `online-users` | Server → Client | Broadcast online list |
| `send-message` | Client → Server | Send DM |
| `receive-message` | Server → Client | Receive DM |
| `typing` | Client → Server | Typing indicator |
| `stop-typing` | Client → Server | Stop typing |
| `join-room` | Client → Server | Join video room |
| `offer` / `answer` / `ice-candidate` | Both | WebRTC signaling |

---

## 👤 Test Accounts

After deploying, register two accounts:

| Role | Suggested Email | Password |
|------|----------------|----------|
| Entrepreneur | entrepreneur@test.com | test123456 |
| Investor | investor@test.com | test123456 |

Use these to test the full flow: chat → schedule meeting → accept meeting → video call → transfer payment.

---

## 📄 License

All rights reserved © 2026 Iman Abbasi. Unauthorized use, reproduction, or distribution of this project or any of its contents is strictly prohibited.

---

Built as part of a Full Stack Development Internship — Nexus Platform (June 2026)  
**Made by [Iman Abbasi](https://github.com/iman-123-coder)**
