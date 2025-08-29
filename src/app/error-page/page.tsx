"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft, 
  Home, 
  FileText,
  Shield,
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ErrorType = 
  | "registration"
  | "verification"
  | "email-verification" 
  | "account-access"
  | "kyc-rejected"
  | "server-error"
  | "validation"
  | "authentication"
  | "general";

interface ErrorConfig {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  variant: "destructive" | "default";
  primaryAction?: {
    label: string;
    href?: string;
    action?: () => void;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  showRetry?: boolean;
  additionalInfo?: string;
  supportInfo?: string;
}

const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  registration: {
    icon: XCircle,
    title: "Registration Failed",
    description: "We couldn't complete your registration. Please check your information and try again.",
    variant: "destructive",
    primaryAction: {
      label: "Try Again",
      href: "/sign-up",
    },
    secondaryAction: {
      label: "Back to Home",
      href: "/",
    },
    showRetry: true,
    supportInfo: "If the problem persists, please contact our support team with any error details.",
  },
  verification: {
    icon: AlertTriangle,
    title: "Verification Failed",
    description: "We couldn't verify your identity at this time. Please review your documents and try again.",
    variant: "destructive",
    primaryAction: {
      label: "Review Documents",
      href: "/sign-up",
    },
    additionalInfo: "Common issues include blurry images, expired documents, or mismatched information.",
    supportInfo: "Our verification process is powered by Bridge.xyz. If you need assistance, please contact support.",
  },
  "email-verification": {
    icon: XCircle,
    title: "Email Verification Failed",
    description: "We couldn't verify your email address. The verification link may have expired.",
    variant: "destructive",
    primaryAction: {
      label: "Resend Verification",
      href: "/resend-verification",
    },
    secondaryAction: {
      label: "Sign In",
      href: "/sign-in",
    },
    additionalInfo: "Verification links expire after 24 hours for security reasons.",
  },
  "account-access": {
    icon: Shield,
    title: "Account Access Denied",
    description: "You don't have permission to access this resource or your account may be inactive.",
    variant: "destructive",
    primaryAction: {
      label: "Sign In Again",
      href: "/sign-in",
    },
    secondaryAction: {
      label: "Contact Support",
      href: "/contact",
    },
    supportInfo: "If you believe this is an error, please contact support with your account details.",
  },
  "kyc-rejected": {
    icon: XCircle,
    title: "Verification Rejected",
    description: "Your identity verification has been rejected. Please review the requirements and submit new documents.",
    variant: "destructive",
    primaryAction: {
      label: "Resubmit Documents",
      href: "/sign-up",
    },
    additionalInfo: "Check that all documents are clear, current, and match your personal information exactly.",
    supportInfo: "For specific rejection reasons, check your email or contact our compliance team.",
  },
  "server-error": {
    icon: AlertTriangle,
    title: "Server Error",
    description: "We're experiencing technical difficulties. Please try again in a few minutes.",
    variant: "default",
    primaryAction: {
      label: "Refresh Page",
      action: () => window.location.reload(),
    },
    secondaryAction: {
      label: "Go Home",
      href: "/",
    },
    showRetry: true,
    additionalInfo: "This is usually temporary. Our team has been notified and is working on a fix.",
  },
  validation: {
    icon: AlertTriangle,
    title: "Validation Error",
    description: "Some of the information you provided is invalid or incomplete.",
    variant: "destructive",
    primaryAction: {
      label: "Go Back and Fix",
      action: () => window.history.back(),
    },
    additionalInfo: "Please ensure all required fields are filled out correctly and try again.",
  },
  authentication: {
    icon: Shield,
    title: "Authentication Required",
    description: "You need to sign in to access this page.",
    variant: "default",
    primaryAction: {
      label: "Sign In",
      href: "/sign-in",
    },
    secondaryAction: {
      label: "Create Account",
      href: "/sign-up",
    },
  },
  general: {
    icon: AlertTriangle,
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again or contact support if the problem persists.",
    variant: "destructive",
    primaryAction: {
      label: "Try Again",
      action: () => window.history.back(),
    },
    secondaryAction: {
      label: "Go Home",
      href: "/",
    },
    showRetry: true,
  },
};

