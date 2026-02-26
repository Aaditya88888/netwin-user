# NetWin Tournament App

A modern gaming tournament platform built with React, Firebase, and TypeScript.

## Project Structure

The project is organized as a monorepo with the following structure:

- `src/`: Main React frontend application
- `server/`: Express.js backend server
- `shared/`: Common types and interfaces used across frontend and backend
- `public/`: Static assets and service worker

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Express.js, Firebase Admin SDK
- **Database**: Cloud Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Deployment**: Vercel (Frontend), Cloud Functions (Backend)

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
- Create `.env` file in the root directory
- Add your Firebase configuration

3. Start development servers:
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:client  # Frontend only
npm run dev:server  # Backend only
```

## Available Scripts

- `npm run dev` - Start both frontend and backend development servers
- `npm run build` - Build both frontend and backend for production
- `npm run dev:client` - Start frontend development server
- `npm run dev:server` - Start backend development server
- `npm run build:client` - Build frontend for production
- `npm run build:server` - Build backend for production

## Deployment

1. Build both applications:
```bash
# Build frontend
cd netwin-frontend
npm run build

# Build backend
cd ../netwin-backend
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy
```

## Support Ticket Integration

The app includes a support ticket system for users to submit and manage support requests. The `ticketService.ts` module provides an API for external admin applications to manage these tickets.

### Admin App Integration

The `ticketService.ts` exports a `TicketAPI` object that external applications can use to:

- Fetch and filter tickets
- Update ticket status
- Add admin responses
- Create new tickets
- Delete tickets
- Export tickets in JSON or CSV format
- Get ticket analytics

Example usage in admin app:

```typescript
import { TicketAPI, ExportFormat } from 'path-to-ticket-service';

// Fetch all tickets
const tickets = await TicketAPI.fetchTickets();

// Add a response to a ticket
await TicketAPI.addResponse(
  ticketId,
  "This is an admin response",
  "Admin Name"
);

// Export tickets as CSV
const csvData = await TicketAPI.exportTickets(ExportFormat.CSV);
```

### Data Model

Support tickets include:
- Ticket ID
- User information
- Subject and description
- Category and priority
- Status (open, in_progress, resolved, closed)
- Responses (from both users and admins)
- Timestamps

The Firestore security rules are configured to allow users to create tickets and view their own tickets, while admins can access and manage all tickets.