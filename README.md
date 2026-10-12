# FreelanceFlow Frontend

> Modern Single-Page Application (SPA) for the FreelanceFlow Escrow Marketplace, built with **React 18**, **Vite**, **Tailwind CSS**, **React Router 6**, and **STOMP WebSockets**.

---

## 🎨 Design & UI Architecture

- **Modern Aesthetic**: Dark-slate aesthetic inspired by modern fintech platforms with glassmorphic cards, emerald escrow status pills, and amber dispute indicators.
- **Micro-Animations**: Smooth transitions on card hover, loading spinners, state change toasts, and real-time activity indicators.
- **Responsive Layout**: Designed for desktop and mobile viewports with flexible grid layouts and accessible navigation.

---

## 🚀 Key Features

- **Authentication & RBAC**:
  - Secure JWT authentication with auto-refresh via Axios request/response interceptors.
  - Role-gated views for `CLIENT`, `FREELANCER`, and `ADMIN`.
- **Job Board & Proposals**:
  - Search and filter jobs by category, budget range, and experience level.
  - Job posting flow for Clients with milestone budget allocation.
  - Bid submission for Freelancers with cover letters and estimated delivery schedules.
- **Contract & Escrow Milestones**:
  - Visual Milestone State Machine tracker (`PENDING_FUNDING` → `FUNDED` → `IN_PROGRESS` → `SUBMITTED` → `RELEASED`).
  - One-click escrow funding and release.
  - Deliverable submission with file uploads and instant download links.
  - Revision request workflow.
- **Real-Time Collaboration**:
  - Live STOMP contract chat over WebSockets (`/topic/contract/{id}`).
  - Instant notification toast updates for milestone status changes.
- **Simulated Wallet & Transactions**:
  - Live ledger display showing escrow deposits, earnings, and dispute adjustments.
  - Test balance top-ups for immediate sandbox testing.
- **Dispute Resolution & Admin Portal**:
  - Dispute filing with justification notes for Clients and Freelancers.
  - Admin arbitration console to execute 100% Release, 100% Refund, or Custom % Splits.
- **Reviews & Ratings**:
  - 5-star rating and feedback dialogue triggered upon contract completion.

---

## 👥 Pre-Configured Demo Accounts

Use these pre-seeded accounts to explore the application:

| Role | Email | Password | Pre-loaded Balance |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@freelanceflow.dev` | `Admin@12345` | $10,000.00 |
| **Client** | `client@freelanceflow.dev` | `Client@12345` | $5,000.00 |
| **Freelancer**| `freelancer@freelanceflow.dev` | `Freelancer@12345` | $750.00 |

---

## 🛠️ Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, PostCSS, Lucide React icons
- **State & Routing**: React Context API (`AuthContext`, `SocketContext`), React Router v6
- **Network**: Axios (with JWT interceptors), `@stomp/stompjs`, `sockjs-client`

---

## 🏃 Getting Started

### Prerequisites
- **Node.js**: v18 or higher
- **npm** or **yarn**
- Running instance of the [FreelanceFlow Backend](https://github.com/nanjalamohith-cmyk/FreelanceFlow-Backend) on `http://localhost:8080`

### Installation & Run

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173).

### Production Build

```bash
npm run build
npm run preview
```

---

## 📦 Docker Deployment

Build and run standalone:

```bash
docker build -t freelanceflow-frontend .
docker run -p 5173:80 freelanceflow-frontend
```
