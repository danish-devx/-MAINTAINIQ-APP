# MaintainIQ

### AI-Powered QR Maintenance & Asset History Platform

> Scan. Report. Diagnose. Maintain.

**🔗 Live Demo:** [https://danish-devx.github.io/-MAINTAINIQ-APP/](https://danish-devx.github.io/-MAINTAINIQ-APP/)

---

## 📌 About The Project

MaintainIQ is a professional maintenance-management platform built for schools, universities, offices, labs, and any organization that needs to track physical assets. Every asset gets a **digital identity** with a QR-accessible public page, letting anyone report a problem in seconds — while admins and technicians manage the full repair lifecycle behind the scenes.

Instead of scattered WhatsApp messages, phone calls, and registers, MaintainIQ centralizes everything: asset registration, issue reporting, technician assignment, maintenance records, and a permanent activity history for every single asset.

This project was built for the **SMIT Final Hackathon — Track B (Supabase/Firebase)**.

---

## ✨ Features

### 🔐 Authentication
- Simple, secure login via Supabase Auth (no public sign-up — accounts are pre-provisioned by the admin)
- Role-based access: **Admin** and **Technician**
- Demo accounts built into the login screen for quick evaluation

### 🖥️ Admin Dashboard
- Live overview cards — Total Assets, Operational, Open Issues, Critical Issues
- Interactive charts (Chart.js) — Assets by Status, Issues by Priority
- Recent Issues feed with a direct link to the full Issues page

### 📦 Asset Management
- Register, edit, and delete assets with a unique code, category, location, and condition
- Search and filter by name, code, location, category, or status
- Auto-generated **QR code** for every asset, with:
  - Downloadable / printable label
  - **Open Public Page** shortcut

### 🛠️ Issue Management
- Every reported issue tracked with priority, category, and status
- Assign issues to technicians directly from the admin panel
- Business rule enforced: an issue **cannot** be marked Resolved/Closed without a maintenance note
- Critical issues are visually flagged

### 🌍 Public Asset Page (No Login Required)
- Opens instantly when a QR code is scanned
- Shows only safe, public information (name, code, category, location, status, service dates)
- Full **activity history timeline** for the asset
- **Report an Issue** form — submits directly into the system and updates the asset's status automatically

### 👷 Technician Console
- Technicians see only the work orders assigned to them
- Update status through the proper workflow: Inspection Started → Maintenance In Progress → Resolved
- Attach maintenance notes, cost, and photo evidence (stored via Supabase Storage)
- Asset status automatically syncs with issue progress

### 👥 Team Page
- Roster of every admin and technician
- Live workload stats — open vs. resolved issues per technician

### 🎨 Design
- Custom purple/lavender glassmorphism theme with an animated 3D rotating cube
- Full dark/light theme toggle
- Fully responsive across desktop, tablet, and mobile

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend / Database | Supabase (PostgreSQL, Auth, Storage, Row Level Security) |
| Charts | Chart.js |
| QR Codes | qrcodejs |
| Alerts / Modals | SweetAlert2 |
| Fonts | Google Fonts — Plus Jakarta Sans, Orbitron |
| Hosting | GitHub Pages |

---

## 🗄️ How It Works

1. **Admin registers an asset** → a unique code and QR code are generated instantly.
2. **Anyone scans the QR code** → lands on a safe public page showing the asset's info and history — no login needed.
3. **They report an issue** → it's saved to the database, the asset's status flips to *Issue Reported*, and the event is logged to its permanent history.
4. **Admin reviews the Issues page** → assigns the issue to a technician.
5. **Technician opens their console** → sees the work order, starts the inspection, and updates status as work progresses.
6. **Technician resolves the issue** → adds a mandatory maintenance note, cost, and optional evidence photo. The asset automatically returns to *Operational*.
7. **Every meaningful action** (registration, issue reported, status changes) is written to the asset's history — nothing is silently lost.

---

## 🗂️ Project Structure

```
MaintainIQ/
│
├── style.css 
├── index.html              # Login page (with demo accounts)
├── app.js                   # Login logic (Supabase Auth)
│
├── admin.html                # Admin dashboard (stats + charts)
├── admin.css
├── admin-core.js
│
├── assets.html                # Asset management (CRUD + QR)
├── assets.css
├── assets.js
│
├── issues.html                # Issue management (assign/resolve)
├── issues.css
├── issues.js
│
├── team.html                # Team roster + workload
├── team.css
├── team.js
│
├── technician.html            # Technician work-order console
├── technician.css
├── technician.js
│
├── public-asset.html          # Public QR-landing page (no login)
├── public-asset.css
├── public-asset.js
│
├── theme.css                  # Shared design tokens (dark/light)
├── theme.js                   # Theme toggle logic
│
└── README.md
```

---

## 🗃️ Database Schema (Supabase / PostgreSQL)

**`profiles`** — id, name, role (`admin` / `technician`), email
**`assets`** — id, unique_code, name, category, location, status, condition, last_service, next_service
**`issues`** — id, asset_id, issue_number, title, description, priority, category, status, tech_notes, cost, evidence_url, reporter_name, assigned_to
**`asset_history`** — id, asset_id, action, actor_name, issue_id, created_at (immutable audit trail)

All tables are protected with **Row Level Security (RLS)** — public users can only read safe fields and submit issues; only authenticated admins/technicians can modify records.

---

## 🚀 Getting Started (Local Setup)

1. Clone this repository
2. Create a [Supabase](https://supabase.com) project
3. Run the schema + RLS policy SQL (see `/sql` if included, or the project documentation)
4. Replace `supabaseUrl` and `supabaseKey` in each `.js` file with your own project credentials
5. Open `index.html` in a browser, or serve the folder with any static file server

---

## 👨‍💻 Author

**M. Danish**
GitHub: [@danish-devx](https://github.com/danish-devx)

If you found this project useful or interesting, consider giving it a ⭐ on GitHub — it really helps!
