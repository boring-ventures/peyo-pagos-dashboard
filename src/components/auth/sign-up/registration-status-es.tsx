"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  FileText,
  Shield,
  ArrowRight,
  Home,
  Info,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type RegistrationStatus = 
  | "idle"
  | "submitting"
  | "processing"
  | "completed"
  | "error"
  | "pending_verification"
  | "under_review"
  | "approved"
  | "rejected";

interface BridgeRejectionReason {
  developer_reason?: string;
  reason?: string;
  created_at?: string;
}

interface BridgeEndorsement {
  name: string;
  status: "incomplete" | "approved" | "revoked";
  additional_requirements?: string[];
  requirements?: {
    complete: string[];
    pending: string[];
    missing: string[];
    issues: (string | object)[];
  };
}

interface BridgeResponse {
  id?: string;
  status?: string;
  rejection_reasons?: BridgeRejectionReason[];
  endorsements?: BridgeEndorsement[];
  requirements_due?: string[];
  future_requirements_due?: string[];
  has_accepted_terms_of_service?: boolean;
}

interface RegistrationStatusESProps {
  status: RegistrationStatus;
  customerType: "individual" | "business" | null;
  error?: string | null;
  customerId?: string | null;
  kycStatus?: string | null;
  bridgeResponse?: BridgeResponse | null;
  onRetry?: () => void;
  onReset?: () => void;
  className?: string;
}

