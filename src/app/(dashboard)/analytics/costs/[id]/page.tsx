"use client";

import { useParams, useRouter } from "next/navigation";
import { useCostEntryDetail } from "@/hooks/use-cost-entries";
import { useAuth } from "@/providers/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Receipt,
  User,
  DollarSign,
  Shield,
  Wallet,
  Users,
  ExternalLink,
  AlertTriangle,
  FileText,
  Clock,
} from "lucide-react";
import { canAccessModule } from "@/lib/auth/role-permissions";
import type { CostEntry } from "@/types/analytics";

export default function CostEntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const entryId = params.id as string;

  const { data: costEntry, isLoading, error } = useCostEntryDetail(entryId);

  // Check if user has access to analytics
  if (!profile || !canAccessModule(profile.role, "analytics")) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

  const getTypeIcon = (type: CostEntry["type"]) => {
    switch (type) {
      case "kyc":
        return <Users className="h-6 w-6 text-blue-600" />;
      case "wallet":
        return <Wallet className="h-6 w-6 text-purple-600" />;
      default:
        return <FileText className="h-6 w-6 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: CostEntry["type"]) => {
    switch (type) {
      case "kyc":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            KYC Verification
          </Badge>
        );
      case "wallet":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            Wallet Creation
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-xl">Error Loading Bill</CardTitle>
            <CardDescription>
              {error.message || "Failed to load cost entry details"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!costEntry) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <CardTitle className="text-xl">Bill Not Found</CardTitle>
            <CardDescription>
              The requested cost entry could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRelatedCosts = costEntry.relatedEntries?.reduce(
    (sum, entry) => sum + entry.amount,
    0
  ) || 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analytics
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Receipt className="h-8 w-8 text-primary" />
              Cost Entry Bill
            </h1>
            <p className="text-muted-foreground">
              Detailed breakdown for entry #{costEntry.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getTypeIcon(costEntry.type)}
          {getTypeBadge(costEntry.type)}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Bill Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Bill Details
              </CardTitle>
              <CardDescription>
                Complete information about this cost entry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Entry ID
                  </label>
                  <div className="font-mono text-sm bg-muted p-2 rounded">
                    {costEntry.id}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Amount
                  </label>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(costEntry.amount)}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Description</span>
                  <span className="text-sm">{costEntry.description}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Service Type</span>
                  <span className="text-sm capitalize">{costEntry.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Currency</span>
                  <span className="text-sm">{costEntry.currency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Created</span>
                  <span className="text-sm">{formatDate(costEntry.createdAt)}</span>
                </div>
              </div>

              {/* Metadata */}
              {Object.keys(costEntry.metadata).length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Service Details</h4>
                    {costEntry.metadata.kycStatus && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">KYC Status</span>
                        <Badge
                          variant="outline"
                          className={
                            costEntry.metadata.kycStatus === "active"
                              ? "bg-green-50 text-green-700"
                              : costEntry.metadata.kycStatus === "rejected"
                              ? "bg-red-50 text-red-700"
                              : "bg-yellow-50 text-yellow-700"
                          }
                        >
                          {costEntry.metadata.kycStatus.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    )}
                    {costEntry.metadata.bridgeCustomerId && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Bridge Customer ID</span>
                        <span className="text-sm font-mono">
                          {costEntry.metadata.bridgeCustomerId}
                        </span>
                      </div>
                    )}
                    {costEntry.metadata.walletChain && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Blockchain</span>
                        <Badge variant="outline" className="capitalize">
                          {costEntry.metadata.walletChain}
                        </Badge>
                      </div>
                    )}
                    {costEntry.metadata.walletAddress && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Wallet Address</span>
                        <span className="text-sm font-mono bg-muted p-1 rounded">
                          {costEntry.metadata.walletAddress.slice(0, 8)}...
                          {costEntry.metadata.walletAddress.slice(-6)}
                        </span>
                      </div>
                    )}
                    {costEntry.metadata.bridgeWalletId && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Bridge Wallet ID</span>
                        <span className="text-sm font-mono">
                          {costEntry.metadata.bridgeWalletId}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Related Entries */}
          {costEntry.relatedEntries && costEntry.relatedEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Related Costs for This User
                </CardTitle>
                <CardDescription>
                  Other cost entries associated with {costEntry.userName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costEntry.relatedEntries.map((relatedEntry) => (
                    <div
                      key={relatedEntry.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        {getTypeIcon(relatedEntry.type)}
                        <div>
                          <div className="font-medium">{relatedEntry.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(relatedEntry.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-green-600">
                          {formatCurrency(relatedEntry.amount)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/analytics/costs/${relatedEntry.id}`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Name
                </label>
                <div className="font-medium">{costEntry.userName || "Unknown"}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <div className="text-sm">{costEntry.userEmail}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  User ID
                </label>
                <div className="text-sm font-mono">{costEntry.userId}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Profile ID
                </label>
                <div className="text-sm font-mono">{costEntry.profileId}</div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">This Entry</span>
                <span className="font-semibold">
                  {formatCurrency(costEntry.amount)}
                </span>
              </div>
              {totalRelatedCosts > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Related Costs</span>
                    <span className="font-semibold">
                      {formatCurrency(totalRelatedCosts)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total User Costs</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(costEntry.amount + totalRelatedCosts)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/users?search=${costEntry.userEmail}`)}
              >
                <User className="h-4 w-4 mr-2" />
                View User Profile
              </Button>
              {costEntry.type === "kyc" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/kyc`)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  View KYC Module
                </Button>
              )}
              {costEntry.type === "wallet" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/wallets`)}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  View Wallets Module
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}