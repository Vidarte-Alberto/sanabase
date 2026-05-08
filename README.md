# Sanabase

Web application for managing patients and staff accounts in a medical practice.

Sanabase is built with `Next.js`, `TypeScript`, `Prisma ORM`, and `SQLite`. It includes JWT-based authentication, first-run onboarding for the initial administrator, patient management, and role-based user administration.

## Overview

Sanabase is designed for small to medium medical offices that need a simple internal system to:

- register patients
- review and update patient records
- control staff access
- keep a lightweight local database with `SQLite`

The user-facing interface is in Spanish, while the technical codebase structure and identifiers are in English.

## Features

- first-run onboarding to create the initial administrator
- JWT authentication stored in an `httpOnly` cookie
- role-based access control:
  - `admin`: can manage patients and users
  - `user`: can work with patients but cannot manage sensitive user administration
- patient management:
  - create
  - list
  - search
  - update
  - delete
- admin-only user management
- password hashing with `scrypt` + random `salt`
- strong password validation
- login rate limiting
- persistence with `SQLite` and `Prisma`
- ESLint with Airbnb-style rules adapted to the current stack

## Tech Stack

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Prisma ORM`
- `SQLite`
- `jose` for JWT
- `Tailwind CSS`
- `Radix UI`
- `shadcn/ui`

## Architecture

The project uses a page-oriented component structure, with a clear separation between shared code and server-only logic.

```text
app/
  api/
  login/
  onboarding/
  page.tsx

components/
  layout/
  pages/
    dashboard/
    login/
    onboarding/
  ui/

shared/
  lib/
  server/
    dashboard/

prisma/
data/
```

### Main Conventions

- `components/pages/<page>` contains page-specific UI
- `shared/lib` contains shared utilities and cross-cutting logic
- `shared/server` contains server-side data access and business logic
- `components/ui` contains reusable base UI components
- all technical identifiers should remain in English
- user-facing text may remain in Spanish

## Access Flow

### First Run

If no users exist:

1. the application redirects to `/onboarding`
2. the first administrator is created
3. the user is stored in the database
4. a session is created automatically

### Subsequent Runs

If users already exist:

1. the application redirects to `/login`
2. credentials are validated
3. a JWT-backed session is created
4. the main dashboard is protected behind authentication

## Security

Sanabase already includes several baseline security controls:

- passwords hashed with `scrypt`
- random `salt` per password
- safe hash comparison
- JWT stored in an `httpOnly` cookie
- `8-hour` session duration
- login rate limiting
- temporary lock after `5` failed attempts
- `15-minute` block window
- password strength validation requiring:
  - at least `12` characters
  - one uppercase letter
  - one lowercase letter
  - one number
  - one special character
  - no spaces

## Database

The application uses `SQLite` through `Prisma`.

Default database location:

```env
DATABASE_URL="file:./data/patients.sqlite"
```

Current models:

- `Patient`
- `User`
- `LoginRateLimit`

This project does not ship with seed data. On a clean setup:

- the database file is created
- the tables are created
- no initial records are inserted

## Environment Variables

Copy `.env.example` to `.env` and adjust the values:

```env
DATABASE_URL="file:./data/patients.sqlite"
JWT_SECRET="replace-with-a-random-secret-of-at-least-32-characters"
```

### Recommendations

- use a long, random `JWT_SECRET`
- do not commit `.env` to the repository
- if you move the database file, update `DATABASE_URL`

## Installation

### Requirements

- `Node.js` 18 or newer
- `npm`

### Setup

```bash
npm install
npx prisma db push
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
```

Starts the development server.

```bash
npm run build
```

Builds the application for production.

```bash
npm run start
```

Starts the production server.

```bash
npm run lint
```

Runs ESLint.

```bash
npm run lint:fix
```

Applies automatic ESLint fixes where supported.

```bash
npm run prisma:generate
```

Generates the Prisma client.

```bash
npm run prisma:push
```

Synchronizes the Prisma schema with the SQLite database.

## Resetting the Database

If you need a full reset:

```bash
npx prisma db push --force-reset
```

This will:

- remove the previous schema
- delete the existing data
- recreate the tables from `prisma/schema.prisma`

## User Management

An `admin` user can:

- create users
- update users
- delete users
- manage patients

A `user` role can:

- sign in
- view patients
- create patients
- update patients

## Main Routes

- `/onboarding`: initial system setup
- `/login`: sign-in page
- `/`: main dashboard
- `/api/auth/login`: authentication
- `/api/auth/logout`: logout
- `/api/auth/onboarding`: first administrator creation
- `/api/patients`: patient CRUD
- `/api/users`: user administration

## Code Quality

The project currently follows these engineering practices:

- `TypeScript` as the core language
- separation between UI, shared logic, and server-only logic
- page-oriented component organization
- `ESLint` with Airbnb-style rules adapted to Next.js
- English technical naming
- Spanish user interface text

## Current Status

Sanabase already includes:

- persistent authentication
- first-run onboarding
- patient management
- user administration
- local persistence with SQLite
- validation and baseline security controls

## Suggested Next Steps

- formal Prisma migrations
- user action audit logs
- password reset or password change flow
- database-backed invalidatable sessions
- automated tests
- production deployment with persistent server storage

## License

This project is private unless the repository owner adds an explicit license.
