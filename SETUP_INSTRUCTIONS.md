# Setup Instructions - Product Survey Builder

## Overview

This application can run in **two modes**:

1. **Demo Mode** - Works immediately with localStorage (no setup required)
2. **Supabase Mode** - Full cloud functionality with real database

## Mode 1: Demo Mode (Instant Setup)

### ✅ Works immediately without any configuration

```bash
npm install
npm run dev
```

**Features Available:**
- ✅ Survey form submission (localStorage)
- ✅ Admin dashboard with demo data
- ✅ Analytics with local data
- ✅ User authentication (hardcoded demo accounts)
- ✅ All UI functionality
- ❌ No cloud sync
- ❌ No real user management

**Demo Credentials:**
- Viewer: `viewer` / `viewer123`
- Admin Demo: `admin-demo` / `demo123`

## Mode 2: Supabase Mode (Full Functionality)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for project to be ready
4. Go to Settings → API
5. Copy your:
   - Project URL (e.g., `https://abc123.supabase.co`)
   - anon/public key (starts with `eyJhbGciOiJIUzI1NiIs...`)

### Step 2: Configure Database

**Option A: Use the Setup Wizard (Recommended)**
1. Run the app: `npm run dev`
2. Visit: `http://localhost:3000/setup`
3. Enter your Supabase credentials
4. Test connection
5. Complete setup

**Option B: Manual Configuration**
1. Create `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Run the SQL migration in Supabase SQL Editor:
   - Copy content from `supabase/migrations/001_create_survey_tables.sql`
   - Paste in Supabase Dashboard → SQL Editor
   - Execute the script

### Step 3: Configure Authentication (Optional)

1. In Supabase Dashboard → Authentication → Providers
2. Enable Google OAuth (optional):
   - Add your domain to redirect URLs
   - Configure Google OAuth credentials

### Step 4: Test Everything

1. Visit: `http://localhost:3000/test-survey`
2. Run comprehensive tests
3. Verify all functionality works

## Features by Mode

| Feature | Demo Mode | Supabase Mode |
|---------|-----------|---------------|
| Survey Submission | ✅ localStorage | ✅ Cloud DB |
| Admin Dashboard | ✅ Demo data | ✅ Real data |
| Analytics | ✅ Local data | ✅ Real-time |
| User Auth | ✅ Hardcoded | ✅ Real auth |
| Data Export | ✅ Local data | ✅ Cloud data |
| Multi-device Sync | ❌ | ✅ |
| Real User Management | ❌ | ✅ |
| Google OAuth | ❌ | ✅ |

## Troubleshooting

### App Not Working?
1. Check console for errors
2. Verify you're using Node.js 18+
3. Clear browser cache and localStorage
4. Try demo mode first

### Supabase Connection Issues?
1. Verify your URL and key are correct
2. Check if your Supabase project is active
3. Run the migration SQL script
4. Test connection in `/setup` page

### Data Not Showing?
1. Submit a test survey first
2. Check if you're in the right mode (demo vs Supabase)
3. Verify table permissions in Supabase
4. Check browser console for errors

## Production Deployment

### Environment Variables for Production
```bash
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

### Security Checklist
- [ ] Enable RLS policies in Supabase
- [ ] Configure proper authentication providers
- [ ] Set up SSL certificates
- [ ] Configure CORS settings
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging

## Support

- **Demo Issues**: Check browser console and localStorage
- **Supabase Issues**: Verify credentials and database setup
- **General Help**: Contact [Pablo Javier Rodriguez](https://www.linkedin.com/in/pablojavierrodriguez)