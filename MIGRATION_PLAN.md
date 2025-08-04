# Plan de Migración - Eliminar ALTER TABLE Problemático

## Problema Identificado

El error `"cannot ALTER TABLE "app_settings" because it is being used by active queries in this session"` ocurre porque:

1. **Triggers automáticos conflictivos** que intentan modificar RLS durante operaciones
2. **Función de setup problemática** que usa ALTER TABLE dinámicamente
3. **Consultas concurrentes** que mantienen la tabla bloqueada
4. **Diseño deficiente** con múltiples capas de configuración que se solapan

## Solución Propuesta

### 1. Nuevo Esquema de Base de Datos (`database-schema-fixed.sql`)

**Ventajas:**
- ✅ RLS habilitado desde el inicio (no ALTER TABLE necesario)
- ✅ Configuración inicial pre-cargada
- ✅ Políticas de seguridad definidas desde el inicio
- ✅ Funciones helper para actualizar configuración sin ALTER TABLE
- ✅ Estructura más simple y mantenible

**Cambios principales:**
```sql
-- RLS habilitado inmediatamente
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Configuración inicial pre-cargada
INSERT INTO app_settings (environment, survey_table_name, app_name, settings) 
VALUES ('dev', 'pc_survey_data_dev', 'Product Community Survey (DEV)', '...');

-- Función para actualizar sin ALTER TABLE
CREATE OR REPLACE FUNCTION update_app_settings(target_environment TEXT, new_settings JSONB)
```

### 2. Nuevo Endpoint Simplificado (`app/api/setup/save-config-simple/route.ts`)

**Ventajas:**
- ✅ Usa la función `update_app_settings` en lugar de ALTER TABLE
- ✅ No hay conflictos de concurrencia
- ✅ Más simple y confiable
- ✅ Manejo de errores mejorado

### 3. Eliminación de Archivos Problemáticos

**Archivos a eliminar:**
- `create-setup-function.sql` (función problemática con ALTER TABLE)
- `create-automatic-rls-trigger.sql` (trigger conflictivo)
- `enable-rls-after-setup.sql` (ya no necesario)
- `enable-rls-after-wizard.sql` (ya no necesario)
- `fix-wizard-rls-policy-*.sql` (ya no necesario)

## Pasos de Migración

### Paso 1: Aplicar Nuevo Esquema
```bash
# Ejecutar el nuevo esquema en Supabase
psql -h your-supabase-host -U postgres -d postgres -f database-schema-fixed.sql
```

### Paso 2: Actualizar Endpoint
```bash
# Reemplazar el endpoint problemático
mv app/api/setup/save-config/route.ts app/api/setup/save-config/route.ts.backup
cp app/api/setup/save-config-simple/route.ts app/api/setup/save-config/route.ts
```

### Paso 3: Limpiar Archivos Obsoletos
```bash
# Eliminar archivos problemáticos
rm create-setup-function.sql
rm create-automatic-rls-trigger.sql
rm enable-rls-after-setup.sql
rm enable-rls-after-wizard.sql
rm fix-wizard-rls-policy-*.sql
```

### Paso 4: Actualizar Frontend (Opcional)
```typescript
// En app/setup/page.tsx, cambiar la URL del endpoint si es necesario
const response = await fetch('/api/setup/save-config', {
  // ... resto del código igual
})
```

## Verificación

### 1. Verificar Esquema
```sql
-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'app_settings';

-- Verificar configuración inicial
SELECT * FROM app_settings WHERE environment = 'dev';

-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'app_settings';
```

### 2. Probar Setup
1. Ir a `/setup`
2. Ingresar credenciales de Supabase
3. Verificar que se guarda sin errores de ALTER TABLE

### 3. Verificar Funcionalidad
- ✅ Configuración se guarda correctamente
- ✅ No hay errores de ALTER TABLE
- ✅ RLS funciona correctamente
- ✅ Políticas de seguridad aplicadas

## Beneficios de la Nueva Arquitectura

### 1. **Simplicidad**
- Una sola fuente de verdad para la configuración
- Sin triggers automáticos problemáticos
- Sin ALTER TABLE dinámico

### 2. **Confiabilidad**
- No hay conflictos de concurrencia
- Estructura pre-definida y estable
- Manejo de errores mejorado

### 3. **Mantenibilidad**
- Código más simple y fácil de entender
- Menos archivos para mantener
- Documentación clara

### 4. **Seguridad**
- RLS habilitado desde el inicio
- Políticas de seguridad pre-definidas
- Sin bypasses temporales de seguridad

## Rollback Plan

Si algo sale mal:

1. **Restaurar esquema anterior:**
```bash
psql -h your-supabase-host -U postgres -d postgres -f database-schema-productcommunity.sql
```

2. **Restaurar endpoint anterior:**
```bash
mv app/api/setup/save-config/route.ts.backup app/api/setup/save-config/route.ts
```

3. **Restaurar archivos eliminados:**
```bash
git checkout HEAD -- create-setup-function.sql create-automatic-rls-trigger.sql
```

## Conclusión

Esta migración elimina completamente el problema del ALTER TABLE y simplifica significativamente la arquitectura. El nuevo diseño es más robusto, mantenible y seguro.