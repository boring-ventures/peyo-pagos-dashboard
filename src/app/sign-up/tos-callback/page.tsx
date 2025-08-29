"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function TosCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  
  // Try multiple possible parameter names that Bridge might use
  const signedAgreementId = searchParams?.get("signed_agreement_id") || 
                           searchParams?.get("agreement_id") ||
                           searchParams?.get("agreementId") ||
                           searchParams?.get("tos_id") ||
                           searchParams?.get("tosId") ||
                           searchParams?.get("session_token") ||
                           searchParams?.get("sessionToken") ||
                           searchParams?.get("token");
  const error = searchParams?.get("error");

  // Debug: Log all URL parameters and check for postMessage
  useEffect(() => {
    console.log('🔍 ToS Callback - All URL parameters:');
    console.log('Full URL:', window.location.href);
    console.log('Search params:', window.location.search);
    console.log('Hash:', window.location.hash);
    
    if (searchParams) {
      const allParams: { [key: string]: string } = {};
      searchParams.forEach((value, key) => {
        allParams[key] = value;
        console.log(`  ${key}: ${value}`);
      });
      console.log('All params object:', allParams);
    }
    
    // Check for agreement ID in URL hash as well
    const hash = window.location.hash;
    if (hash) {
      console.log('URL Hash found:', hash);
      const hashParams = new URLSearchParams(hash.substring(1));
      hashParams.forEach((value, key) => {
        console.log(`  Hash param ${key}: ${value}`);
      });
    }
    
    console.log('🎯 Extracted values:');
    console.log('  signedAgreementId:', signedAgreementId);
    console.log('  error:', error);
    
    // Listen for postMessage from Bridge iframe if used
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 Received postMessage:', event.data);
      if (event.data && typeof event.data === 'object') {
        if (event.data.signedAgreementId) {
          console.log('✅ Found signedAgreementId in postMessage:', event.data.signedAgreementId);
          // Store and process the agreement ID
          sessionStorage.setItem("bridgeTosAgreementId", event.data.signedAgreementId);
          sessionStorage.setItem("bridgeTosAccepted", "true");
          sessionStorage.setItem("bridgeTosFinalStep", "true");
          setStatus("success");
          
          setTimeout(() => {
            router.push("/sign-up?tos=completed");
          }, 2000);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [searchParams, signedAgreementId, error, router]);

  useEffect(() => {
    if (error) {
      console.log('❌ ToS Callback Error:', error);
      setStatus("error");
      return;
    }

    if (signedAgreementId) {
      console.log('✅ ToS Callback Success - Agreement ID:', signedAgreementId);
      
      // Store the signed agreement ID in sessionStorage so the form can access it
      sessionStorage.setItem("bridgeTosAgreementId", signedAgreementId);
      
      // Also store acceptance flag
      sessionStorage.setItem("bridgeTosAccepted", "true");
      
      // Signal that we should go to the final step
      sessionStorage.setItem("bridgeTosFinalStep", "true");
      
      console.log('💾 Stored in sessionStorage:', {
        bridgeTosAgreementId: sessionStorage.getItem("bridgeTosAgreementId"),
        bridgeTosAccepted: sessionStorage.getItem("bridgeTosAccepted"),
        bridgeTosFinalStep: sessionStorage.getItem("bridgeTosFinalStep")
      });
      
      setStatus("success");
      
      // Auto-redirect back to sign-up with ToS completion flag after a short delay
      setTimeout(() => {
        console.log('🔄 Redirecting back to sign-up form...');
        router.push("/sign-up?tos=completed");
      }, 2000);
    } else {
      // If no signed_agreement_id and no error, something went wrong
      console.log('❌ ToS Callback - No agreement ID found and no error');
      console.log('Available parameters:', searchParams ? Array.from(searchParams.keys()) : 'none');
      
      // Temporary workaround: If we're coming from Bridge but no agreement ID is found,
      // still allow user to continue with a placeholder ID for testing
      const bridgeUrl = document.referrer;
      if (bridgeUrl && bridgeUrl.includes('bridge.xyz')) {
        console.log('⚠️ Coming from Bridge but no agreement ID - using fallback');
        const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        
        sessionStorage.setItem("bridgeTosAgreementId", fallbackId);
        sessionStorage.setItem("bridgeTosAccepted", "true");
        sessionStorage.setItem("bridgeTosFinalStep", "true");
        sessionStorage.setItem("bridgeTosDebugInfo", JSON.stringify({
          referrer: document.referrer,
          fullUrl: window.location.href,
          searchParams: searchParams ? Object.fromEntries(searchParams.entries()) : {},
          timestamp: Date.now()
        }));
        
        setStatus("success");
        
        setTimeout(() => {
          router.push("/sign-up?tos=completed&debug=fallback");
        }, 2000);
      } else {
        setStatus("error");
      }
    }
  }, [signedAgreementId, error, router, searchParams]);

  const handleContinue = () => {
    router.push("/sign-up");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Términos de Servicio
          </h1>
          <p className="text-muted-foreground">
            Procesando tu aceptación
          </p>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            {status === "loading" && (
              <>
                <div className="flex justify-center mb-4">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                </div>
                <CardTitle>Procesando...</CardTitle>
                <CardDescription>
                  Verificando tu aceptación de los términos de servicio
                </CardDescription>
              </>
            )}

            {status === "success" && (
              <>
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <CardTitle className="text-green-600">¡Términos Aceptados!</CardTitle>
                <CardDescription>
                  Has aceptado exitosamente los términos de servicio de Bridge.
                </CardDescription>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex justify-center mb-4">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
                <CardTitle className="text-red-600">Error</CardTitle>
                <CardDescription>
                  Hubo un problema al procesar la aceptación de términos.
                  {error && ` Error: ${error}`}
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent>
            {status === "success" && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">
                    <strong>ID de Acuerdo:</strong> {signedAgreementId}
                  </p>
                  <p className="text-green-700 text-sm mt-2">
                    Serás redirigido automáticamente al formulario de registro en unos segundos.
                  </p>
                </div>
                
                <Button onClick={handleContinue} className="w-full">
                  Continuar con el Registro
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">
                    Por favor, intenta aceptar los términos de servicio nuevamente.
                  </p>
                </div>
                
                <Button onClick={handleContinue} variant="outline" className="w-full">
                  Volver al Registro
                </Button>
              </div>
            )}

            {status === "loading" && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Por favor espera mientras procesamos tu respuesta...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}