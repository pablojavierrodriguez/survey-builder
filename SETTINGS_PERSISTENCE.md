# Settings Persistence System

## Overview

The application now has a comprehensive settings persistence system that stores configuration in the Supabase `app_settings` table and provides fallbacks to environment variables.

## Architecture

### 1. Environment Variables Priority
Settings are resolved in the following order:
1. **Environment Variables** (highest priority)
2. **Database Settings** (from `app_settings` table)
3. **Default Values** (non-functional placeholders)

### 2. Client-Side Environment Access
Environment variables are exposed to the client through:
- `window.__ENV__` object in the layout
- `lib/env.ts` with `getEnv()` function
- Automatic fallback handling

### 3. Settings API
- **GET `/api/admin/settings`**: Fetch current settings
- **POST `/api/admin/settings`**: Update settings

## Database Schema

The `app_settings` table stores:
```sql
CREATE TABLE app_settings (
  id SERIAL PRIMARY KEY,
  environment TEXT NOT NULL, -- 'dev' or 'prod'
  survey_table_name TEXT,
  app_name TEXT,
  app_url TEXT,
  maintenance_mode BOOLEAN DEFAULT false,
  enable_analytics BOOLEAN DEFAULT true,
  enable_email_notifications BOOLEAN DEFAULT true,
  enable_export BOOLEAN DEFAULT true,
  session_timeout INTEGER DEFAULT 3600000, -- milliseconds
  max_login_attempts INTEGER DEFAULT 10,
  theme_default TEXT DEFAULT 'system',
  language_default TEXT DEFAULT 'en',
  settings JSONB DEFAULT '{}', -- Additional settings like Supabase config
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Key Features

### 1. Environment-Specific Settings
- Settings are stored per environment (`dev`/`prod`)
- Automatic environment detection based on hostname and branch
- Separate configurations for development and production

### 2. Persistent Configuration
- Settings saved in Settings panel persist across sessions
- Database configuration (URL, API key, table name) is stored in `settings` JSONB field
- All settings survive app restarts, cache clears, and admin logout

### 3. Automatic Fallbacks
- If database is unavailable, falls back to environment variables
- If environment variables are missing, uses sensible defaults
- Graceful degradation ensures app always has configuration

### 4. Real-time Updates
- Settings changes are immediately reflected across the app
- Database tab shows current configuration
- Survey submission uses current database settings

## Usage

### Loading Settings
```typescript
import { getAppSettings } from '@/lib/app-settings'

const settings = await getAppSettings()
```

### Updating Settings
```typescript
import { updateAppSettings } from '@/lib/app-settings'

const result = await updateAppSettings('dev', {
  app_name: 'New App Name',
  maintenance_mode: true
})
```

### Environment Variables
```typescript
import { getEnv } from '@/lib/env'

const env = getEnv()
const supabaseUrl = env.SUPABASE_URL
```

## Configuration Flow

1. **Initial Load**: App loads settings from API
2. **Environment Variables**: Supabase URL/API Key from Vercel integration
3. **Database Settings**: Additional configuration from `app_settings` table
4. **User Changes**: Admin modifies settings in Settings panel
5. **Persistence**: Changes saved to database via API
6. **Application**: All components use current settings

## Benefits

- **No Hardcoded Values**: All configuration comes from environment or database
- **Environment Isolation**: Separate settings for dev/prod
- **Admin Control**: Full configuration through Settings panel
- **Persistence**: Settings survive all app restarts
- **Fallbacks**: App works even if database is down
- **Real-time**: Changes immediately affect all components