# Environment-Based Settings Solution

## 🎯 **Objetivo**
Separar las configuraciones de desarrollo y producción, con un sistema de prioridades que permita al administrador configurar manualmente las settings.

## 🏗️ **Arquitectura de Prioridades**

### **1. PRIORIDAD MÁXIMA: Configuración del Usuario (DB)**
- Si el admin ya configuró las settings en la base de datos, se usan esas
- Se almacenan en la tabla `app_settings` con campo `environment`

### **2. PRIORIDAD MEDIA: Variables de Entorno**
- Si no hay configuración en DB, se usan las variables de entorno
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.

### **3. PRIORIDAD MÍNIMA: Placeholders Vacíos**
- Si no hay variables de entorno, se muestran campos vacíos
- El admin debe completar la configuración manualmente

## 🔧 **Implementación**

### **Estructura de la Base de Datos**
```sql
CREATE TABLE app_settings (
    id SERIAL PRIMARY KEY,
    environment TEXT NOT NULL DEFAULT 'dev',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB NOT NULL DEFAULT '{}',
    version TEXT DEFAULT '2.0.0',
    UNIQUE(environment)
);
```

### **Detección de Entorno**
```typescript
// Basado en NODE_ENV
const environment = process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
```

### **Configuraciones por Entorno**

#### **DEV Environment**
```json
{
  "database": {
    "tableName": "pc_survey_data_dev",
    "environment": "dev"
  },
  "general": {
    "appName": "Product Community Survey (DEV)"
  },
  "security": {
    "enforceStrongPasswords": false
  },
  "features": {
    "enableEmailNotifications": false
  }
}
```

#### **PROD Environment**
```json
{
  "database": {
    "tableName": "pc_survey_data",
    "environment": "prod"
  },
  "general": {
    "appName": "Product Community Survey"
  },
  "security": {
    "enforceStrongPasswords": true
  },
  "features": {
    "enableEmailNotifications": true
  }
}
```

## 📁 **Archivos Modificados**

### **1. `lib/config-manager.ts`**
- ✅ Detección automática de entorno basada en `NODE_ENV`
- ✅ Sistema de prioridades: DB > Env Vars > Placeholders
- ✅ Métodos para obtener configuraciones específicas por entorno
- ✅ Función `hasUserConfiguredSettings()` para verificar si el admin configuró

### **2. `app/api/admin/settings/route.ts`**
- ✅ GET: Retorna settings según prioridades
- ✅ POST: Guarda settings para el entorno específico
- ✅ Logging detallado del origen de las configuraciones
- ✅ Validación y manejo de errores

### **3. `environment-based-settings.sql`**
- ✅ Script para crear la estructura con soporte de entornos
- ✅ Configuraciones por defecto para dev y prod
- ✅ Índices para optimizar consultas

## 🚀 **Flujo de Configuración**

### **Primera Vez (Sin Configuración)**
1. App detecta entorno (`dev` o `prod`)
2. Busca configuración en DB → No encuentra
3. Busca variables de entorno → Si existen, las usa
4. Si no hay variables de entorno → Muestra placeholders vacíos
5. Admin ingresa a `/admin/settings` y completa la configuración
6. Se guarda en DB para el entorno específico

### **Configuración Existente**
1. App detecta entorno
2. Busca configuración en DB → Encuentra settings del usuario
3. Usa la configuración guardada (prioridad máxima)

### **Cambio de Entorno**
1. Si cambia `NODE_ENV`, automáticamente usa el entorno correcto
2. Cada entorno tiene su propia configuración independiente

## 🔍 **Verificación**

### **Scripts de Prueba**
- `test-environment-settings.sql`: Verifica que todo funcione correctamente
- `environment-based-settings.sql`: Crea la estructura inicial

### **Logs de Debug**
```typescript
// El API retorna información del origen
{
  success: true,
  data: settings,
  environment: "dev",
  source: "database" | "environment" | "placeholder"
}
```

## 🎯 **Beneficios**

1. **Separación Clara**: Dev y prod tienen configuraciones independientes
2. **Flexibilidad**: Admin puede configurar manualmente o usar variables de entorno
3. **Seguridad**: Configuraciones sensibles no están hardcodeadas
4. **Mantenibilidad**: Fácil de actualizar y gestionar
5. **Debugging**: Logs claros del origen de cada configuración

## 📋 **Próximos Pasos**

1. Ejecutar `environment-based-settings.sql` para crear la estructura
2. Probar con `test-environment-settings.sql`
3. Verificar que el admin pueda configurar manualmente
4. Monitorear logs para confirmar que funciona correctamente