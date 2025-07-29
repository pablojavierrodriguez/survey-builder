# Vercel Environment Variables Setup

## Archivos de Variables de Entorno

Se han creado dos archivos JSON con las variables de entorno para cada rama:

### 📁 Archivos Disponibles

1. **`vercel-env-dev.json`** - Variables para la rama `dev`
2. **`vercel-env-prod.json`** - Variables para la rama `main` (producción)

## 🚀 Instrucciones de Importación

### Paso 1: Ir a Vercel Dashboard
1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `productcommunitysurvey`

### Paso 2: Configurar Variables para DEV Branch
1. Ve a **Settings** > **Environment Variables**
2. Haz clic en **"Add New"**
3. Selecciona **"Production, Preview, Development"** para que aplique a todas las ramas
4. Copia y pega el contenido de `vercel-env-dev.json` en el campo de texto
5. Haz clic en **"Save"**

### Paso 3: Configurar Variables para MAIN Branch (Producción)
1. En la misma sección de Environment Variables
2. Haz clic en **"Add New"** nuevamente
3. Selecciona **"Production"** para que solo aplique a la rama main
4. Copia y pega el contenido de `vercel-env-prod.json` en el campo de texto
5. Haz clic en **"Save"**

### Paso 4: Configurar Supabase (Opcional)
Si tienes Supabase configurado, agrega estas variables:

```json
{
  "NEXT_PUBLIC_SUPABASE_URL": "https://tu-proyecto.supabase.co",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY": "tu_anon_key_aqui",
  "SUPABASE_SERVICE_ROLE_KEY": "tu_service_role_key_aqui"
}
```

## 📋 Variables Incluidas

### Variables Comunes
- `NEXT_PUBLIC_APP_NAME`: Nombre de la aplicación
- `NEXT_PUBLIC_APP_URL`: URL de la aplicación
- `NEXT_PUBLIC_NODE_ENV`: Ambiente (development/production)
- `NEXT_PUBLIC_DB_TABLE_DEV`: Tabla para desarrollo
- `NEXT_PUBLIC_DB_TABLE_PROD`: Tabla para producción

### Feature Flags
- `NEXT_PUBLIC_ENABLE_ANALYTICS`: Habilitar analytics
- `NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS`: Habilitar notificaciones por email
- `NEXT_PUBLIC_ENABLE_EXPORT`: Habilitar exportación de datos

### Configuración de Seguridad
- `NEXT_PUBLIC_SESSION_TIMEOUT`: Timeout de sesión (28,800,000 ms = 8 horas)
- `NEXT_PUBLIC_MAX_LOGIN_ATTEMPTS`: Máximo intentos de login (3)
- `NEXT_PUBLIC_DEBUG`: Modo debug (true para dev, false para prod)

## 🔄 Después de la Configuración

1. **Redeploy**: Vercel automáticamente hará redeploy con las nuevas variables
2. **Verificar**: Ve a tu aplicación y verifica que funciona correctamente
3. **Probar**: Prueba las funcionalidades en ambos ambientes

## 🛠️ Troubleshooting

### Si las variables no se aplican:
1. Verifica que seleccionaste el ambiente correcto (Production/Preview/Development)
2. Espera unos minutos para que Vercel procese los cambios
3. Haz un redeploy manual desde el dashboard

### Si hay errores:
1. Verifica que el JSON es válido (sin comas extra al final)
2. Asegúrate de que las URLs coinciden con tu dominio de Vercel
3. Revisa los logs de Vercel para más detalles

## 📝 Notas Importantes

- **NEXT_PUBLIC_**: Las variables que empiezan con `NEXT_PUBLIC_` son accesibles en el cliente
- **Seguridad**: No incluyas claves secretas en variables `NEXT_PUBLIC_`
- **Ambientes**: Las variables se aplican según el ambiente seleccionado
- **Cache**: Vercel puede cachear las variables, espera unos minutos para cambios

## 🎯 Resultado Esperado

Después de configurar las variables:
- ✅ App funcionando sin errores
- ✅ Configuración correcta por ambiente
- ✅ Feature flags operativos
- ✅ Base de datos configurada correctamente