import { getUserForMiddleware } from "@/lib/utils/middleware-cache";
import { performanceMonitor } from "@/lib/utils/performance-monitor";

export async function testOptimizations() {
  console.log("🧪 Iniciando test de optimizaciones...");
  
  const testUserId = "test-user-id"; // Usar un ID real de testing
  const iterations = 100;
  
  // Reset estadísticas
  performanceMonitor.reset();
  
  // Test de cache hits
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    await getUserForMiddleware(testUserId);
    const responseTime = Date.now() - startTime;
    
    performanceMonitor.logRequest("middleware", testUserId, true, responseTime);
  }
  
  // Generar reporte
  const report = performanceMonitor.generateReport();
  console.log(report);
  
  // Validar que hit ratio > 80%
  const validation = performanceMonitor.validateOptimizations();
  
  if (validation.isOptimized) {
    console.log("✅ Optimizaciones funcionando correctamente");
  } else {
    console.log("⚠️ Problemas detectados:", validation.issues);
  }
  
  return validation;
}

// Para ejecutar en consola del browser:
// testOptimizations(); 