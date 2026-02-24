# Felicity — Event Management System

A comprehensive **MERN stack** event management system for IIIT Hyderabad's annual tech fest. Manage events, registrations, QR-based attendance, merchandise sales, and real-time discussions — all from one platform.

---

## Table of Contents

- [Architecture](#architecture)
- [Libraries & Frameworks](#libraries--frameworks)
- [Core Features](#core-features)
- [Advanced Features (Tier A, B, C)](#advanced-features)
- [Getting Started (Local Setup)](#getting-started)
- [API Documentation](#api-documentation)
- [Screenshots](#screenshots)

---

## Architecture

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

## Libraries & Frameworks

### Frontend Dependencies & Justification
No external UI component libraries (like Material-UI or Tailwind CSS) were used. The entire UI was built using **Vanilla CSS** to demonstrate strong foundational styling skills and ensure complete control over the application's unique glassmorphism and modern aesthetic without bloat.

| Library | Version | Justification & Problem Solved |
|---------|---------|--------------------------------|
| **React** | `^19.2.0` | The core UI library. Chosen for its component-based architecture which makes building complex SPAs (Single Page Applications) modular and maintainable. |
| **Vite** | `^7.3.1` | Build tool and dev server. Replaced CRA for significantly faster HMR (Hot Module Replacement) and optimized production builds. |
| **React Router DOM** | `^7.13.0` | Handles client-side routing. Essential for creating a seamless SPA experience with role-based protected routes (Participant, Organizer, Admin). |
| **Axios** | `^1.13.5` | HTTP client. Chosen over `fetch` for its built-in request/response interceptors (used for attaching JWTs and handling 401s), automatic JSON transformation, and cleaner syntax. |
| **Socket.IO Client** | `^4.8.3` | Enables real-time WebSocket communication. Solves the problem of delivering live discussion forum messages instantly without manual refreshing or expensive HTTP polling. |
| **html5-qrcode** | `^2.3.8` | Provides in-browser QR scanning via device cameras. Chosen for its robust decoding capabilities and support for a wide range of devices, solving the need for attendance tracking without native mobile apps. |
| **react-toastify** | `^11.0.5` | Notification system. Provides non-blocking, globally accessible toast alerts to give users immediate feedback (success/error) after API calls. |
| **react-icons** | `^5.5.0` | Icon library. Solves the problem of sourcing SVGs by importing standard icons (Feather/Fi) as React components. |

### Backend Dependencies & Justification

| Library | Version | Justification & Problem Solved |
|---------|---------|--------------------------------|
| **Express.js** | `^5.2.1` | Fast, unopinionated web framework for Node.js. Chosen to define RESTful API endpoints, apply middleware (CORS, JSON parsing), and handle routing. |
| **Mongoose** | `^9.2.1` | MongoDB object modeling tool. Solves the problem of unstructured data by providing schema validation, relationship mapping (refs), and query building prior to interacting with MongoDB. |
| **Socket.IO** | `^4.8.3` | Real-time bidirectional event-based communication. Necessary for the backend implementation of the live discussion forums, handling room-based broadcasting. |
| **jsonwebtoken (JWT)** | `^9.0.3` | Token generation and verification. Chosen for stateless authentication. It eliminates the need for server-side sessions, making the backend more scalable. |
| **bcryptjs** | `^3.0.3` | Password hashing function. Solves the security requirement of storing passwords securely; chosen over `bcrypt` to avoid C++ compilation issues across different OS environments. |
| **multer** | `^2.0.2` | Middleware for handling `multipart/form-data`. Essential for parsing file uploads (like image payment proofs) sent from the frontend. |
| **qrcode** | `^1.5.4` | Server-side QR code generation. Generates Base64 data URIs of ticket data, ensuring QR codes are consistently formatted for email attachments and frontend display. |
| **nodemailer** | `^8.0.1` | Email sending utility. Solves the problem of dispatching automated transactional emails (ticket confirmations, reset passwords). Supports SMTP and HTTP API fallbacks. |
| **csv-writer** | `^1.6.0` | CSV generation. Translates JSON registration data into downloadable CSV files for organizers needing offline data analysis. |
| **cors** | `^2.8.6` | Cross-Origin Resource Sharing middleware. Solves the security policy blockages when the frontend domain (Vercel) attempts to access the backend API (Render). |

---

## Advanced Features

### Tier A: Merchandise Payment Approval Workflow (8 Marks)
**Feature Selected:** The system handles end-to-end merchandise sales, requiring participants to upload an image proof of payment before securing their order. Organizers manually review these proofs before stock is decremented and QR tickets are generated.

**Design Choices & Technical Decisions:**
- **State Machine Implementation:** Instead of a simple `boolean` paid flag, payments follow a strict state machine (`pending` -> `approved`/`rejected`). Registrations matching these get a `pending_payment` status.
- **Base64 Image Handling:** Uploaded payment proofs are converted to Base64 strings on the frontend (`FileReader`) and stored directly in MongoDB. *Justification:* This prevents the need for complex external cloud storage (like AWS S3) for a proof-of-concept assignment, ensuring image persistence works seamlessly across local and cloud environments without broken URL links.
- **Stock Integrity (Race Conditions):** Merchandise stock is *not* decremented when the order is placed, but only when the organizer *approves* the payment. This technical decision prevents malicious users from spam-ordering and locking up inventory with fake proof submissions.
- **Conditional Resource Allocation:** QR codes and emails are technically deferred until the `approve` action in the `eventController`. If rejected, the user never receives a valid ticket.

### Tier A: QR Scanner & Attendance Tracking (8 Marks)
**Feature Selected:** Organizers have a dedicated in-app camera scanner to scan participant QR codes at the gate, validating tickets and tracking live attendance metrics.

**Design Choices & Technical Decisions:**
- **In-Browser Scanning:** Used `html5-qrcode` directly in the React frontend. *Justification:* Avoids requiring organizers to download a separate mobile app. It accesses the device camera via WebRTC and parses the code on the client.
- **JSON QR Payloads:** The QR codes generated on the backend don't just contain a string, they contain a JSON object (`{"ticketId":"...", "eventId":"..."}`). The frontend parses this JSON after scanning. *Justification:* This prevents fake static QR codes from working easily and allows the scanner to quickly reject QR codes meant for different events without hitting the backend to verify first.
- **Debouncing:** Implemented a continuous scanning loop but added logic to pause parsing for a few seconds after a successful scan. *Justification:* Prevents the backend from being hammered with 10 duplicate attendance requests if the organizer holds the camera over the QR code for slightly too long.

### Tier B: Real-Time Discussion Forum (6 Marks)
**Feature Selected:** Every event has a live chat section where participants can post, react, and organizers can moderate (pin/delete).

**Design Choices & Technical Decisions:**
- **WebSocket over REST:** Used Socket.IO instead of traditional REST API polling. *Justification:* Polling every 2 seconds for new messages creates massive unnecessary backend load. WebSockets maintain a persistent TCP connection to push events only when they happen.
- **Room-Based Architecture:** Connected clients emit a `join-event` socket payload. The backend groups sockets into isolation rooms (`socket.join(eventId)`). *Justification:* Ensures that when someone chats in Event A, the broadcast is only sent to the 50 people looking at Event A, not the 5,000 people on the platform.
- **Database Fallback:** Every socket message is concurrently `await Message.create(...)` in MongoDB. *Justification:* Socket.IO doesn't persist data. Writing to MongoDB ensures users joining the room *later* can HTTP GET the historical backlog, while current users get the live socket push.

### Tier B: Organizer Password Reset Workflow (6 Marks)
**Feature Selected:** Organizers cannot change their forgotten passwords directly; they submit a request to the Admin, who reviews and emails them a system-generated password.

**Design Choices & Technical Decisions:**
- **Security-First Approach:** Because organizers handle funds and participant data, automated resets via email links were deemed too risky for internal club accounts. Adding an Admin-approval layer adds human verification.
- **Decoupled Request Schema:** Created a separate `PasswordReset` mongoose schema rather than bolting status flags onto the `User` model. *Justification:* This allows tracking the historical audit log of reset requests (who approved it, when, and the reason) separately.

### Tier C: Anonymous Feedback System (2 Marks)
**Feature Selected:** Participants can submit 1-5 star ratings and text feedback after an event completes.

**Design Choices & Technical Decisions:**
- **Anonymity Enforcement:** The `Feedback` schema intentionally omits `participantId`. *Justification:* Completely severs the link between the user and their review to guarantee anonymity.
- **Frontend Gating:** The frontend only displays the "Leave Feedback" button if: 1) the event status is `completed`, and 2) the user's registration `attended` boolean is `true`. *Justification:* Protects the rating system from being skewed by people who registered but never actually showed up.

---

## Core Features

#### User Roles
- **Participant (IIIT/Non-IIIT)**: Browse events, register, manage profile, view tickets.
- **Organizer (Club)**: Create events, manage registrations, track analytics.
- **Admin**: Manage organizers, review password resets, system dashboard.

#### Authentication & Authorization
- JWT-based auth with role-based access control (RBAC).
- IIIT email domain validation (auto-detection of `@iiit.ac.in`, etc.).
- Organizer accounts provisioned by admin with auto-generated credentials.

#### Event Management
- **Dynamic form builder**: Drag-and-drop creation of text, dropdown, radio, and file fields.
- **Merchandise**: Item variants, stock tracking, per-person purchase limits.
- **Registration controls**: Deadlines, participant limits, eligibility restrictions.

---

## Getting Started

### Prerequisites
- **Node.js** 18+
- **MongoDB** (local installation or an Atlas URI)
- **npm** or **yarn**

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd Dass-Assignment-1-v2

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory and populate it:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/felicity
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

# Initial Admin Credentials (used during seeding)
ADMIN_EMAIL=admin@felicity.com
ADMIN_PASSWORD=Admin@123

# Email configuration (Brevo API key used in deployment, Nodemailer fallback local)
BREVO_API_KEY=your_brevo_key
BREVO_SENDER_EMAIL=noreply@example.com

# Used for email templates
CLIENT_URL=http://localhost:5173
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Seed the Admin User

You must run the seeder to create the initial admin account so you can log in, create organizers, and bootstrap the platform.

```bash
cd backend
npm run seed
```

### 4. Run Development Servers

**Terminal 1 (Backend Server):**
```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Client running on http://localhost:5173
```

### 5. Starting Credentials
Navigate to `http://localhost:5173` and login with the seeded admin account to begin creating Organizer (Club) accounts.

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@felicity.com | Admin@123 |
| Participant | *Self-Register via UI* | *Chosen during signup* |
| Organizer | *Created by Admin via UI* | *Emailed dynamically* |

---

## API Documentation
(Note: Standard CRUD routes omitted for brevity. See source files for payload structures).

- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- **Events**: `/api/events`, `POST /api/events/:id/register`, `PUT /api/events/:id/registrations/:regId/payment`
- **Admin**: `/api/admin/stats`, `/api/admin/organizers`
- **Realtime**: `join-event`, `send-message`, `new-message` (via `ws://`)
