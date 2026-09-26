# Velozity Global Solutions — Real-Time Client Project Dashboard

A full-stack real-time client project dashboard built for the Velozity Global Solutions Technical Hiring Assessment.

The application provides role-based project and task management with JWT authentication, PostgreSQL persistence, Socket.IO real-time activity updates, notifications, online presence, and scheduled overdue-task processing.

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Socket.IO Client

### Backend

* Node.js
* Express
* TypeScript
* Socket.IO
* JWT Authentication
* bcrypt
* node-cron

### Database

* PostgreSQL
* Prisma ORM

---

## User Roles

### Admin

* View all projects and tasks
* Access global activity feed
* View online user count
* Create and manage tasks
* Receive real-time activity and notifications

### Project Manager

* View only their own projects
* View tasks belonging to their projects
* Create tasks for their projects
* Assign tasks to developers
* Receive notifications when assigned tasks move to In Review
* Receive project-scoped activity updates

### Developer

* View only tasks assigned to them
* Update the status of their assigned tasks
* Receive task assignment notifications
* Receive real-time updates for their assigned tasks
* Cannot access other developers' tasks through the API

All authorization checks are performed server-side.

---

## Main Features

### Authentication

* JWT access tokens
* Refresh tokens stored using HttpOnly cookies
* Password hashing using bcrypt
* Protected API routes
* Role-based authorization middleware
* Resource ownership checks

### Project & Task Management

* PostgreSQL relational data model
* Projects linked to Project Managers
* Tasks linked to projects and developers
* Task statuses:

  * To Do
  * In Progress
  * In Review
  * Done
* Task priorities:

  * Low
  * Medium
  * High
  * Critical
* Due dates
* Persistent activity logs

### Real-Time Activity Feed

Socket.IO is used for real-time communication.

Activities are persisted in PostgreSQL before being broadcast through WebSockets.

Role-based socket rooms are used to prevent unauthorized activity visibility:

```text
Admin            → admin:activity
Project Manager  → project:<projectId>
Developer        → task:<taskId>
User             → user:<userId>
```

When a user reconnects, the server retrieves the latest 20 permitted activity records from PostgreSQL.

This means missed events are recovered from persistent storage rather than an in-memory cache.

### Notifications

Notifications are stored in PostgreSQL and delivered through Socket.IO.

Examples:

* Developer receives a notification when assigned a task.
* Project Manager receives a notification when a developer moves a task to In Review.

Users can:

* View notifications
* See unread count
* Mark individual notifications as read
* Mark all notifications as read

### Online Presence

The server tracks active WebSocket connections and maintains an online-user count.

The online count is broadcast to administrators through Socket.IO.

Multiple connections from the same user are handled without counting the same user multiple times.

### Overdue Tasks

A scheduled `node-cron` background job checks for tasks whose due date has passed and whose status is not Done.

Overdue status is persisted in PostgreSQL using the `isOverdue` field.

The check runs independently of frontend page loading.

### Task Filtering

Tasks can be filtered through query parameters:

```text
GET /api/tasks?status=IN_PROGRESS
GET /api/tasks?priority=HIGH
GET /api/tasks?dueDate=2026-10-05
```

These filters are server-side and can be used in shareable URLs.

---

## Database Schema

The main relational entities are:

```text
User
 ├── Projects managed
 ├── Tasks assigned
 ├── Activity Logs
 ├── Notifications
 └── Refresh Tokens

Project
 ├── Project Manager
 └── Tasks

Task
 ├── Project
 ├── Developer
 └── Activity Logs

ActivityLog
 ├── User
 └── Task

Notification
 └── User

RefreshToken
 └── User
```

Foreign keys and indexes are used for relationships and frequently queried fields such as:

* managerId
* projectId
* developerId
* status
* priority
* dueDate
* userId
* createdAt

---

## Project Structure

```text
velozity-client-dashboard/
│
├── client/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── socket.ts
│   │   └── main.tsx
│   └── package.json
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── jobs/
│   │   ├── lib/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   └── package.json
│
└── README.md
```

---

## Local Setup

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd velozity-client-dashboard
```

### 2. Configure PostgreSQL

Create a PostgreSQL database named:

```text
velozity_dashboard
```

### 3. Configure backend environment variables

Create:

```text
server/.env
```

Example:

```env
PORT=5000

DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/velozity_dashboard?schema=public"

JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
```

Do not commit `.env` to the repository.

### 4. Install backend dependencies

```bash
cd server
npm install
```

### 5. Apply database migrations

```bash
npx prisma migrate dev
```

### 6. Generate Prisma Client

```bash
npx prisma generate
```

### 7. Seed demo data

```bash
npm run seed
```

### 8. Start backend

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

### 9. Install frontend dependencies

Open another terminal:

```bash
cd client
npm install
```

### 10. Start frontend

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## Demo Credentials

All seeded users use:

```text
Password@123
```

### Admin

```text
admin@velozity.com
```

### Project Managers

```text
ravi.pm@velozity.com
priya.pm@velozity.com
```

### Developers

```text
arun.dev@velozity.com
meena.dev@velozity.com
karthik.dev@velozity.com
divya.dev@velozity.com
```

---

## API Overview

### Authentication

```text
POST /api/auth/login
POST /api/auth/refresh
```

### Projects

```text
GET /api/projects
```

### Tasks

```text
GET /api/tasks
POST /api/tasks
PATCH /api/tasks/:id/status
```

### Activities

```text
GET /api/activities
```

### Notifications

```text
GET /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

### Health

```text
GET /api/health
```

---

## Architecture Decisions

### PostgreSQL + Prisma

PostgreSQL was selected because the application contains strongly related entities such as users, projects, tasks, activities, notifications, and refresh tokens.

Prisma provides typed database access and keeps database operations separate from HTTP controllers.

### Socket.IO

Socket.IO was selected for bidirectional real-time communication.

The server uses role- and resource-specific rooms to restrict which clients receive activity events.

### Persistent Activity History

Activity events are stored in PostgreSQL before being emitted through WebSockets.

This allows reconnecting users to retrieve their latest 20 permitted activities even if they were offline when the event occurred.

### Server-Side Authorization

Frontend visibility is not treated as a security boundary.

Every protected API request performs authentication, role checks, and resource ownership checks on the server.

For example, a Developer requesting another developer's task directly through the API receives a forbidden response.

### Background Processing

Overdue task detection is handled using `node-cron` rather than relying on frontend page loads.

---

## Seed Data

The seed database contains:

* 1 Admin
* 2 Project Managers
* 4 Developers
* 3 Projects
* 15+ Tasks
* Multiple task statuses
* Multiple priorities
* Overdue tasks
* Pre-existing activity logs

This allows the application to demonstrate different role views immediately after setup.

---

## Assessment Explanation

The hardest part of the implementation was designing the real-time activity feed while maintaining the same authorization boundaries used by the REST API. Instead of broadcasting every event to every connected client, the server places users into role- and resource-specific Socket.IO rooms. Admins receive the global activity stream, Project Managers receive activity for their own projects, and Developers receive activity only for their assigned tasks. Activity records are persisted in PostgreSQL before being emitted, allowing the server to retrieve the latest 20 permitted records when a user reconnects after being offline.

Another important design decision was keeping authorization on the server rather than relying on frontend visibility. Project ownership and developer task ownership are checked inside the API controllers, so modifying a request or URL cannot expose another user's data.

If I had additional development time, I would further separate the WebSocket event layer from the HTTP controllers and add more automated integration tests covering every role/resource combination.

---

## Limitations

* The current frontend focuses on demonstrating the required dashboard functionality rather than a highly polished production UI.
* Production deployment would require production-specific CORS configuration and environment variables.
* Automated test coverage can be expanded further.
* The current presence system tracks active Socket.IO connections in server memory and is intended for a single-server deployment. A distributed deployment would require a shared presence mechanism.

---

## Production Considerations

Before production deployment:

1. Replace development JWT secrets.
2. Configure production CORS origins.
3. Use secure HTTPS-only cookies.
4. Configure production PostgreSQL credentials.
5. Use environment variables for all secrets.
6. Add centralized logging and monitoring.
7. Use a shared Socket.IO adapter/presence store for multiple backend instances.

````

### Important

Don't put your **real `.env`** in GitHub.

Before pushing, make sure `.gitignore` contains:

```text id="n6n6jc"
.env
server/.env
client/.env
node_modules/
dist/
````

After saving README, **don't change the code anymore** unless we find a broken requirement.

Next we should do a **final 5-minute submission check**: Git status → remove secrets → GitHub → then deployment.
