# Open Survey 🚀

> **Open source survey platform** - Build, share, and analyze surveys with ease

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)](https://www.typescriptlang.org/)

## ✨ Features

- 🎯 **Dynamic Survey Builder** - Create surveys with drag & drop interface
- 📊 **Real-time Analytics** - Get insights from your responses instantly
- 🔐 **Multi-tenant Architecture** - Support for multiple organizations
- 🎨 **Customizable Themes** - Brand your surveys with custom styling
- 📱 **Responsive Design** - Works perfectly on all devices
- 🔄 **Conditional Logic** - Show/hide questions based on responses
- 📤 **Export Options** - Export data in multiple formats
- 🔌 **API Access** - Integrate with your existing tools

## 🏗️ Architecture

```
open-survey/
├── apps/
│   └── web/                 # Next.js frontend application
├── packages/
│   ├── database/           # Database schema & migrations
│   ├── ui/                 # Shared UI components
│   ├── utils/              # Shared utilities
│   └── types/              # TypeScript type definitions
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/open-survey.git
   cd open-survey
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set up the database**
   ```bash
   pnpm db:push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

- [Getting Started](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing](./docs/contributing.md)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Monorepo**: Turborepo
- **Deployment**: Vercel, Docker

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/contributing.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Radix UI](https://www.radix-ui.com/) for the accessible components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

## 📞 Support

- 📧 Email: support@opensurvey.dev
- 💬 Discord: [Join our community](https://discord.gg/opensurvey)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/open-survey/issues)
- 📖 Docs: [Documentation](https://docs.opensurvey.dev)

---

Made with ❤️ by the Open Survey community
