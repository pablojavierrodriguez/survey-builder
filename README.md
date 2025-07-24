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
   \`\`\`bash
   git clone https://github.com/your-username/product-survey-builder.git
   cd product-survey-builder
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure environment variables**
   \`\`\`bash
   # Create .env.local file
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   \`\`\`

4. **Set up database**
   - Create a new Supabase project
   - Run the SQL setup script: `database-setup.sql`
   - Configure authentication providers in Supabase dashboard

5. **Run development server**
   \`\`\`bash
   npm run dev
   \`\`\`

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

\`\`\`
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
└── utils.ts             # Utility functions
\`\`\`

## 🔒 Security Features

- Row Level Security (RLS) policies
- Environment variable protection
- Secure authentication flows
- Input validation and sanitization
- Rate limiting protection

## 📊 Database Schema

The application uses a PostgreSQL database with the following main tables:

- `pc_survey_data`: Survey responses and analytics
- `profiles`: User profiles and role management
- `auth.users`: Supabase authentication (managed)

## 🌐 Deployment

This application is configured for easy deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch

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
