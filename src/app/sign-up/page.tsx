"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Components
import { AuthStep } from "@/components/auth/sign-up/auth-step";
import { CustomerTypeSelector } from "@/components/auth/sign-up/customer-type-selector";
import { IndividualRegistrationForm } from "@/components/auth/sign-up/individual-registration-form";
import { BusinessRegistrationForm } from "@/components/auth/sign-up/business-registration-form";
import { RegistrationProgress } from "@/components/auth/sign-up/registration-progress";
import { RegistrationStatusES } from "@/components/auth/sign-up/registration-status-es";

// Types
import type { CustomerRegistrationData, RegistrationResponse } from "@/types/customer";

type Step = 
  | "auth"
  | "customer-type"
  | "registration-form"
  | "status";

type RegistrationState = 
  | "idle"
  | "submitting"
  | "processing"
  | "completed"
  | "error"
  | "pending_verification"
  | "under_review"
  | "approved"
  | "rejected";

const STEPS = [
  {
    id: "auth",
    title: "Crear Cuenta",
    description: "Email y contraseña",
  },
  {
    id: "customer-type",
    title: "Tipo de Cuenta",
    description: "Elige individual o empresa",
  },
  {
    id: "registration-form",
    title: "Registro",
    description: "Completa tu información",
  },
  {
    id: "status",
    title: "Verificación",
    description: "Revisar y enviar",
  },
];

