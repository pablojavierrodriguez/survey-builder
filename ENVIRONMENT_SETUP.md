# Environment Variables Setup Guide

## Overview

This application uses environment variables to configure different aspects of the app based on the environment (development, staging, production). The configuration system prioritizes environment variables over database settings to ensure consistency and security.

## Environment Variables Structure

### Required Variables

#### Supabase Configuration
```bash
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anonymous Key (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Supabase Service Role Key (private, server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### App Configuration
```bash
# App Name (displayed in UI)
NEXT_PUBLIC_APP_NAME=Product Community Survey

# App URL (used for links and redirects)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Environment
NEXT_PUBLIC_NODE_ENV=production
```

#### Database Configuration
```bash
# Development table name
NEXT_PUBLIC_DB_TABLE_DEV=pc_survey_data_dev

# Production table name
NEXT_PUBLIC_DB_TABLE_PROD=pc_survey_data
```

#### Feature Flags
```bash
# Enable analytics
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Enable email notifications
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=false

# Enable data export
NEXT_PUBLIC_ENABLE_EXPORT=true
```

#### Security Settings
```bash
# Session timeout in milliseconds (8 hours default)
NEXT_PUBLIC_SESSION_TIMEOUT=28800000

# Maximum login attempts
NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS=3
```

## Environment-Specific Configuration

### Development Environment
```bash
# .env.local
NEXT_PUBLIC_APP_NAME=Product Community Survey (DEV)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_NODE_ENV=development
NEXT_PUBLIC_DB_TABLE_DEV=pc_survey_data_dev
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=false
NEXT_PUBLIC_ENABLE_EXPORT=true
```

### Production Environment (Vercel)
```bash
# Vercel Environment Variables
NEXT_PUBLIC_APP_NAME=Product Community Survey
NEXT_PUBLIC_APP_URL=https://productcommunitysurvey.vercel.app
NEXT_PUBLIC_NODE_ENV=production
NEXT_PUBLIC_DB_TABLE_PROD=pc_survey_data
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_EXPORT=true
```

## Configuration Priority

The application uses the following priority order for configuration:

1. **Environment Variables** (highest priority)
2. **Supabase app_settings table** (if Supabase is configured)
3. **Default values** (fallback)

### Example Priority Chain
```typescript
// For app name:
const appName = 
  process.env.NEXT_PUBLIC_APP_NAME ||           // 1. Environment variable
  supabaseSettings.app_name ||                  // 2. Database setting
  'Product Community Survey'                    // 3. Default value
```

## Vercel Deployment Configuration

### Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following variables:

#### For Development Branch
```bash
NEXT_PUBLIC_APP_NAME=Product Community Survey (DEV)
NEXT_PUBLIC_APP_URL=https://productcommunitysurvey-dev.vercel.app
NEXT_PUBLIC_DB_TABLE_DEV=pc_survey_data_dev
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=false
```

#### For Production Branch
```bash
NEXT_PUBLIC_APP_NAME=Product Community Survey
NEXT_PUBLIC_APP_URL=https://productcommunitysurvey.vercel.app
NEXT_PUBLIC_DB_TABLE_PROD=pc_survey_data
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=true
```

### Supabase Integration

1. Connect your Supabase project to Vercel
2. Vercel will automatically sync these variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Troubleshooting

### Common Issues

#### 1. "Application error" on Vercel
**Cause**: Missing or incorrect environment variables
**Solution**: 
- Check Vercel environment variables
- Ensure all required variables are set
- Verify Supabase connection

#### 2. Wrong database table being used
**Cause**: Environment detection not working
**Solution**:
- Check `NEXT_PUBLIC_DB_TABLE_DEV` and `NEXT_PUBLIC_DB_TABLE_PROD`
- Verify environment detection logic
- Check hostname patterns

#### 3. Settings not updating
**Cause**: Cache or configuration conflicts
**Solution**:
- Clear browser cache
- Check environment variable priority
- Verify Supabase app_settings table

### Debug Mode

Enable debug logging by setting:
```bash
NEXT_PUBLIC_DEBUG=true
```

This will show detailed configuration information in the browser console.

## Security Considerations

1. **Never commit sensitive keys** to version control
2. **Use Vercel's environment variables** for production secrets
3. **Keep service role keys** server-side only
4. **Rotate keys regularly** for security

## Migration from Database Settings

If you're migrating from database-only settings:

1. Set environment variables in Vercel
2. The app will automatically use environment variables
3. Database settings become fallback
4. Update admin panel to reflect new priority

## Best Practices

1. **Use descriptive names** for environment variables
2. **Set defaults** for all variables
3. **Document changes** when updating configuration
4. **Test in staging** before production
5. **Monitor configuration** in production logs