# Environment Variables Cleanup Plan

## 🎯 **Objetivo**
Eliminar variables de entorno innecesarias ahora que tenemos el wizard de configuración dinámica.

## 📋 **Variables a ELIMINAR (ya no necesarias)**

### **1. Supabase Configuration (ahora se configura via wizard)**
```bash
# ❌ ELIMINAR - Se configuran dinámicamente
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
POSTGRES_NEXT_PUBLIC_SUPABASE_URL
POSTGRES_SUPABASE_URL
POSTGRES_NEXT_PUBLIC_SUPABASE_ANON_KEY
POSTGRES_SUPABASE_ANON_KEY
```

### **2. App Configuration (ahora se configura via wizard)**
```bash
# ❌ ELIMINAR - Se configuran dinámicamente
NEXT_PUBLIC_APP_NAME
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_DB_TABLE
```

### **3. Features Flags (ahora se configuran via settings)**
```bash
# ❌ ELIMINAR - Se configuran via admin panel
NEXT_PUBLIC_ENABLE_EXPORT
NEXT_PUBLIC_ENABLE_ANALYTICS
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS
```

### **4. Security Settings (ahora se configuran via settings)**
```bash
# ❌ ELIMINAR - Se configuran via admin panel
NEXT_PUBLIC_SESSION_TIMEOUT
NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS
```

## ✅ **Variables a MANTENER (siguen siendo necesarias)**

### **1. Build/Deploy Configuration**
```bash
# ✅ MANTENER - Necesarias para build/deploy
NODE_ENV
VERCEL_URL
```

### **2. Development Only**
```bash
# ✅ MANTENER - Solo para desarrollo local
NEXT_PUBLIC_APP_URL (solo en .env.local para desarrollo)
```

## 🔧 **Archivos a Modificar**

### **1. `lib/config-manager.ts`**
- Eliminar todas las referencias a variables de entorno eliminadas
- Simplificar para usar solo configuración de DB
- Mantener fallbacks para desarrollo local

### **2. `app/api/config/check/route.ts`**
- Simplificar para solo verificar si existe configuración en DB
- Eliminar verificación de variables de entorno

### **3. `app/api/config/supabase/route.ts`**
- Eliminar fallbacks a variables de entorno
- Usar solo configuración de DB

### **4. `app/api/setup/save-config/route.ts`**
- Eliminar fallbacks a variables de entorno
- Usar solo valores del wizard

### **5. `app/api/admin/settings/route.ts`**
- Eliminar referencias a variables de entorno
- Usar solo configuración de DB

### **6. `app/api/config/app/route.ts`**
- Eliminar referencias a variables de entorno
- Usar solo configuración de DB

### **7. `app/page.tsx`**
- Eliminar referencias a `NEXT_PUBLIC_DB_TABLE`
- Usar configuración de DB

## 📁 **Archivos de Entorno a Limpiar**

### **`.env.local` (desarrollo)**
```bash
# Mantener solo para desarrollo local
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **`.env.example` (crear)**
```bash
# Solo variables necesarias para desarrollo
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Vercel Environment Variables**
- Eliminar todas las variables de configuración de app
- Mantener solo `NODE_ENV` y `VERCEL_URL` (automáticas)

## 🚀 **Beneficios de la Limpieza**

### **1. Seguridad**
- ✅ No más credenciales en variables de entorno
- ✅ Configuración centralizada en DB
- ✅ Menos exposición de información sensible

### **2. Flexibilidad**
- ✅ Configuración dinámica via wizard
- ✅ Cambios sin redeploy
- ✅ Configuración por ambiente en DB

### **3. Mantenimiento**
- ✅ Menos variables de entorno que gestionar
- ✅ Configuración unificada
- ✅ Menos archivos de configuración

### **4. UX**
- ✅ Setup inicial más simple
- ✅ Configuración via UI
- ✅ Menos dependencias externas

## 📝 **Plan de Implementación**

### **Fase 1: Análisis y Preparación**
1. ✅ Crear branch `cleanup-environment-variables`
2. ✅ Documentar variables actuales
3. ✅ Identificar dependencias

### **Fase 2: Limpieza de Código**
1. 🔄 Modificar `lib/config-manager.ts`
2. 🔄 Actualizar API routes
3. 🔄 Limpiar referencias en componentes

### **Fase 3: Limpieza de Archivos**
1. 🔄 Limpiar `.env.local`
2. 🔄 Crear `.env.example`
3. 🔄 Actualizar documentación

### **Fase 4: Testing**
1. 🔄 Probar wizard sin variables de entorno
2. 🔄 Verificar configuración dinámica
3. 🔄 Testear en desarrollo y producción

### **Fase 5: Documentación**
1. 🔄 Actualizar README
2. 🔄 Actualizar guías de setup
3. 🔄 Documentar nueva configuración

## ⚠️ **Consideraciones**

### **1. Backward Compatibility**
- Mantener fallbacks para desarrollo local
- Asegurar que la app funcione sin variables de entorno

### **2. Migration**
- Los usuarios existentes necesitarán usar el wizard
- Configuración actual se migra automáticamente

### **3. Development**
- Mantener variables mínimas para desarrollo local
- Simplificar setup para nuevos desarrolladores

## 🎯 **Resultado Esperado**

### **Variables de Entorno Finales:**
```bash
# Solo estas variables necesarias
NODE_ENV=development|production
VERCEL_URL=https://app.vercel.app (automática)
NEXT_PUBLIC_APP_URL=http://localhost:3000 (solo desarrollo)
```

### **Configuración Dinámica:**
- ✅ Supabase credentials via wizard
- ✅ App settings via admin panel
- ✅ Features flags via settings
- ✅ Security settings via settings

**¿Procedo con la implementación de este plan?**