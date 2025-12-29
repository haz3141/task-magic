# Whiteboard Todos

A minimal shared to-do list built with Next.js, TypeScript, and MongoDB Atlas.

## Setup

1. Copy `.env.example` to `.env.local` and fill in your MongoDB Atlas URI:
   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies and run:
   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `MONGODB_DB` | No | Database name (default: `whiteboard`) |

## Deployment

Deploy to [Vercel](https://vercel.com) and set environment variables in the dashboard.
