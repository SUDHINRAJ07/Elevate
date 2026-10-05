# Production-Ready Calendar & Event Management System

A modern, responsive, and full-featured Calendar & Event Management module built with React, Vite, Tailwind CSS, Lucide Icons, Node.js/Express, and SQLite.

## Features

- **Interactive Monthly Calendar**:
  - Monday-to-Sunday layout with full month grid.
  - Previous/Next month navigation and quick "Today" jump.
  - Distinct highlights for today's date and the user-selected date.
  - Visual event indicators: colored dot icons and event count badges (`● 3 Events`).
  - Clicking an empty date pre-fills that date in the Create Event modal.
  - Clicking a date with events filters the event list and highlights the day.

- **Event Creation & Editing**:
  - **Event Information**: Event Name (required), Date (required), Start Time & End Time (required with validation: end time > start time), Description (multiline).
  - **Contact Details**: Phone Number (with international format support), Email (with regex format check), Address (multiline).
  - **Additional Details**: Event Type selector (Meeting, Appointment, Call, Interview, Demo, Task, Personal, Other), Location, Meeting Link (with URL validation), Notes.
  - **Time Overlap Checking**: Real-time conflict warning when scheduling at overlapping times, with a configurable toggle to allow or flag concurrent events.
  - **Inline Validation**: Instant error feedback under each input field.

- **Event Details & Deletion**:
  - Full details modal with clickable `mailto:`, `tel:`, and meeting link launcher.
  - Edit event modal with prefilled data and instant UI update.
  - Accessible delete confirmation modal (*"Are you sure you want to delete '...'? This action cannot be undone."*).
  - Auto-updates calendar event indicators and count badges immediately.

- **Event List, Search, and Filtering**:
  - Chronological sorting (date and start time ascending).
  - Tabbed views: `Upcoming`, `Today`, and `Past`.
  - Dynamic multi-field search (title, description, email, phone, address, location, notes).
  - Filters: Date ranges (Today, Tomorrow, This Week, This Month), Event Types, and Statuses.
  - Skeleton loading states and empty state illustrations.

- **Backend & Database**:
  - RESTful API endpoints at `/api/events` with CRUD and query parameters (`?date=`, `?month=`, `?search=`, `?eventType=`, `?status=`).
  - SQLite database persistence with WAL mode.
  - Indexed columns on `date`, `start_time`, `event_type`, and `status`.
  - Server-side validation matching client rules.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode (Concurrent Server & Client)
```bash
npm run dev
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

### 3. Run Production Server
```bash
npm run build
npm run server
```
The server serves both the REST API and the bundled frontend at `http://localhost:5000`.

### 4. Run Automated Test Suite
```bash
npm test
```
Runs 15 end-to-end integration tests verifying health checks, validation rules, multi-event handling, overlap detection, search, and CRUD workflows.

## World News

News is connected by default to the free Global Voices English RSS feed (two pages), with no API key or subscription. It shows up to 20 stories published within the past 7 days, newest first. It is a source-specific recent-stories list, not a worldwide popularity ranking. Fewer than 20 stories can appear when the source publishes fewer eligible items.

Headlines and excerpts open the original publisher article. Web uses a new tab; Android uses the Capacitor Browser in-app browser. Full articles are not copied into the database. The feed contains international reporting and commentary, not just breaking news.

Global Voices text is reused under CC BY 3.0, with author, publisher, original link, licence and excerpt/formatting-change notice shown. Third-party photographs are excluded; cards use a globe icon. Policy: https://globalvoices.org/about/global-voices-attribution-policy/ . Adding another publisher requires reviewing its commercial RSS/metadata terms; an RSS feed's availability does not automatically grant permission.

Daily link batches persist in SQLite (`news_link_batch`). Every 24 hours the running backend fetches and atomically replaces the batch. One-minute scheduler checks catch up after restarts. Failed/empty fetches retain the previous batch, label it as delayed, and retry after 15 minutes; entries older than the seven-day window are hidden. Refresh reloads the shared batch. The old full-article table is not read by the new feature.

Run `node --test server/tests/news.test.js` to verify selection, attribution mapping, expiry, replacement and failure behavior. Restart the backend after changes. Outbound HTTPS access to globalvoices.org is required in production. Native integration is synced by `npx cap sync android`; existing APK files must be rebuilt to include it.
