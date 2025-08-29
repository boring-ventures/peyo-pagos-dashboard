"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ArrowRight, Home, FileText, Shield, Clock } from "lucide-react";
import Link from "next/link";

type SuccessType = 
  | "registration"
  | "email-verification" 
  | "account-activation"
  | "kyc-approved"
  | "profile-updated"
  | "general";

interface SuccessConfig {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  additionalInfo?: string;
}

const SUCCESS_CONFIGS: Record<SuccessType, SuccessConfig> = {
  registration: {
    icon: CheckCircle2,
    title: "Registration Successful!",
    description: "Your account has been created successfully. You can now sign in and access your dashboard.",
    primaryAction: {
      label: "Sign In",
      href: "/sign-in",
    },
    secondaryAction: {
      label: "Back to Home",
      href: "/",
    },
    additionalInfo: "You may receive an email with additional information about your account setup.",
  },
  "email-verification": {
    icon: CheckCircle2,
    title: "Email Verified!",
    description: "Your email address has been successfully verified. You can now access all features of your account.",
    primaryAction: {
      label: "Continue to Dashboard",
      href: "/dashboard",
    },
    secondaryAction: {
      label: "Sign In",
      href: "/sign-in",
    },
  },
  "account-activation": {
    icon: CheckCircle2,
    title: "Account Activated!",
    description: "Your account has been successfully activated. You now have full access to all platform features.",
    primaryAction: {
      label: "Go to Dashboard",
      href: "/dashboard",
    },
  },
  "kyc-approved": {
    icon: Shield,
    title: "Verification Approved!",
    description: "Your identity verification has been approved. You now have full access to all financial services.",
    primaryAction: {
      label: "Access Dashboard",
      href: "/dashboard",
    },
    additionalInfo: "You can now create wallets, request cards, and perform transactions.",
  },
  "profile-updated": {
    icon: CheckCircle2,
    title: "Profile Updated!",
    description: "Your profile information has been successfully updated.",
    primaryAction: {
      label: "View Profile",
      href: "/dashboard/profile",
    },
    secondaryAction: {
      label: "Go to Dashboard",
      href: "/dashboard",
    },
  },
  general: {
    icon: CheckCircle2,
    title: "Success!",
    description: "Your action was completed successfully.",
    primaryAction: {
      label: "Continue",
      href: "/dashboard",
    },
    secondaryAction: {
      label: "Home",
      href: "/",
    },
  },
};

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") as SuccessType) || "general";
  const customTitle = searchParams.get("title");
  const customMessage = searchParams.get("message");
  const redirectTo = searchParams.get("redirect");
  const customerId = searchParams.get("customerId");
  const kycStatus = searchParams.get("kycStatus");

  const config = SUCCESS_CONFIGS[type] || SUCCESS_CONFIGS.general;
  const SuccessIcon = config.icon;

  const title = customTitle || config.title;
  const description = customMessage || config.description;

  // Override primary action if redirect is specified
  const primaryAction = redirectTo 
    ? { label: "Continue", href: redirectTo }
    : config.primaryAction;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 border border-green-200 flex items-center justify-center mb-4">
              <SuccessIcon className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">{title}</CardTitle>
            <CardDescription className="text-base text-green-700">
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Customer ID Display */}
            {customerId && (
              <Alert className="border-green-200 bg-green-50">
                <FileText className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Customer ID:</strong> 
                  <span className="font-mono ml-2">{customerId}</span>
                  <br />
                  <span className="text-sm text-green-700">
                    Keep this ID for your records
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* KYC Status */}
            {kycStatus && (
              <Alert className="border-green-200 bg-green-50">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Verification Status:</strong> {kycStatus.replace(/_/g, ' ').toLowerCase()}
                </AlertDescription>
              </Alert>
            )}

            {/* Additional Information */}
            {config.additionalInfo && (
              <Alert className="border-blue-200 bg-blue-50">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  {config.additionalInfo}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {primaryAction && (
                <Button asChild size="lg" className="flex-1">
                  <Link href={primaryAction.href}>
                    {primaryAction.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
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
            Need help? Contact our{" "}
            <Button variant="link" className="p-0 h-auto text-sm">
              support team
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="text-center space-y-2">
        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
        <p className="text-muted-foreground">Loading success page...</p>
      </div>
    </div>}>
      <SuccessPageContent />
    </Suspense>
  );
}