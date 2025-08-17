# Survey Builder App

Una aplicación simple y escalable para crear y gestionar encuestas con Supabase.

## 🚀 Configuración Inicial

### Paso 1: Clonar el repositorio
\`\`\`bash
git clone https://github.com/pablojavierrodriguez/survey-builder.git
cd survey-builder
npm install
\`\`\`

### Paso 2: Crear proyecto Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Guarda la URL del proyecto y las API keys

### Paso 3: Inicializar base de datos
1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta el script `INITIALIZATION.sql` (incluido en este repo)
3. Esto crea las tablas necesarias y configura RLS

### Paso 4: Configurar la aplicación
1. Ejecuta `npm run dev`
2. Accede a la aplicación
3. Completa el wizard de configuración con:
   - URL de Supabase
   - Service Role Key
   - Nombre de la aplicación

### Paso 5: ¡Listo!
La aplicación está configurada y lista para usar.

## 🛠️ Tecnologías

- **Frontend:** Next.js 15, React, TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **UI:** Tailwind CSS, shadcn/ui
- **Deploy:** Vercel

## 📁 Estructura del Proyecto

\`\`\`
├── app/                    # Next.js App Router
│   ├── admin/             # Panel de administración
│   ├── auth/              # Páginas de autenticación
│   ├── api/               # API Routes
│   └── setup/             # Wizard de configuración
├── components/            # Componentes React
├── lib/                   # Utilidades y configuración
└── INITIALIZATION.sql     # Script de inicialización
\`\`\`

## 🔧 Características

- ✅ Configuración inicial automática
- ✅ Autenticación con Supabase
- ✅ Panel de administración
- ✅ Gestión de encuestas
- ✅ Análisis de respuestas
- ✅ Arquitectura escalable
- ✅ Multi-admin support
- ✅ Multi-survey support

## 🚀 Deploy

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel
3. Deploy automático

## 📝 Licencia

MIT
