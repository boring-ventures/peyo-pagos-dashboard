"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Search,
  FileText,
  User,
  Building2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface VerificationStatus {
  profileId: string;
  email: string;
  customerType: "individual" | "business";
  kycStatus: string;
  kybStatus?: string;
  bridgeCustomerId: string;
  statusUpdated: boolean;
  lastUpdated: string;
  createdAt: string;
}

interface VerificationData {
  success: boolean;
  verification: VerificationStatus;
  customer: {
    name: string;
    customerType: "individual" | "business";
    accountPurpose: string;
  };
  rejectionReasons?: string[];
  requiredFields?: string[];
  expectedProcessingTime?: string;
}

type StatusType = "pending" | "under_review" | "approved" | "rejected" | "incomplete" | "not_started";

const STATUS_CONFIGS: Record<StatusType, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  label: string;
  description: string;
  progress: number;
}> = {
  not_started: {
    icon: Clock,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    label: "Not Started",
    description: "Verification process hasn't begun yet",
    progress: 0,
  },
  pending: {
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    label: "Pending",
    description: "Your application is in the review queue",
    progress: 25,
  },
  under_review: {
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Under Review",
    description: "Our compliance team is reviewing your application",
    progress: 60,
  },
  incomplete: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    label: "Incomplete",
    description: "Additional information or documents are required",
    progress: 40,
  },
  approved: {
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Approved",
    description: "Your verification has been approved",
    progress: 100,
  },
  rejected: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Rejected",
    description: "Your application was not approved",
    progress: 0,
  },
};

export default function KycStatusPage() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email");
  const customerId = searchParams.get("customerId");
  
  const [email, setEmail] = useState(initialEmail || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-check on mount if email or customerId provided
  useEffect(() => {
    if (initialEmail || customerId) {
      checkStatus(initialEmail || "", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEmail, customerId]);

  const checkStatus = async (emailToCheck: string = email, syncFromBridge: boolean = false) => {
    if (!emailToCheck.trim() && !customerId) {
      toast({
        title: "Email required",
        description: "Please enter your email address to check verification status.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (emailToCheck.trim()) params.append('email', emailToCheck.trim());
      if (customerId) params.append('customerId', customerId);
      if (syncFromBridge) params.append('syncFromBridge', 'true');

      const response = await fetch(`/api/customers/verification-status?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch verification status');
      }

      setVerificationData(data);
      
      if (data.verification.statusUpdated) {
        toast({
          title: "Status Updated",
          description: "Your verification status has been refreshed from our system.",
        });
      }

    } catch (error) {
      console.error('Failed to fetch verification status:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setVerificationData(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const refreshStatus = () => {
    setIsRefreshing(true);
    checkStatus(email, true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkStatus();
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIGS[status as StatusType] || STATUS_CONFIGS.not_started;
  };

  const statusConfig = verificationData 
    ? getStatusConfig(verificationData.verification.kycStatus)
    : null;

  const StatusIcon = statusConfig?.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Verification Status
          </h1>
          <p className="text-muted-foreground">
            Check the status of your identity verification
          </p>
        </div>

        {/* Search Form */}
        {!verificationData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Check Your Status
              </CardTitle>
              <CardDescription>
                Enter your email address to check your verification status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Checking Status...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Check Status
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Status Display */}
        {verificationData && statusConfig && (
          <div className="space-y-6">
            {/* Customer Info Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {verificationData.customer.customerType === 'individual' ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Building2 className="h-5 w-5" />
                    )}
                    {verificationData.customer.name}
                  </CardTitle>
                  <CardDescription>{verificationData.verification.email}</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshStatus}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
            </Card>

            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full", statusConfig.bgColor)}>
                      {StatusIcon && <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {statusConfig.label}
                        <Badge variant={
                          verificationData.verification.kycStatus === 'approved' ? 'default' :
                          verificationData.verification.kycStatus === 'rejected' ? 'destructive' :
                          'secondary'
                        }>
                          {verificationData.customer.customerType.toUpperCase()}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{statusConfig.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{statusConfig.progress}%</span>
                  </div>
                  <Progress value={statusConfig.progress} className="h-2" />
                </div>

                {/* Expected Processing Time */}
                {verificationData.expectedProcessingTime && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Expected processing time:</strong> {verificationData.expectedProcessingTime}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Rejection Reasons */}
                {verificationData.rejectionReasons && verificationData.rejectionReasons.length > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Rejection reasons:</strong>
                      <ul className="mt-1 list-disc list-inside">
                        {verificationData.rejectionReasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Required Fields */}
                {verificationData.requiredFields && verificationData.requiredFields.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Additional information required:</strong>
                      <ul className="mt-1 list-disc list-inside">
                        {verificationData.requiredFields.map((field, index) => (
                          <li key={index}>{field}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Customer ID */}
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Customer ID:</strong>{" "}
                    <span className="font-mono">{verificationData.verification.bridgeCustomerId}</span>
                  </AlertDescription>
                </Alert>

                {/* Last Updated */}
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(verificationData.verification.lastUpdated).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {verificationData.verification.kycStatus === 'approved' && (
                <Button asChild className="flex-1">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              
              {['rejected', 'incomplete'].includes(verificationData.verification.kycStatus) && (
                <Button asChild className="flex-1">
                  <Link href="/sign-up">
                    Resubmit Application
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}

              <Button variant="outline" onClick={() => setVerificationData(null)}>
                Check Another Account
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Need help with your verification? Contact our{" "}
            <Button variant="link" className="p-0 h-auto text-sm">
              support team
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}