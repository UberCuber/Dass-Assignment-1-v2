# 🎪 Felicity — Event Management System

A comprehensive **MERN stack** event management system for IIIT Hyderabad's annual tech fest. Manage events, registrations, QR-based attendance, merchandise sales, and real-time discussions — all from one platform.

---

## 📚 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Design Justifications](#design-justifications)
- [Screenshots](#screenshots)

---

## 🏗️ Architecture

```
┌──────────────┐     REST API      ┌──────────────┐     ┌──────────────┐
│   React      │   ◄──────────►    │   Express.js │────►│   MongoDB    │
│   Frontend   │   WebSocket       │   Backend    │     │   Atlas      │
│   (Vite)     │   (Socket.IO)     │   + Socket.IO│     └──────────────┘
└──────────────┘                   └──────────────┘
```

- **Frontend**: React 19 + Vite, hosted on Vercel
- **Backend**: Express.js + Socket.IO, hosted on Render
- **Database**: MongoDB Atlas (cloud-hosted)
- **Auth**: JWT tokens with bcrypt password hashing

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19, Vite | SPA with role-based routing |
| State | React Context API | Auth state management |
| HTTP | Axios | API communication with interceptors |
| Realtime | Socket.IO Client | Discussion forum live messaging |
| Backend | Express.js 5 | REST API server |
| Auth | JWT + bcryptjs | Token-based authentication |
| Database | MongoDB + Mongoose 9 | Document storage with schemas |
| File Upload | Multer | Payment proofs, images |
| QR Codes | qrcode | Ticket QR generation |
| Email | Nodemailer | Ticket & credentials delivery |
| CSV | csv-writer | Registration data export |
| Realtime | Socket.IO | Discussion forum server |

---

## ✨ Features

### 🎯 Core Features (70 marks)

#### User Roles
- **Participant (IIIT/Non-IIIT)**: Browse events, register, manage profile, view tickets
- **Organizer (Club)**: Create events, manage registrations, track analytics
- **Admin**: Manage organizers, review password resets, system dashboard

#### Authentication & Authorization
- JWT-based auth with role-based access control (RBAC)
- IIIT email domain validation (auto-detection of `@iiit.ac.in`, `@students.iiit.ac.in`, `@research.iiit.ac.in`)
- Non-editable fields post-registration (email, participant type)
- Organizer accounts provisioned by admin with auto-generated credentials

#### Event Management
- **Two event types**: Normal (with custom registration forms) and Merchandise (with variants/stock)
- **Event lifecycle**: Draft → Published → Ongoing → Completed → Closed
- **Dynamic form builder**: Text, textarea, dropdown, radio, checkbox, number, email, date, file fields with drag-and-drop reordering
- **Merchandise**: Item variants (size, color, etc.), stock tracking, per-person purchase limits
- **Registration controls**: Deadlines, participant limits, eligibility restrictions, fee configuration

#### Participant Experience
- **Dashboard**: Upcoming, normal, merchandise, completed, and cancelled tabs
- **Browse Events**: Full-text search, type/eligibility/date/followed-clubs filters, trending section
- **Event Details**: Full info, registration form, ticket/QR display, calendar export
- **Clubs**: Follow/unfollow organizers, club detail pages with event listings
- **Profile**: Edit personal info, manage interests, change password

#### Organizer Dashboard
- **Events carousel** with stats (registrations, revenue, status)
- **Event detail view**: Participant list, analytics, CSV export, status management
- **Payment approval workflow**: View/approve/reject payment proofs for merchandise

#### Admin Panel
- **System dashboard**: Users, organizers, events, registrations count
- **Organizer management**: Create clubs (auto-email credentials), remove, reactivate
- **Password reset request review**: Approve (auto-generate new password) or reject

### 🚀 Advanced Features (30 marks)

| Tier | Feature | Implementation |
|------|---------|---------------|
| **A** | Merchandise Payment Approval | Organizers review uploaded payment proofs, approve/reject with stock updates |
| **A** | QR Scanner & Attendance | Manual ticket ID entry, real-time attendance stats, scanned/not-yet counters |
| **B** | Organizer Password Reset | Organizer submits request with reason → Admin reviews → New password generated |
| **B** | Real-Time Discussion Forum | Socket.IO powered chat per event, message pinning, reactions, organizer moderation |
| **C** | Add to Calendar | `.ics` file download + Google Calendar link for registered events |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

### 1. Clone & Install

```bash
git clone <repository-url>
cd Dass-Assignment-1-v2

# Backend
cd backend
npm install
cp .env.example .env  # Edit with your MongoDB URI and secrets

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/felicity   # or MongoDB Atlas URI
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

ADMIN_EMAIL=admin@felicity.com
ADMIN_PASSWORD=Admin@123

SMTP_HOST=smtp.gmail.com       # For email features (optional)
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

CLIENT_URL=http://localhost:5173
```

### 3. Seed Admin User

```bash
cd backend
npm run seed
```

This creates the first admin account with the credentials from `.env`.

### 4. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev          # Runs on http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm run dev          # Runs on http://localhost:5173
```

### 5. Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@felicity.com | Admin@123 |

Participants register themselves. Organizers are created by the Admin.

---

## 📡 API Documentation

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register participant |
| POST | `/login` | Login (all roles) |
| GET | `/me` | Get current user profile |
| PUT | `/profile` | Update profile |
| POST | `/onboarding` | Save interests & follows |
| PUT | `/change-password` | Change password |

### Events (`/api/events`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List events (with search, filters) |
| POST | `/` | Create event (organizer) |
| GET | `/:id` | Get event details |
| PUT | `/:id` | Update event |
| POST | `/:id/register` | Register for event |
| GET | `/:id/registrations` | Get registrations (organizer) |
| PUT | `/:id/registrations/:regId/payment` | Approve/reject payment |
| POST | `/:id/attendance` | Mark attendance (organizer) |
| GET | `/:id/attendance` | Get attendance stats |
| GET | `/:id/analytics` | Get event analytics |
| GET | `/:id/export` | Export registrations CSV |
| GET | `/my-registrations` | Get user's registrations |

### Admin (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Dashboard statistics |
| POST | `/organizers` | Create organizer account |
| GET | `/organizers` | List all organizers |
| DELETE | `/organizers/:id` | Remove organizer |
| PUT | `/organizers/:id/reactivate` | Reactivate organizer |

### Users (`/api/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/organizers` | List public organizers |
| GET | `/organizers/:id` | Get organizer details |
| POST | `/organizers/:id/follow` | Toggle follow |

### Password Reset (`/api/password-reset`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/request` | Submit reset request |
| GET | `/my-requests` | Get organizer's requests |
| GET | `/requests` | List all requests (admin) |
| PUT | `/requests/:id` | Approve/reject request |

### Feedback (`/api/feedback`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/:eventId` | Submit feedback |
| GET | `/:eventId` | Get feedback & stats |

### Messages (`/api/messages`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:eventId` | Get event messages |

### WebSocket Events (Socket.IO)
| Event | Direction | Description |
|-------|-----------|-------------|
| `join-event` | Client→Server | Join event room |
| `send-message` | Client→Server | Send message |
| `pin-message` | Client→Server | Pin/unpin (organizer) |
| `delete-message` | Client→Server | Delete message (organizer) |
| `react-message` | Client→Server | React to message |
| `new-message` | Server→Client | New message broadcast |
| `message-updated` | Server→Client | Message updated |
| `message-deleted` | Server→Client | Message deleted |

---

## 🧠 Design Justifications

### Why Single User Model with Role Field?
A single `User` model with a `role` discriminator and role-specific fields simplifies auth logic, avoids joins across separate role tables, and allows a unified JWT flow. Role-specific fields are only populated when relevant, keeping documents lean.

### Why JWT Over Sessions?
JWT enables stateless auth — no server-side session storage needed. Tokens are stored in `localStorage` and attached via Axios interceptors. This simplifies horizontal scaling and works naturally with React SPAs.

### Why Socket.IO for Discussion Forum?
Socket.IO provides bidirectional real-time communication with automatic reconnection, room-based broadcasting (per event), and fallback to polling for older browsers. This is ideal for a discussion forum where messages need to appear instantly for all connected users.

### Why Custom Form Builder?
Events have diverse registration needs — hackathons need team names, workshops need skill levels, merchandise needs size preferences. A dynamic form builder (stored as a JSON schema in MongoDB) lets organizers define any form structure without code changes.

### Why Merchandise as an Event Type?
Rather than a separate merchandise system, treating merchandise as an event type reuses the registration and payment infrastructure. The `merchandiseItems` array with variants and stock tracking is a natural extension of the event schema.

### Why Admin-Provisioned Organizer Accounts?
Organizer accounts are created by admins with auto-generated credentials (emailed to contact address). This prevents unauthorized club creation and ensures only verified organizations can host events.

### Why QR Code Generation on Backend?
QR codes are generated server-side using the `qrcode` library and stored as base64 data URLs. This ensures consistent QR generation independent of client capabilities and allows QR codes to be embedded in emails.

### Why Editable vs Non-Editable Field Separation?
Certain fields (email, participant type, organizer base email) are made non-editable post-creation to maintain data integrity. An IIIT student can't change their type to non-IIIT to bypass eligibility checks.

---

## 📁 Project Structure

```
├── backend/
│   ├── config/         # Database connection
│   ├── controllers/    # Route handlers (auth, events, admin, feedback)
│   ├── middleware/      # JWT auth, file upload
│   ├── models/          # Mongoose schemas (User, Event, Registration, etc.)
│   ├── routes/          # API route definitions
│   ├── seeds/           # Admin seeder
│   ├── utils/           # JWT, QR, email utilities
│   ├── server.js        # Entry point with Socket.IO
│   └── .env             # Environment config
├── frontend/
│   ├── src/
│   │   ├── components/  # Navbar, ProtectedRoute, DiscussionForum
│   │   ├── context/     # AuthContext (JWT state management)
│   │   ├── pages/       # auth/, participant/, organizer/, admin/
│   │   ├── services/    # API client (Axios with interceptors)
│   │   ├── App.jsx      # Router with role-based routes
│   │   └── main.jsx     # Entry point
│   └── index.html
├── README.md
└── deployment.txt
```

---

## 🎨 UI/UX Design

- **Dark theme** with gradient backgrounds and glassmorphism cards
- **Responsive** layout adapting to mobile, tablet, and desktop
- **Role-specific navigation** showing only relevant links per user type
- **Toast notifications** for all user actions (success, error)
- **Loading spinners** and empty states for better UX
- **Tab-based navigation** for dashboard sections
- **Step-by-step wizards** for event creation and onboarding
