# 🚀 Deployment Guide - Product Survey Builder

## 📋 Overview

This guide will help you deploy the Product Survey Builder application to both development and production environments with proper database separation.

## 🏗️ Architecture

- **DEV Environment**: Uses `pc_survey_data_dev` table
- **PROD Environment**: Uses `pc_survey_data` table
- **Shared**: User management and authentication

## 🔧 Prerequisites

1. **Supabase Project**: Create a new project at [supabase.com](https://supabase.com)
2. **Vercel Account**: For deployment
3. **GitHub Repository**: Connected to Vercel

## 📊 Database Setup

### Step 1: Set up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the `database-schema.sql` script to create:
   - `pc_survey_data` (production table)
   - `pc_survey_data_dev` (development table)
   - `profiles` (user management)
   - RLS policies and indexes

### Step 2: Configure Authentication

1. In Supabase Dashboard → **Authentication** → **Settings**
2. Configure your site URL:
   - **Site URL**: `https://your-domain.vercel.app`
   - **Redirect URLs**: 
     - `https://your-domain.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (for local dev)

## 🔑 Environment Variables

### For Vercel Production

Set these in your Vercel project dashboard → **Settings** → **Environment Variables**:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration
NEXT_PUBLIC_APP_NAME=Product Survey Builder
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_NODE_ENV=production

# Database Configuration
NEXT_PUBLIC_DB_TABLE_DEV=pc_survey_data_dev
NEXT_PUBLIC_DB_TABLE_PROD=pc_survey_data

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=true

# Security
NEXT_PUBLIC_SESSION_TIMEOUT=28800000
NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS=3
```

### For Local Development

1. Copy `.env.development.local` to `.env.local`
2. Update the Supabase credentials in `.env.local`

## 🚀 Deployment Steps

### Step 1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure the build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 2: Configure Environment Variables

1. In Vercel dashboard → **Settings** → **Environment Variables**
2. Add all the environment variables listed above
3. Make sure to set different values for **Production** and **Preview** environments

### Step 3: Deploy

1. Push your code to the `main` branch for production
2. Push to the `dev` branch for development testing
3. Vercel will automatically deploy both environments

## 🔄 Branch Strategy

- **`main` branch**: Production deployment (uses `pc_survey_data`)
- **`dev` branch**: Development deployment (uses `pc_survey_data_dev`)

## 🧪 Testing the Deployment

### Test Survey Submission

1. **Production**: Visit your production URL and complete a survey
2. **Development**: Visit your dev URL and complete a survey
3. Check Supabase dashboard to verify data is saved to the correct table

### Test Admin Panel

1. Use demo accounts:
   - **Viewer**: `viewer` / `viewer123`
   - **Admin Demo**: `admin-demo` / `demo123`
2. Verify you can access analytics and settings

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check Supabase URL and keys
   - Verify RLS policies are set up correctly
   - Check if tables exist

2. **Authentication Issues**
   - Verify redirect URLs in Supabase
   - Check environment variables
   - Clear browser cache

3. **Survey Not Saving**
   - Check browser console for errors
   - Verify database permissions
   - Check network connectivity

### Debug Commands

```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Test database connection
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://YOUR_PROJECT.supabase.co/rest/v1/pc_survey_data?limit=1"
```

## 📈 Monitoring

### Vercel Analytics

1. Enable Vercel Analytics in your project
2. Monitor performance and errors
3. Set up alerts for failures

### Supabase Monitoring

1. Check Supabase dashboard for:
   - Database performance
   - Authentication logs
   - API usage

## 🔒 Security Checklist

- [ ] RLS policies configured
- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review Vercel and Supabase logs
3. Test with the provided demo accounts
4. Verify all environment variables are set correctly

---

**Last Updated**: December 2024
**Version**: 1.0.0