export function RegistrationStatusES({
  status,
  customerType,
  error,
  customerId,
  kycStatus,
  bridgeResponse,
  onRetry,
  onReset,
  className,
}: RegistrationStatusESProps) {
  const [progress, setProgress] = useState(0);

  // Animate progress bar for submission states
  useEffect(() => {
    if (status === "submitting") {
      setProgress(25);
      const timer1 = setTimeout(() => setProgress(50), 500);
      const timer2 = setTimeout(() => setProgress(75), 1000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else if (status === "processing") {
      setProgress(90);
    } else if (status === "completed" || status === "approved") {
      setProgress(100);
    } else if (status === "error" || status === "rejected") {
      setProgress(0);
    }
  }, [status]);

  const getStatusConfig = () => {
    const customerTypeText = customerType === "individual" ? "individual" : "empresa";
    
    switch (status) {
      case "submitting":
        return {
          icon: RefreshCw,
          iconColor: "text-blue-500",
          title: "Enviando Solicitud",
          description: "Por favor espera mientras procesamos tu información...",
          showProgress: true,
          variant: "default" as const,
        };
      
      case "processing":
        return {
          icon: Clock,
          iconColor: "text-orange-500",
          title: "Procesando Registro",
          description: "Tu solicitud está siendo revisada por nuestro equipo de cumplimiento.",
          showProgress: true,
          variant: "default" as const,
        };

      case "completed":
      case "approved":
        return {
          icon: CheckCircle2,
          iconColor: "text-green-500",
          title: "¡Registro Exitoso!",
          description: `Tu cuenta ${customerTypeText} ha sido creada y aprobada exitosamente.`,
          showProgress: false,
          variant: "default" as const,
        };

      case "pending_verification":
        return {
          icon: Clock,
          iconColor: "text-yellow-500",
          title: "Verificación Pendiente",
          description: "Podría requerirse verificación adicional. Recibirás un correo con los próximos pasos.",
          showProgress: false,
          variant: "default" as const,
        };

      case "under_review":
        return {
          icon: Shield,
          iconColor: "text-blue-500",
          title: "En Revisión",
          description: `Tu solicitud ${customerTypeText} está siendo revisada. Esto normalmente toma ${customerType === 'business' ? '3-5' : '1-2'} días hábiles.`,
          showProgress: false,
          variant: "default" as const,
        };

      case "rejected":
        return {
          icon: XCircle,
          iconColor: "text-red-500",
          title: "Solicitud Rechazada",
          description: "Tu solicitud no pudo ser aprobada en este momento. Por favor revisa tu información e intenta nuevamente.",
          showProgress: false,
          variant: "destructive" as const,
        };

      case "error":
        return {
          icon: AlertTriangle,
          iconColor: "text-red-500",
          title: "Error en el Registro",
          description: "Hubo un error procesando tu solicitud. Por favor intenta nuevamente.",
          showProgress: false,
          variant: "destructive" as const,
        };

      default:
        return null;
    }
  };

  // Translate requirement keys to Spanish
  const translateRequirement = (req: string): string => {
    const translations: Record<string, string> = {
      'external_account': 'Cuenta Externa',
      'id_verification': 'Verificación de Identidad',
      'kyc_approval': 'Aprobación KYC',
      'tos_acceptance': 'Aceptación de Términos',
      'kyc_with_proof_of_address': 'KYC con Comprobante de Domicilio',
      'tos_v2_acceptance': 'Aceptación de Términos v2',
      'terms_of_service_v1': 'Términos de Servicio v1',
      'terms_of_service_v2': 'Términos de Servicio v2',
      'first_name': 'Nombre',
      'last_name': 'Apellido',
      'tax_identification_number': 'Número de Identificación Fiscal',
      'email_address': 'Dirección de Email',
      'address_of_residence': 'Dirección de Residencia',
      'date_of_birth': 'Fecha de Nacimiento',
      'proof_of_address': 'Comprobante de Domicilio',
      'min_age_18': 'Edad Mínima 18 Años',
      'subdivision_not_ak_usa': 'No Residente de Alaska, USA',
      'subdivision_not_ny_usa': 'No Residente de Nueva York, USA',
      'source_of_funds_questionnaire': 'Cuestionario de Origen de Fondos',
      'sanctions_screen': 'Verificación de Sanciones',
      'pep_screen': 'Verificación PEP',
      'blocklist_lookup': 'Verificación de Lista Negra',
      'adverse_media_screen': 'Verificación de Medios Adversos',
      'government_id_verification': 'Verificación de ID Gubernamental',
      'endorsement_not_available_in_customers_region': 'Endoso no disponible en la región del cliente',
    };
    
    return translations[req] || req.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Translate endorsement names
  const translateEndorsement = (name: string): string => {
    const translations: Record<string, string> = {
      'base': 'Base',
      'sepa': 'SEPA',
      'spei': 'SPEI',
      'cards': 'Tarjetas',
    };
    return translations[name] || name;
  };

  // Translate endorsement status
  const translateEndorsementStatus = (status: string): string => {
    const translations: Record<string, string> = {
      'incomplete': 'Incompleto',
      'approved': 'Aprobado',
      'revoked': 'Revocado',
    };
    return translations[status] || status;
  };

  const statusConfig = getStatusConfig();
  if (!statusConfig) return null;

  const StatusIcon = statusConfig.icon;
  const isSuccess = status === "completed" || status === "approved";
  const isError = status === "error" || status === "rejected";
  const isPending = status === "pending_verification" || status === "under_review";
  const isProcessing = status === "submitting" || status === "processing";

  return (
    <div className={cn("space-y-6", className)}>
      <Card className={cn(
        "text-center",
        isSuccess && "border-green-200 bg-green-50/50",
        isError && "border-red-200 bg-red-50/50",
        isPending && "border-yellow-200 bg-yellow-50/50"
      )}>
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-background border flex items-center justify-center mb-4">
            <StatusIcon className={cn("h-8 w-8", statusConfig.iconColor, isProcessing && "animate-spin")} />
          </div>
          <CardTitle className="text-xl">{statusConfig.title}</CardTitle>
          <CardDescription className="text-base">
            {statusConfig.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {statusConfig.showProgress && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {progress}% completado
              </p>
            </div>
          )}

          {/* Customer ID Display */}
          {customerId && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription className="font-mono text-sm">
                <strong>ID del Cliente:</strong> {customerId}
                <br />
                <span className="text-xs text-muted-foreground">
                  Guarda este ID para tus registros
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Bridge Response Details */}
          {bridgeResponse && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Estado Bridge:</strong> {bridgeResponse.status}
                {bridgeResponse.has_accepted_terms_of_service && (
                  <div className="mt-1 text-xs text-green-600">
                    ✓ Términos de servicio aceptados
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* KYC Status */}
          {kycStatus && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Estado de Verificación:</strong> {kycStatus.replace(/_/g, ' ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Bridge Rejection Reasons */}
          {bridgeResponse?.rejection_reasons && bridgeResponse.rejection_reasons.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-left">
                <strong>Motivos de Rechazo:</strong>
                <div className="mt-2 space-y-2">
                  {bridgeResponse.rejection_reasons.map((reason, index) => (
                    <div key={index} className="p-2 bg-red-50 rounded border border-red-200">
                      {reason.reason && (
                        <p className="font-medium text-red-800">{reason.reason}</p>
                      )}
                      {reason.developer_reason && (
                        <p className="text-sm text-red-600 mt-1">{reason.developer_reason}</p>
                      )}
                      {reason.created_at && (
                        <p className="text-xs text-red-500 mt-1">
                          Fecha: {new Date(reason.created_at).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Requirements Due */}
          {bridgeResponse?.requirements_due && bridgeResponse.requirements_due.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-left">
                <strong>Requisitos Pendientes:</strong>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  {bridgeResponse.requirements_due.map((req, index) => (
                    <li key={index}>{translateRequirement(req)}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Future Requirements */}
          {bridgeResponse?.future_requirements_due && bridgeResponse.future_requirements_due.length > 0 && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription className="text-left">
                <strong>Requisitos Futuros:</strong>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  {bridgeResponse.future_requirements_due.map((req, index) => (
                    <li key={index}>{translateRequirement(req)}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Endorsements Status */}
          {bridgeResponse?.endorsements && bridgeResponse.endorsements.length > 0 && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-left">
                <strong>Estado de Endosos:</strong>
                <div className="mt-2 space-y-3">
                  {bridgeResponse.endorsements.map((endorsement, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{translateEndorsement(endorsement.name)}</span>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          endorsement.status === "approved" && "bg-green-100 text-green-800",
                          endorsement.status === "incomplete" && "bg-yellow-100 text-yellow-800",
                          endorsement.status === "revoked" && "bg-red-100 text-red-800"
                        )}>
                          {translateEndorsementStatus(endorsement.status)}
                        </span>
                      </div>
                      
                      {endorsement.requirements && (
                        <div className="space-y-2 text-sm">
                          {endorsement.requirements.complete.length > 0 && (
                            <div>
                              <p className="font-medium text-green-700">✓ Completados:</p>
                              <ul className="ml-4 text-green-600">
                                {endorsement.requirements.complete.map((req, i) => (
                                  <li key={i}>• {translateRequirement(req)}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {endorsement.requirements.pending.length > 0 && (
                            <div>
                              <p className="font-medium text-yellow-700">⏳ Pendientes:</p>
                              <ul className="ml-4 text-yellow-600">
                                {endorsement.requirements.pending.map((req, i) => (
                                  <li key={i}>• {translateRequirement(req)}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {endorsement.requirements.issues.length > 0 && (
                            <div>
                              <p className="font-medium text-red-700">❌ Problemas:</p>
                              <ul className="ml-4 text-red-600">
                                {endorsement.requirements.issues.map((issue, i) => (
                                  <li key={i}>
                                    • {typeof issue === 'string' ? translateRequirement(issue) : JSON.stringify(issue)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {endorsement.additional_requirements && endorsement.additional_requirements.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium text-orange-700 text-sm">Requisitos Adicionales:</p>
                          <ul className="ml-4 text-orange-600 text-sm">
                            {endorsement.additional_requirements.map((req, i) => (
                              <li key={i}>• {translateRequirement(req)}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Details */}
          {isError && error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-left">
                <strong>Detalles del Error:</strong><br />
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Next Steps */}
          {isPending && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription className="text-left">
                <strong>Próximos pasos:</strong>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  <li>Nuestro equipo de cumplimiento revisará tu solicitud</li>
                  <li>Recibirás actualizaciones por correo sobre el estado de tu solicitud</li>
                  <li>Podrían solicitarse documentos adicionales si es necesario</li>
                  <li>Serás notificado una vez que tu cuenta sea aprobada</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {isSuccess && (
          <>
            <Button asChild size="lg">
              <Link href="/dashboard">
                Ir al Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Volver al Inicio
              </Link>
            </Button>
          </>
        )}

        {isError && (
          <>
            {onRetry && (
              <Button onClick={onRetry} size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                Intentar Nuevamente
              </Button>
            )}
            {onReset && (
              <Button variant="outline" onClick={onReset} size="lg">
                Empezar de Nuevo
              </Button>
            )}
            <Button variant="ghost" size="lg" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Volver al Inicio
              </Link>
            </Button>
          </>
        )}

        {isPending && (
          <Button variant="outline" size="lg" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Link>
          </Button>
        )}

        {isProcessing && (
          <p className="text-sm text-muted-foreground text-center">
            Por favor no cierres esta página mientras procesamos tu solicitud.
          </p>
        )}
      </div>
    </div>
  );
}