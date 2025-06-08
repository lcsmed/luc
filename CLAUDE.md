# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 personal blog application with a secure admin panel. The blog features markdown editing, authentication, and post management capabilities.

## Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build           # Build production (includes Prisma generate)
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:push         # Push schema changes to database
npm run db:migrate      # Run Prisma migrations
npm run postinstall     # Generate Prisma client (runs automatically)

# Admin Setup
npm run setup:admin     # Create initial admin user
npm run update:admin    # Update existing admin user
```

## Architecture

### App Router Structure
- **Admin Dashboard**: `/admin` - Protected admin interface for managing posts
- **Post Management**: `/admin/new`, `/admin/edit/[id]` - Create and edit posts
- **Authentication**: `/login` - Credential-based login
- **Public Blog**: `/`, `/post/[slug]` - Public-facing blog pages

### Authentication Flow
- Uses NextAuth.js v5 with credentials provider
- JWT strategy for sessions
- Middleware protects `/admin/*` routes
- Password hashing with bcryptjs
- Admin user creation via setup scripts

### Database Schema
- **User**: Admin users with email/password authentication
- **Post**: Blog posts with title, slug, content (markdown), publish status
- Uses PostgreSQL with Prisma ORM
- CUID for primary keys

### Key Components
- **Prisma Client**: `src/lib/prisma.ts` - Database connection
- **Auth Config**: `src/auth.ts` - NextAuth configuration
- **Middleware**: `src/middleware.ts` - Route protection
- **Post Utils**: `src/lib/posts.ts` - Post-related utilities

### Styling
- Tailwind CSS v4 with dark mode support
- Custom fonts: Geist Sans and Geist Mono
- Responsive design patterns

## Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - NextAuth secret key
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` (for setup scripts only)