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
  Home
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

interface RegistrationStatusProps {
  status: RegistrationStatus;
  customerType: "individual" | "business" | null;
  error?: string | null;
  customerId?: string | null;
  kycStatus?: string | null;
  onRetry?: () => void;
  onReset?: () => void;
  className?: string;
}

export function RegistrationStatus({
  status,
  customerType,
  error,
  customerId,
  kycStatus,
  onRetry,
  onReset,
  className,
}: RegistrationStatusProps) {
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
    switch (status) {
      case "submitting":
        return {
          icon: RefreshCw,
          iconColor: "text-blue-500",
          title: "Submitting Application",
          description: "Please wait while we process your information...",
          showProgress: true,
          variant: "default" as const,
        };
      
      case "processing":
        return {
          icon: Clock,
          iconColor: "text-orange-500",
          title: "Processing Registration",
          description: "Your application is being reviewed by our compliance team.",
          showProgress: true,
          variant: "default" as const,
        };

      case "completed":
      case "approved":
        return {
          icon: CheckCircle2,
          iconColor: "text-green-500",
          title: "Registration Successful!",
          description: `Your ${customerType} account has been successfully created and approved.`,
          showProgress: false,
          variant: "default" as const,
        };

      case "pending_verification":
        return {
          icon: Clock,
          iconColor: "text-yellow-500",
          title: "Pending Verification",
          description: "Additional verification may be required. You'll receive an email with next steps.",
          showProgress: false,
          variant: "default" as const,
        };

      case "under_review":
        return {
          icon: Shield,
          iconColor: "text-blue-500",
          title: "Under Review",
          description: `Your ${customerType} application is currently under review. This typically takes ${customerType === 'business' ? '3-5' : '1-2'} business days.`,
          showProgress: false,
          variant: "default" as const,
        };

      case "rejected":
        return {
          icon: XCircle,
          iconColor: "text-red-500",
          title: "Application Rejected",
          description: "Your application could not be approved at this time. Please check your information and try again.",
          showProgress: false,
          variant: "destructive" as const,
        };

      case "error":
        return {
          icon: AlertTriangle,
          iconColor: "text-red-500",
          title: "Registration Failed",
          description: "There was an error processing your application. Please try again.",
          showProgress: false,
          variant: "destructive" as const,
        };

      default:
        return null;
    }
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
                {progress}% complete
              </p>
            </div>
          )}

          {/* Customer ID Display */}
          {customerId && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription className="font-mono text-sm">
                <strong>Customer ID:</strong> {customerId}
                <br />
                <span className="text-xs text-muted-foreground">
                  Keep this ID for your records
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* KYC Status */}
          {kycStatus && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Verification Status:</strong> {kycStatus.replace(/_/g, ' ').toLowerCase()}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Details */}
          {isError && error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-left">
                <strong>Error Details:</strong><br />
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Next Steps */}
          {isPending && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription className="text-left">
                <strong>What happens next:</strong>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  <li>Our compliance team will review your application</li>
                  <li>You&apos;ll receive email updates on your application status</li>
                  <li>Additional documentation may be requested if needed</li>
                  <li>You&apos;ll be notified once your account is approved</li>
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
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </>
        )}

        {isError && (
          <>
            {onRetry && (
              <Button onClick={onRetry} size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            {onReset && (
              <Button variant="outline" onClick={onReset} size="lg">
                Start Over
              </Button>
            )}
            <Button variant="ghost" size="lg" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </>
        )}

        {isPending && (
          <Button variant="outline" size="lg" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        )}

        {isProcessing && (
          <p className="text-sm text-muted-foreground text-center">
            Please don&apos;t close this page while we process your application.
          </p>
        )}
      </div>
    </div>
  );
}