function SignUpPageContent() {
  const searchParams = useSearchParams();
  const registrationCompleteStatus = searchParams?.get("status");
  const tosCompleted = searchParams?.get("tos");

  // State management
  const [currentStep, setCurrentStep] = useState<Step>("auth");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [customerType, setCustomerType] = useState<"individual" | "business" | null>(null);
  const [registrationData, setRegistrationData] = useState<CustomerRegistrationData | null>(null);
  const [registrationState, setRegistrationState] = useState<RegistrationState>("idle");
  const [registrationResponse, setRegistrationResponse] = useState<RegistrationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authData, setAuthData] = useState<{ email: string; password: string; supabaseUser: unknown } | null>(null);

  // Auto-save registration progress to localStorage
  useEffect(() => {
    // Save progress if we're past the auth step or have registration data
    if (completedSteps.includes("auth") || registrationData) {
      try {
        localStorage.setItem('sign-up-draft', JSON.stringify({
          customerType,
          registrationData,
          currentStep,
          completedSteps,
          authData,
          timestamp: Date.now(),
        }));
      } catch (error) {
        console.warn('Failed to save registration draft:', error);
      }
    }
  }, [registrationData, customerType, currentStep, completedSteps, authData]);

  // Load saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sign-up-draft');
      if (saved) {
        const draft = JSON.parse(saved);
        const isRecent = Date.now() - draft.timestamp < 24 * 60 * 60 * 1000; // 24 hours
        
        if (isRecent && draft.completedSteps && draft.completedSteps.includes("auth")) {
          // Restore auth data if available
          if (draft.authData) {
            setAuthData(draft.authData);
          }
          
          // Restore customer type and registration data if available
          if (draft.customerType) {
            setCustomerType(draft.customerType);
          }
          
          if (draft.registrationData) {
            setRegistrationData(draft.registrationData);
          }
          
          // Restore current step and completed steps
          setCurrentStep(draft.currentStep || "customer-type");
          setCompletedSteps(draft.completedSteps || ["auth"]);
          
          toast({
            title: "Sesión Restaurada",
            description: "Tu progreso de registro ha sido restaurado.",
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load registration draft:', error);
    }
  }, []);

  // Handle ToS completion from callback
  useEffect(() => {
    if (tosCompleted === "completed") {
      toast({
        title: "Términos Aceptados",
        description: "Has aceptado exitosamente los términos de servicio de Bridge. Puedes continuar con el registro.",
        duration: 5000,
      });

      // Remove the tos parameter from URL to clean it up
      const url = new URL(window.location.href);
      url.searchParams.delete("tos");
      window.history.replaceState({}, document.title, url.toString());
    }
  }, [tosCompleted]);

  const handleAuthComplete = (data: { email: string; password: string; supabaseUser: unknown }) => {
    setAuthData(data);
    setCurrentStep("customer-type");
    setCompletedSteps(["auth"]);
  };

  const handleCustomerTypeSelect = (type: "individual" | "business") => {
    setCustomerType(type);
    setCompletedSteps(["auth", "customer-type"]);
    setCurrentStep("registration-form");
  };

  const handleRegistrationComplete = async (data: CustomerRegistrationData, files?: Map<string, File>) => {
    setRegistrationData(data);
    setCurrentStep("status");
    setRegistrationState("submitting");
    
    try {
      // Clean the data to remove File objects and fix structure for API
      const cleanedData = {
        ...data,
        // Remove File objects from identifyingInformation - they'll be sent separately
        identifyingInformation: data.identifyingInformation?.map(doc => ({
          ...doc,
          imageFront: undefined, // Remove File object
          imageBack: undefined,  // Remove File object
        })) || [],
        // Ensure documents array has proper structure
        documents: data.documents?.map(doc => ({
          ...doc,
          file: undefined, // Remove File object
          purposes: doc.purposes || ["other"], // Ensure purposes is not undefined
        })) || [],
      };

      console.log("🧹 Cleaned data for API:", cleanedData);
      
      // Prepare form data for submission
      const formData = new FormData();
      formData.append('data', JSON.stringify(cleanedData));
      
      // Add files if present - use proper field names that match schema
      if (files) {
        for (const [documentType, fileArray] of files.entries()) {
          if (Array.isArray(fileArray)) {
            fileArray.forEach((file, index) => {
              if (file instanceof File) {
                console.log(`📎 Adding file: ${documentType}_${index}`, file.name);
                formData.append(`${documentType}_${index}`, file);
              }
            });
          } else if (files instanceof File) {
            // Handle single file case
            console.log(`📎 Adding single file: ${documentType}`, files.name);
            formData.append(`${documentType}_0`, files);
          }
        }
      }
      
      // Debug: Log what we're sending
      console.log("📦 FormData contents:");
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${typeof value} (${String(value).substring(0, 100)}...)`);
        }
      }

      console.log("📤 Submitting registration...", {
        customerType: data.customerType,
        email: data.email,
        hasFiles: files ? files.size : 0,
      });

      const response = await fetch('/api/customers', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        if (result.details && Array.isArray(result.details)) {
          errorMessage = `Validation failed: ${result.details.map((d: { field: string; message: string }) => `${d.field}: ${d.message}`).join(', ')}`;
        } else if (result.error) {
          errorMessage = result.error;
        }
        throw new Error(errorMessage);
      }

      console.log("✅ Registration successful:", result);
      
      setRegistrationResponse(result);
      setRegistrationState(result.kycStatus === 'approved' ? 'approved' : 'pending_verification');
      setCompletedSteps(["auth", "customer-type", "registration-form", "status"]);
      
      // Clear draft on successful submission
      localStorage.removeItem('sign-up-draft');
      
      toast({
        title: "¡Registro Exitoso!",
        description: "Tu cuenta ha sido creada y está siendo procesada.",
      });

    } catch (error) {
      console.error("❌ Registration failed:", error);
      setError(error instanceof Error ? error.message : 'Registration failed');
      setRegistrationState("error");
      
      toast({
        title: "Registro Fallido",
        description: error instanceof Error ? error.message : 'Por favor intenta de nuevo',
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    if (currentStep === "customer-type") {
      setCurrentStep("auth");
      setCompletedSteps([]);
    } else if (currentStep === "registration-form") {
      setCurrentStep("customer-type");
      setCompletedSteps(["auth"]);
    } else if (currentStep === "status" && registrationState === "error") {
      setCurrentStep("registration-form");
      setRegistrationState("idle");
      setError(null);
    }
  };

  const handleRetry = () => {
    if (registrationData) {
      handleRegistrationComplete(registrationData);
    }
  };

  const handleReset = () => {
    setCurrentStep("customer-type");
    setCompletedSteps([]);
    setCustomerType(null);
    setRegistrationData(null);
    setRegistrationState("idle");
    setRegistrationResponse(null);
    setError(null);
    localStorage.removeItem('sign-up-draft');
  };

  const showBackButton = currentStep !== "auth" && 
    !(currentStep === "status" && (registrationState === "completed" || registrationState === "approved"));

  // Handle registration complete status from middleware
  if (registrationCompleteStatus === "registration-complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              ¡Registro Completo!
            </h1>
            <p className="text-muted-foreground">
              Tu registro ha sido completado exitosamente
            </p>
          </div>

          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-green-600">✅ Verificación Completa</CardTitle>
              <CardDescription>
                Tu cuenta ha sido verificada y tu proceso KYC ha sido completado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">¿Qué sigue?</h3>
                <p className="text-green-700 text-sm">
                  Tu cuenta está lista para usar. En el futuro tendrás acceso a tu dashboard personalizado 
                  para gestionar tus pagos y transacciones.
                </p>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  El dashboard para usuarios estará disponible próximamente.
                </p>
                
                <div className="flex justify-center">
                  <Link href="/sign-in">
                    <Button>
                      Regresar al Inicio
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Crea tu Cuenta
          </h1>
          <p className="text-muted-foreground">
            Únete a nuestra plataforma y completa tu proceso de verificación
          </p>
        </div>

        {/* Progress Indicator */}
        {currentStep !== "status" || registrationState === "error" ? (
          <RegistrationProgress
            steps={STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            className="mb-8"
          />
        ) : null}

        {/* Main Content */}
        <Card className="w-full">
          <CardHeader className={showBackButton ? "pb-4" : "pb-6"}>
            {showBackButton && (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="self-start mb-4"
                disabled={registrationState === "submitting" || registrationState === "processing"}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
            )}
            
            {currentStep !== "status" && (
              <>
                <CardTitle className="text-xl">
                  {currentStep === "auth" && "Crear tu Cuenta"}
                  {currentStep === "customer-type" && "Elige tu Tipo de Cuenta"}
                  {currentStep === "registration-form" && `Registro ${customerType === 'individual' ? 'Individual' : 'Empresarial'}`}
                </CardTitle>
                <CardDescription>
                  {currentStep === "auth" && "Ingresa tu email y crea una contraseña segura"}
                  {currentStep === "customer-type" && "Selecciona si te estás registrando como individuo o empresa"}
                  {currentStep === "registration-form" && "Completa tu información y sube los documentos requeridos"}
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent>
            {/* Step Content */}
            {currentStep === "auth" && (
              <AuthStep onComplete={handleAuthComplete} />
            )}

            {currentStep === "customer-type" && (
              <CustomerTypeSelector 
                onContinue={handleCustomerTypeSelect}
                defaultValue={customerType || undefined}
              />
            )}

            {currentStep === "registration-form" && customerType === "individual" && (
              <IndividualRegistrationForm
                onBack={handleBack}
                onComplete={handleRegistrationComplete}
                initialData={registrationData?.customerType === 'individual' ? registrationData : undefined}
              />
            )}

            {currentStep === "registration-form" && customerType === "business" && (
              <BusinessRegistrationForm
                onBack={handleBack}
                onComplete={handleRegistrationComplete}
                initialData={registrationData?.customerType === 'business' ? registrationData : undefined}
              />
            )}

            {currentStep === "status" && (
              <RegistrationStatusES
                status={registrationState}
                customerType={customerType}
                error={error}
                customerId={registrationResponse?.customerId}
                kycStatus={registrationResponse?.kycStatus}
                bridgeResponse={null}
                onRetry={handleRetry}
                onReset={handleReset}
              />
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-4">
          <div className="text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Button variant="link" className="p-0 h-auto text-sm font-medium" asChild>
              <Link href="/sign-in">Iniciar Sesión</Link>
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>
              Al continuar, aceptas nuestros{" "}
              <Button variant="link" className="p-0 h-auto text-sm">
                Términos de Servicio
              </Button>
              {" "}y{" "}
              <Button variant="link" className="p-0 h-auto text-sm">
                Política de Privacidad
              </Button>
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground">
¿Necesitas ayuda? Contacta nuestro{" "}
            <Button variant="link" className="p-0 h-auto text-xs">
              equipo de soporte
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center space-y-2">
        <FileText className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading sign up form...</p>
      </div>
    </div>}>
      <SignUpPageContent />
    </Suspense>
  );
}