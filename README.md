# Task Magic

A minimal, shared task board built with Next.js and MongoDB. No login required—just open and start collaborating.

## Key Concepts

- **Focus / Later / Done** — Tasks live in one of three buckets. Focus is your "now" list.
- **Actors** — Each device picks an emoji + name. This identity is stored locally.
- **Shared vs Private** — Tasks can be visible to everyone or only to you.
- **Ordering** — Move tasks up/down within each section.

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- MongoDB
- React 19

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create `.env.local` with your MongoDB connection:
   ```bash
   cp .env.example .env.local
   # Edit .env.local and set MONGODB_URI
   ```

3. Start the dev server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/          # Routing, layouts, API routes
├── components/   # UI components
└── lib/          # Non-UI logic (hooks, server, shared)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full mental model.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `MONGODB_DB` | No | Database name (default: `whiteboard`) |

## Deployment

Deploy to [Vercel](https://vercel.com) and set environment variables in the dashboard.
