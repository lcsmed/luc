# luc sam - Personal Blog

A minimalist personal blog built with Next.js, featuring a secure admin panel for posting from anywhere in the world.

## Features

- 🚀 Fast, server-rendered blog with Next.js 15
- 🔐 Secure authentication system
- ✍️ Markdown editor for easy post creation
- 📱 Responsive design that works on all devices
- 🌙 Dark mode support
- 📝 Draft/publish functionality
- 🔍 SEO optimized

## Deployment to Vercel

### 1. Push to GitHub

First, create a new repository on GitHub and push your code.

### 2. Set up Vercel Postgres

1. Go to your Vercel dashboard
2. Navigate to the Storage tab
3. Create a new Postgres database
4. Copy the connection string

### 3. Deploy to Vercel

1. Import your GitHub repository to Vercel
2. Add the following environment variables:
   - `DATABASE_URL` - Your Vercel Postgres connection string
   - `NEXTAUTH_URL` - Your production URL (e.g., https://luc-sam.vercel.app)
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`

### 4. Initialize Database

After deployment, run these commands in your Vercel project:

```bash
npm run db:push
```

### 5. Create Admin User

Set these environment variables temporarily in Vercel:
- `ADMIN_EMAIL` - Your email
- `ADMIN_PASSWORD` - Your password
- `ADMIN_NAME` - Your name

Then run:
```bash
npm run setup:admin
```

Remove these environment variables after setup for security.

## Usage

1. Visit `/login` to access the admin panel
2. Create new posts using the markdown editor
3. Toggle between draft and published states
4. Your posts will appear on the homepage

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Push database schema
npm run db:push

# Create admin user
npm run setup:admin

# Start development server
npm run dev
```

## Security Notes

- Change the default admin password immediately after setup
- Keep your `NEXTAUTH_SECRET` secure and never commit it
- Use strong passwords for your admin account
- Consider adding additional security measures like rate limiting

## Tech Stack

- **Framework**: Next.js 15
- **Database**: PostgreSQL (Vercel Postgres)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Editor**: MDEditor for React