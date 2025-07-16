# Scripts de Datos de Prueba KYC

Este directorio contiene scripts para generar y limpiar datos de prueba para el sistema KYC.

## 📋 Descripción

- **`seed-kyc-data.ts`**: Genera datos de prueba KYC completos (solo en base de datos local)
- **`clean-kyc-data.ts`**: Limpia todos los datos de prueba generados
- **`check-setup.ts`**: Verifica que la configuración esté correcta

## 🚀 Configuración Inicial

### 1. Variables de Entorno

Asegúrate de tener las siguientes variables en tu archivo `.env.local`:

```bash
# Variables de Supabase (las mismas que usa tu aplicación)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

⚠️ **NOTA**: Los scripts funcionan solo con tu anon key y crean datos únicamente en la base de datos local (no usuarios reales en Supabase Auth).

### 2. Permisos de Usuario

Los scripts requieren que tengas un usuario **SUPERADMIN** en el sistema para poder revisar los datos KYC generados.

## 🎯 Uso de los Scripts

### Generar Datos de Prueba

```bash
# Genera 7 usuarios de prueba con diferentes estados KYC
npm run seed:kyc
```

Este script creará:

- 7 perfiles de prueba en la base de datos local
- 7 perfiles KYC completos con:
  - Información personal
  - Direcciones
  - Documentos de identificación
  - Documentos adicionales
  - Diferentes estados de verificación
- IDs de usuario ficticios (no usuarios reales en Supabase Auth)

### Limpiar Datos de Prueba

```bash
# Elimina todos los datos de prueba generados
npm run clean:kyc
```

Este script:

- Muestra una advertencia y pausa 5 segundos
- Elimina todos los datos de prueba de la base de datos local
- Busca y limpia datos huérfanos
- NO afecta usuarios reales en Supabase Auth

## 👥 Usuarios de Prueba Generados

El seeder crea los siguientes usuarios:

| Email                             | Nombre           | Estado KYC             | Verificación Bridge |
| --------------------------------- | ---------------- | ---------------------- | ------------------- |
| maria.gonzalez.test@example.com   | María González   | under_review           | pending             |
| carlos.rodriguez.test@example.com | Carlos Rodríguez | awaiting_questionnaire | not_started         |
| ana.martinez.test@example.com     | Ana Martínez     | rejected               | rejected            |
| luis.fernandez.test@example.com   | Luis Fernández   | incomplete             | under_review        |
| sofia.lopez.test@example.com      | Sofía López      | active                 | approved            |
| diego.morales.test@example.com    | Diego Morales    | awaiting_ubo           | pending             |
| patricia.herrera.test@example.com | Patricia Herrera | paused                 | under_review        |

**NOTA**: Estos son datos de prueba locales (no usuarios reales para login)

## 🔍 Datos Incluidos

Cada usuario de prueba incluye:

### Información Personal

- Nombre completo (primer nombre, segundo nombre, apellido)
- Email único de prueba
- Teléfono con formato mexicano
- Fecha de nacimiento (todos mayores de 18 años)
- Nacionalidad mexicana

### Información Laboral

- Estado de empleo variado
- Propósito de cuenta específico
- Expectativas de pagos mensuales
- Ocupación más reciente

### Información de Ubicación

- Direcciones completas mexicanas
- Códigos postales válidos
- Subdivisiones de estado correctas

### Documentos

- Información de identificación (INE)
- Documentos de comprobante de domicilio
- Números de documento únicos

### Estados KYC Variados

- Usuarios en revisión
- Usuarios aprobados
- Usuarios rechazados (con razones)
- Usuarios pendientes de documentación

## 🛡️ Seguridad

- Los scripts solo crean datos en la base de datos local (NO en Supabase Auth)
- Solo afectan perfiles con emails que terminan en `.test@example.com`
- El script de limpieza muestra advertencias antes de ejecutar
- Se incluye validación de variables de entorno
- Los datos son claramente marcados como de prueba
- No se requiere service_role key, solo anon key

## 🐛 Resolución de Problemas

### Error: Variables de entorno faltantes

```bash
❌ Falta variable de entorno necesaria:
- NEXT_PUBLIC_SUPABASE_URL
```

**Solución**: Verifica que tienes la variable en `.env`

### Error: Perfil ya existe

```bash
⚠️ Perfil con email maria.gonzalez.test@example.com ya existe, omitiendo...
```

**Solución**: Normal, el script omite perfiles que ya existen



### Error de conexión a base de datos

**Solución**: Asegúrate de que tu base de datos esté corriendo y las URLs sean correctas

## 📊 Verificación

Después de ejecutar el seeder:

1. **Dashboard KYC**: Ve a `/kyc` como super admin para ver los usuarios
2. **Filtros**: Prueba filtrar por diferentes estados
3. **Detalles**: Haz clic en usuarios para ver información completa
4. **Estadísticas**: Verifica que las estadísticas reflejen los nuevos datos

## 🔧 Desarrollo

### Agregar Nuevos Usuarios de Prueba

Edita el array `SAMPLE_USERS` en `seed-kyc-data.ts`:

```typescript
{
  email: 'nuevo.usuario.test@example.com',
  password: 'TestPassword123!',
  firstName: 'Nuevo',
  lastName: 'Usuario',
  // ... más datos
}
```

### Modificar Estados KYC

Cambia los valores de `kycStatus` y `bridgeVerificationStatus` en los datos de usuario para probar diferentes escenarios.

### Agregar Más Datos

Extiende los scripts para incluir:

- Más documentos por usuario
- Diferentes tipos de identificación
- Información adicional de UBO
- Endorsements específicos

## ⚠️ Notas Importantes

1. **Solo para desarrollo**: Estos scripts son únicamente para entornos de desarrollo
2. **No usar en producción**: Los datos generados son claramente marcados como de prueba
3. **Limpieza regular**: Ejecuta el script de limpieza regularmente para mantener la base de datos ordenada
4. **Backups**: Siempre haz backup antes de ejecutar scripts de limpieza masiva
