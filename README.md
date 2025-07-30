# Product Community Survey Builder

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)

## 📊 Overview

A modern, responsive survey platform designed for product and community feedback collection. Built with Next.js 14, TypeScript, and Supabase, featuring a clean admin dashboard and real-time analytics.

## ✨ Features

### 🔐 **Authentication & User Management**
- **Demo Access**: Pre-configured demo accounts for testing
- **Google OAuth**: One-click sign-in with Google
- **Email/Password**: Traditional authentication support
- **Role-based Access**: Admin, Collaborator, and Viewer roles

### 📝 **Survey Management**
- Interactive survey builder with drag-and-drop interface
- Real-time form validation and preview
- Support for multiple question types
- Conditional logic and branching

### 📈 **Analytics Dashboard**
- Real-time response tracking
- Visual charts and statistics
- Export capabilities (CSV, PDF)
- Response filtering and search

### 🎨 **Modern UI/UX**
- Responsive design for all devices
- Dark/Light theme support
- Clean, professional interface
- Accessible components (WCAG compliant)

## 🚀 Quick Start

### Demo Access
Try the application with these demo accounts:

- **Viewer Access**: `viewer` / `viewer123` (Read-only analytics)
- **Admin Demo**: `admin-demo` / `demo123` (Read-only admin interface)

### Production Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/pablojavierrodriguez/v0-product-survey-builder.git
   cd v0-product-survey-builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy development environment file
   cp .env.development.local .env.local
   
   # Update with your Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set up database**
   - Create a new Supabase project
   - Run the SQL setup script: `database-schema.sql`
   - Configure authentication providers in Supabase dashboard

5. **Run development server**
   ```bash
   npm run dev
   ```

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Google OAuth
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Deployment**: Vercel

## 📱 Application Structure

```
app/
├── auth/login/          # Authentication pages
├── admin/               # Admin dashboard
│   ├── dashboard/       # Main analytics
│   ├── settings/        # User & system management
│   └── surveys/         # Survey builder (planned)
├── survey/              # Public survey interface
└── globals.css          # Global styles

components/
├── ui/                  # Reusable UI components
├── charts/              # Chart components
└── survey/              # Survey-specific components

lib/
├── auth-context.tsx     # Authentication logic
├── supabase.ts          # Database client
├── config-manager.ts    # Centralized configuration management
├── database-config.ts   # Database configuration utilities
├── database-validator.ts # Database validation and status
├── permissions.ts       # User permissions and roles
├── validation.ts        # Input validation schemas (Zod)
├── rate-limit.ts        # Rate limiting implementation
├── logger.ts            # Structured logging system
└── utils.ts             # Utility functions
```

## 🔒 Security Features

- Row Level Security (RLS) policies
- Environment variable protection
- Secure authentication flows
- Input validation and sanitization (Zod schemas)
- Rate limiting protection (in-memory implementation)
- Structured logging and monitoring
- API endpoint security and validation
- Input sanitization and XSS protection

## 📊 Database Schema

The application uses a PostgreSQL database with the following main tables:

- `pc_survey_data`: Production survey responses and analytics
- `pc_survey_data_dev`: Development survey responses and analytics
- `profiles`: User profiles and role management
- `auth.users`: Supabase authentication (managed)

## 🌐 Deployment

This application is configured for easy deployment on Vercel with environment separation:

### Environment Configuration

- **DEV Environment**: Uses `pc_survey_data_dev` table
- **PROD Environment**: Uses `pc_survey_data` table
- **Shared**: User management and authentication

### Deployment Steps

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch
4. See `DEPLOYMENT.md` for detailed instructions

## 🔧 Recent Fixes & Improvements

### ✅ **Fixed Issues**

1. **Configuration System Overhaul**
   - ✅ Implemented centralized `ConfigManager` for all settings
   - ✅ Fixed environment variable loading and fallback hierarchy
   - ✅ Removed obsolete configuration files and hardcoded values
   - ✅ Created robust configuration priority: Manual > Environment > Defaults

2. **Database Integration**
   - ✅ Removed hardcoded database credentials
   - ✅ Implemented proper environment variable usage
   - ✅ Fixed survey submission to save to database
   - ✅ Added fallback to localStorage for offline support

3. **Mobile UX Improvements**
   - ✅ Fixed header layout for mobile devices
   - ✅ Improved button responsiveness
   - ✅ Enhanced text sizing for small screens
   - ✅ Better navigation button layout

4. **Environment Separation**
   - ✅ Proper dev/prod database table separation
   - ✅ Environment-specific configuration
   - ✅ Branch-based deployment strategy

5. **Code Cleanup**
   - ✅ Removed obsolete files (`lib/env.ts`, `lib/app-settings.ts`)
   - ✅ Cleaned up debug logging for production
   - ✅ Updated all components to use new configuration system
   - ✅ Improved error handling and user feedback

### 🚀 **New Features**

- **ConfigManager**: Centralized configuration management with proper fallbacks
- **Database Schema**: Updated schema matching current survey structure
- **Deployment Guide**: Comprehensive deployment instructions
- **Error Handling**: Improved error handling and user feedback
- **Mobile Optimization**: Enhanced mobile experience
- **Security Enhancements**: Robust input validation, rate limiting, and structured logging
- **API Protection**: Comprehensive API endpoint security with validation and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact the development team or create an issue in this repository.

---

**Built with ❤️ using [v0.dev](https://v0.dev) and modern web technologies**

## 📋 Release Notes

### Version 1.0.0 (December 2024)

#### 🎉 **Major Release - Production Ready**

**New Features:**
- Complete survey system with 11 comprehensive questions
- Admin dashboard with analytics and user management
- Role-based authentication system
- Responsive design for all devices
- Dark/light theme support

**Technical Improvements:**
- Fixed database integration and removed hardcoded credentials
- Implemented proper environment variable management
- Added dev/prod environment separation
- Enhanced mobile UX and responsiveness
- Improved error handling and user feedback

**Database:**
- Created proper schema with survey data tables
- Implemented Row Level Security (RLS) policies
- Added indexes for performance optimization
- Set up user management and authentication

**Deployment:**
- Vercel deployment configuration
- Environment-specific settings
- Comprehensive deployment documentation
- Security headers and HTTPS enforcement

**Security:**
- Environment variable protection
- Input validation and sanitization
- Secure authentication flows
- Rate limiting protection

---

**Status**: ✅ Production Ready
**Next Steps**: Deploy to production and monitor performance
