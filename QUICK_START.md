# Quick Start Guide

## 🚀 Get Started in 30 Seconds

### Option 1: Demo Mode (Instant)
```bash
git clone <repository-url>
cd product-survey-builder
npm install
npm run dev
```

**That's it!** The app works immediately with:
- ✅ Survey form at `http://localhost:3000`
- ✅ Admin panel at `http://localhost:3000/auth/login`
- ✅ Demo credentials: `viewer/viewer123` or `admin-demo/demo123`

### Option 2: Full Supabase Setup (5 minutes)

1. **Follow Demo Mode steps above**
2. **Create Supabase project** at [supabase.com](https://supabase.com)
3. **Visit Setup Wizard** at `http://localhost:3000/setup`
4. **Enter your Supabase credentials**
5. **Run the provided SQL migration**

## 🎯 What Works Out of the Box

### Without Any Configuration:
- ✅ Complete survey form with validation
- ✅ Multi-step survey flow
- ✅ Admin authentication system
- ✅ Analytics dashboard with charts
- ✅ Data export functionality
- ✅ Responsive design
- ✅ Dark/light mode
- ✅ Role-based access control

### With Supabase Configuration:
- ✅ Everything above PLUS:
- ✅ Cloud data storage
- ✅ Real-time data sync
- ✅ Google OAuth authentication
- ✅ Multi-device access
- ✅ Production-ready scaling

## 🔧 Configuration Modes

| Feature | Demo Mode | Supabase Mode |
|---------|-----------|---------------|
| **Setup Time** | 0 minutes | 5 minutes |
| **Data Storage** | localStorage | Cloud Database |
| **Authentication** | Demo accounts | Real auth + OAuth |
| **Multi-device** | ❌ | ✅ |
| **Production Ready** | Testing only | ✅ |

## 📱 Test the App

1. **Survey Form**: Submit a test survey
2. **Admin Login**: Use `viewer/viewer123`
3. **View Analytics**: See your test data
4. **Export Data**: Download CSV/JSON reports

## 🆘 Need Help?

- **Setup Issues**: Visit `/setup` for guided configuration
- **Demo Mode**: Everything works locally without setup
- **Supabase Issues**: Check the migration SQL script
- **General Help**: Contact [Pablo Rodriguez](https://www.linkedin.com/in/pablojavierrodriguez)

---

**The app is designed to work immediately in demo mode, with Supabase as an optional enhancement for production use.**