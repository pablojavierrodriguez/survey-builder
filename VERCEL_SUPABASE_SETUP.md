# 🚀 Vercel + Supabase Native Integration Setup

## 📋 Overview

This guide will help you set up the native integration between Vercel and Supabase for the ProductCommunitySurvey project.

## 🎯 Project Details

- **Organization**: My Product Team Database
- **Project**: ProductCommunitySurvey
- **Integration**: Vercel + Supabase Native

## 🔧 Step-by-Step Setup

### Step 1: Connect Supabase to Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project

2. **Add Supabase Integration**
   - Go to **Settings** → **Integrations**
   - Click **"Browse Marketplace"**
   - Search for **"Supabase"**
   - Click **"Add Integration"**

3. **Configure Supabase Connection**
   - Select your Supabase project: **ProductCommunitySurvey**
   - Choose the environment variables to sync:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
   - Click **"Add Integration"**

### Step 2: Set Up Database Schema

1. **Go to Supabase Dashboard**
   - Visit [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select **ProductCommunitySurvey** project

2. **Run Database Schema**
   - Go to **SQL Editor**
   - Copy and paste the contents of `database-schema-productcommunity.sql`
   - Click **"Run"** to execute the schema

3. **Verify Tables Created**
   - Go to **Table Editor**
   - You should see:
     - `pc_survey_data` (production)
     - `pc_survey_data_dev` (development)
     - `profiles` (user management)

### Step 3: Configure Authentication

1. **Set Up Auth Settings**
   - Go to **Authentication** → **Settings**
   - Configure **Site URL**:
     ```
     https://your-vercel-domain.vercel.app
     ```
   - Add **Redirect URLs**:
     ```
     https://your-vercel-domain.vercel.app/auth/callback
     http://localhost:3000/auth/callback
     ```

2. **Create Demo Users (Optional)**
   - Go to **Authentication** → **Users**
   - Create test users for development

### Step 4: Environment Variables

The native integration will automatically sync these variables:

```bash
# Automatically synced by Vercel + Supabase integration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Manual configuration (if needed)
NEXT_PUBLIC_APP_NAME=Product Survey Builder
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_NODE_ENV=production
NEXT_PUBLIC_DB_TABLE_DEV=pc_survey_data_dev
NEXT_PUBLIC_DB_TABLE_PROD=pc_survey_data
```

### Step 5: Deploy and Test

1. **Deploy to Vercel**
   ```bash
   git push origin main
   ```

2. **Test Database Connection**
   - Visit your deployed app
   - Complete a survey
   - Check Supabase dashboard for data

3. **Test Admin Panel**
   - Use demo accounts:
     - `viewer` / `viewer123`
     - `admin-demo` / `demo123`

## 🔍 Verification Steps

### Check Database Connection

1. **In Supabase Dashboard**:
   - Go to **Table Editor**
   - Check `pc_survey_data_dev` for test data
   - Verify RLS policies are active

2. **In Vercel Dashboard**:
   - Go to **Settings** → **Environment Variables**
   - Verify Supabase variables are synced
   - Check deployment logs for errors

### Test Survey Submission

1. **Complete a survey** on your deployed app
2. **Check Supabase** for new records
3. **Verify data** in the correct table (dev/prod)

## 🛠️ Troubleshooting

### Common Issues

1. **Environment Variables Not Synced**
   - Check Vercel integration status
   - Manually add variables if needed
   - Redeploy after adding variables

2. **Database Connection Failed**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Ensure tables exist

3. **Authentication Issues**
   - Verify redirect URLs in Supabase
   - Check site URL configuration
   - Clear browser cache

### Debug Commands

```bash
# Check environment variables in Vercel
vercel env ls

# Test database connection
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://YOUR_PROJECT.supabase.co/rest/v1/pc_survey_data_dev?limit=1"
```

## 📊 Database Structure

### Tables Created

1. **`pc_survey_data`** - Production survey responses
2. **`pc_survey_data_dev`** - Development survey responses
3. **`profiles`** - User management and roles

### Sample Data

The schema includes sample data in the dev table for testing:
- 3 sample survey responses
- Different roles and industries
- Test email addresses

## 🔒 Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Public insert** for survey data
- **Admin/Collaborator read** access
- **User profile** management
- **Authentication** integration

## 📈 Next Steps

1. **Monitor Performance**
   - Check Vercel analytics
   - Monitor Supabase usage
   - Set up alerts

2. **Scale as Needed**
   - Add more tables if required
   - Optimize queries
   - Set up backups

3. **Production Deployment**
   - Test thoroughly in dev
   - Deploy to production
   - Monitor for issues

---

**Status**: ✅ Ready for Integration
**Last Updated**: December 2024