function ErrorPageContent() {
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") as ErrorType) || "general";
  const customTitle = searchParams.get("title");
  const customMessage = searchParams.get("message");
  const errorDetails = searchParams.get("details");
  const errorCode = searchParams.get("code");
  const retryUrl = searchParams.get("retry");

  const config = ERROR_CONFIGS[type] || ERROR_CONFIGS.general;
  const ErrorIcon = config.icon;

  const title = customTitle || config.title;
  const description = customMessage || config.description;

  // Override primary action if retry URL is specified
  const primaryAction = retryUrl 
    ? { label: "Try Again", href: retryUrl }
    : config.primaryAction;

  const handleRetry = () => {
    if (primaryAction?.action) {
      primaryAction.action();
    } else if (retryUrl) {
      window.location.href = retryUrl;
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <Card className={cn(
          "border-red-200 bg-red-50/50",
          config.variant === "default" && "border-orange-200 bg-orange-50/50"
        )}>
          <CardHeader className="text-center pb-4">
            <div className={cn(
              "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4",
              config.variant === "destructive" 
                ? "bg-red-100 border border-red-200" 
                : "bg-orange-100 border border-orange-200"
            )}>
              <ErrorIcon className={cn(
                "h-8 w-8",
                config.variant === "destructive" ? "text-red-600" : "text-orange-600"
              )} />
            </div>
            <CardTitle className={cn(
              "text-2xl",
              config.variant === "destructive" ? "text-red-800" : "text-orange-800"
            )}>
              {title}
            </CardTitle>
            <CardDescription className={cn(
              "text-base",
              config.variant === "destructive" ? "text-red-700" : "text-orange-700"
            )}>
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Code */}
            {errorCode && (
              <Alert className="border-gray-200 bg-gray-50">
                <FileText className="h-4 w-4 text-gray-600" />
                <AlertDescription className="text-gray-800">
                  <strong>Error Code:</strong> 
                  <span className="font-mono ml-2">{errorCode}</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Details */}
            {errorDetails && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Details:</strong><br />
                  {errorDetails}
                </AlertDescription>
              </Alert>
            )}

            {/* Additional Information */}
            {config.additionalInfo && (
              <Alert className="border-blue-200 bg-blue-50">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>What you can do:</strong><br />
                  {config.additionalInfo}
                </AlertDescription>
              </Alert>
            )}

            {/* Support Information */}
            {config.supportInfo && (
              <Alert className="border-purple-200 bg-purple-50">
                <HelpCircle className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-800">
                  <strong>Need help?</strong><br />
                  {config.supportInfo}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {primaryAction && (
                <Button 
                  asChild={!!primaryAction.href}
                  onClick={primaryAction.action || (config.showRetry ? handleRetry : undefined)}
                  size="lg" 
                  className="flex-1"
                >
                  {primaryAction.href ? (
                    <Link href={primaryAction.href}>
                      {primaryAction.label}
                      {config.showRetry ? <RefreshCw className="ml-2 h-4 w-4" /> : <ArrowLeft className="ml-2 h-4 w-4" />}
                    </Link>
                  ) : (
                    <>
                      {primaryAction.label}
                      {config.showRetry ? <RefreshCw className="ml-2 h-4 w-4" /> : <ArrowLeft className="ml-2 h-4 w-4" />}
                    </>
                  )}
                </Button>
              )}
              
              {config.secondaryAction && (
                <Button variant="outline" asChild size="lg" className="flex-1">
                  <Link href={config.secondaryAction.href}>
                    <Home className="mr-2 h-4 w-4" />
                    {config.secondaryAction.label}
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Still having trouble? Contact our{" "}
            <Button variant="link" className="p-0 h-auto text-sm">
              support team
            </Button>
            {" "}for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="text-center space-y-2">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading error page...</p>
      </div>
    </div>}>
      <ErrorPageContent />
    </Suspense>
  );
}