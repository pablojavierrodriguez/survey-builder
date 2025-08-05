# Survey Builder App

Una aplicación moderna para crear y gestionar encuestas con Next.js, TypeScript, Supabase y Tailwind CSS.

## 🚀 Características

- **Wizard de configuración automático** - Setup inicial sin complicaciones
- **Encuestas dinámicas** - Crea encuestas personalizadas
- **Dashboard de analytics** - Visualiza respuestas y estadísticas
- **Autenticación segura** - Sistema de usuarios y roles
- **Responsive design** - Funciona en desktop y móvil
- **Tema oscuro/claro** - Interfaz moderna y accesible

## 🛠️ Tecnologías

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **UI Components:** shadcn/ui
- **Deployment:** Vercel

## 📋 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Vercel](https://vercel.com) (opcional)

### 1. Clonar el repositorio

```bash
git clone https://github.com/pablojavierrodriguez/survey-builder.git
cd survey-builder
npm install
```

### 2. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Espera que termine de inicializar (2-3 minutos)

### 3. Inicializar la base de datos

1. En Supabase Dashboard → SQL Editor
2. Copia y pega el contenido de `INITIALIZATION.sql`
3. Haz click en "Run"

### 4. Configurar la aplicación

1. Ejecuta la aplicación:
```bash
npm run dev
```

2. Ve a `http://localhost:3000/setup`

3. **Opción A - Manual:**
   - Selecciona pestaña "Manual"
   - Ingresa:
     - **Supabase URL** (de Settings → API)
     - **Anon Key** (de Settings → API)
     - **Service Role Key** (de Settings → API)
     - **Survey Name** (nombre de tu encuesta)

4. **Opción B - Admin:**
   - Selecciona pestaña "Admin"
   - Ingresa:
     - **Supabase URL** (de Settings → API)
     - **Email de Admin** (tu email de Supabase)
     - **Contraseña de Admin** (tu contraseña de Supabase)
     - **Survey Name** (nombre de tu encuesta)

5. Haz click en "Probar Conexión"
6. Haz click en "Guardar"

### 5. ¡Listo!

La aplicación estará configurada y funcionando. Puedes:
- Crear usuarios en `/auth/signup`
- Acceder al dashboard en `/admin/dashboard`
- Crear encuestas en `/admin/survey-config`

## 🏗️ Estructura del Proyecto

```
survey-builder/
├── app/                    # App Router (Next.js 15)
│   ├── admin/             # Panel de administración
│   ├── api/               # API routes
│   ├── auth/              # Páginas de autenticación
│   └── setup/             # Wizard de configuración
├── components/            # Componentes reutilizables
├── lib/                   # Utilidades y configuración
├── hooks/                 # Custom hooks
├── styles/                # Estilos globales
└── public/                # Archivos estáticos
```

## 🔧 Configuración de Desarrollo

### Variables de Entorno

Crea un archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Scripts Disponibles

```bash
npm run dev          # Desarrollo local
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linting
```

## 📊 Base de Datos

### Tablas Principales

- **`app_settings`** - Configuración de la aplicación
- **`survey_data`** - Respuestas de las encuestas
- **`profiles`** - Perfiles de usuarios

### Seguridad

- **Row Level Security (RLS)** habilitado en todas las tablas
- **Políticas de acceso** configuradas automáticamente
- **Autenticación** integrada con Supabase Auth

## 🚀 Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Deploy automático en cada push

### Variables de Entorno en Producción

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas:

1. Revisa que hayas ejecutado el SQL de inicialización
2. Verifica que las credenciales de Supabase sean correctas
3. Revisa los logs en la consola del navegador
4. Abre un issue en GitHub

---

**Desarrollado con ❤️ usando Next.js y Supabase**
