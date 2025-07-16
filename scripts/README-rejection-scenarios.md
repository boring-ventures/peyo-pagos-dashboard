# KYC Rejection Scenarios Seeder

Este script simula diferentes escenarios de rechazo y casos edge del protocolo Bridge para testing completo del dashboard KYC.

## 🎯 Propósito

Mientras que Bridge Protocol sandbox siempre acepta las solicitudes KYC, este script genera datos de prueba que simulan respuestas realistas incluyendo todos los casos de rechazo posibles.

## 🎭 Escenarios Incluidos

### ❌ Casos de Rechazo

1. **`identity_verification_failed`**

   - Documentos de identidad no verificables
   - Calidad insuficiente de imágenes
   - Multiple rejection reasons

2. **`high_risk_country`**

   - Restricciones geográficas
   - Países de alto riesgo (ej: Rusia)
   - Regulaciones internacionales

3. **`sanctions_screening_failed`**

   - Aparece en listas de sanciones
   - PEP (Politically Exposed Person) detectado
   - Screening automático fallido

4. **`document_expiration`**
   - Documentos de identidad expirados
   - Requiere renovación
   - Fechas de expiración en el pasado

### ⏸️ Estados Intermedios

5. **`awaiting_additional_info`**

   - Esperando documentación adicional
   - Proof of income, source of funds
   - Enhanced due diligence questionnaire

6. **`incomplete_application`**

   - Aplicación sin completar
   - Falta verificación telefónica
   - Terms of service no aceptados

7. **`under_review_enhanced`**

   - Revisión mejorada en curso
   - Due diligence avanzado
   - Sin rejection reasons

8. **`paused_compliance`**
   - Cuenta pausada temporalmente
   - Revisión de compliance
   - Patrones de transacción inusuales

### ✅ Caso Exitoso

9. **`active_approved`**
   - Completamente aprobado y activo
   - Todas las capabilities habilitadas
   - Para comparación con casos rechazados

## 📊 Datos Generados

Cada escenario crea:

- **Profile base** con información básica
- **KYCProfile** con status específico al escenario
- **Address** con ubicación geográfica relevante
- **IdentifyingInformation** con documentos (algunos expirados)
- **Documents** con comprobantes de domicilio
- **RejectionReasons** múltiples cuando aplica
- **Imágenes** subidas a Supabase Storage

## 🚀 Uso

```bash
# Ejecutar el script directamente
npx tsx scripts/seed-kyc-rejection-scenarios.ts

# O desde npm si está agregado
npm run seed:rejection-scenarios
```

## 📋 Requisitos

- Variables de entorno configuradas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_KEY` (opcional, para subir imágenes reales)
  - `DATABASE_URL`

## 🗄️ Storage

- Crea carpeta `kyc-rejection-scenarios/` en Supabase Storage
- Organiza imágenes por profile ID y tipo de documento
- Genera URLs válidas incluso sin service key

## 📈 Output Esperado

```
🚀 Iniciando seeder de ESCENARIOS DE RECHAZO KYC...

🎭 Escenario: identity_verification_failed
👤 Creando perfil: Roberto Vargas
📝 Documentos de identidad no verificables - calidad insuficiente
✅ Respuesta Bridge simulada: status=rejected
✅ Perfil base creado: cm4abc123...
✅ Perfil KYC creado: cm4def456...
✅ 2 razón(es) de rechazo creadas
🎉 identity_verification_failed: Roberto Vargas creado exitosamente

[... más escenarios ...]

✨ Seeder de ESCENARIOS DE RECHAZO completado!
📊 Total de perfiles creados: 9

📈 Estadísticas por escenario:
   🎭 identity_verification_failed: 1 - Documentos de identidad no verificables
   🎭 high_risk_country: 1 - Restricciones geográficas
   🎭 sanctions_screening_failed: 1 - Falla en verificación de sanciones
   [... etc ...]

🎯 ESCENARIOS CUBIERTOS:
   ❌ Verificación de identidad fallida
   🌍 Restricciones geográficas
   🚫 Falla en verificación de sanciones
   📋 Esperando información adicional
   📝 Aplicación incompleta
   🔍 Revisión mejorada en curso
   ⏸️  Cuenta pausada por cumplimiento
   📄 Documentos expirados
   ✅ Caso exitoso aprobado

💡 Estos datos permiten probar todos los flujos de rechazo del dashboard KYC.
```

## 🧪 Testing

Después de ejecutar el script, puedes:

1. **Login como superadmin** en el dashboard
2. **Navegar a /kyc** para ver todos los perfiles
3. **Filtrar por status** para ver casos específicos:

   - `rejected` - Casos rechazados
   - `under_review` - En revisión
   - `incomplete` - Incompletos
   - `awaiting_questionnaire` - Esperando info
   - `paused` - Pausados
   - `active` - Aprobados

4. **Click en perfiles individuales** para ver:
   - Rejection reasons detalladas
   - Requirements due/future requirements
   - Capabilities status
   - Documentos y timestamps

## 🔄 Diferencias con el Seeder Principal

| Aspecto               | `seed-kyc-data.ts`               | `seed-kyc-rejection-scenarios.ts` |
| --------------------- | -------------------------------- | --------------------------------- |
| **Propósito**         | Casos realistas normales         | Casos edge y rechazos             |
| **Bridge API**        | Llamadas reales (cuando posible) | Simulación completa               |
| **Escenarios**        | Mayormente exitosos              | Enfoque en rechazos               |
| **Países**            | Principalmente México            | Global (incluyendo restringidos)  |
| **Documentos**        | Válidos                          | Algunos expirados                 |
| **Rejection Reasons** | Pocos                            | Múltiples y detallados            |

## 🎯 Casos de Uso

- **QA Testing**: Verificar manejo de todos los estados de rechazo
- **UI Testing**: Probar componentes con diferentes estados
- **Flow Testing**: Validar navegación en casos edge
- **Error Handling**: Verificar mensajes de error apropiados
- **Documentation**: Screenshots y ejemplos para docs

## 📝 Notas

- Los emails incluyen timestamp para evitar duplicados
- Cada escenario tiene datos únicos y realistas
- Compatible con el sistema existente de Bridge Protocol
- Todas las respuestas simulan formato real de Bridge API
