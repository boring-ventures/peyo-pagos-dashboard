"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useAnalytics } from "@/hooks/use-analytics";
import { AnalyticsStats } from "./components/analytics-stats";
import { CostEntriesTable } from "./components/cost-entries-table";
import { AnalyticsDateFilter } from "./components/analytics-date-filter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, BarChart3, Shield, AlertTriangle } from "lucide-react";
import { canAccessModule } from "@/lib/auth/role-permissions";

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const { data, isLoading, error, refetch, isFetching } =
    useAnalytics(dateRange);

  const handleRefresh = async () => {
    await refetch();
  };

  const handleDateChange = useCallback(
    (dates: { startDate?: string; endDate?: string }) => {
      setDateRange(dates);
    },
    []
  );

  const handleClearDateFilter = useCallback(() => {
    setDateRange({});
  }, []);

  // Check if user has access to analytics (only SUPERADMIN)
  if (!profile || !canAccessModule(profile.role, "analytics")) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to access this module. Only super
              administrators can view platform analytics.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const analytics = data?.analytics;
  const lastUpdated = data?.lastUpdated;

  const formatLastUpdated = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Platform Analytics
          </h1>
          <p className="text-muted-foreground">
            Track KYC and wallet costs across the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {formatLastUpdated(lastUpdated)}
            </p>
          )}
          <Button
            onClick={handleRefresh}
            disabled={isFetching}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load analytics data: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Date Range Filter */}
      <AnalyticsDateFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onDateChange={handleDateChange}
        onClear={handleClearDateFilter}
      />

      {/* Cost Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cost Structure</CardTitle>
          <CardDescription>
            Platform costs for compliance and infrastructure services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">KYC Verification Cost</span>
              <span className="text-blue-600 font-bold">$3.00 per KYC</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="font-medium">Wallet Creation Cost</span>
              <span className="text-purple-600 font-bold">
                $0.25 per wallet
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Stats */}
      <AnalyticsStats analytics={analytics} isLoading={isLoading} />

      {/* Individual Cost Entries Table */}
      <CostEntriesTable dateRange={dateRange} />

      {/* Additional Insights */}
      {analytics && !isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cost Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Average cost per user</span>
                <span className="font-medium">
                  $
                  {(
                    analytics.totalPlatformCost /
                    Math.max(analytics.kyc.totalKYCs, 1)
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">KYC to Wallet ratio</span>
                <span className="font-medium">
                  {analytics.kyc.totalKYCs > 0
                    ? `1:${(analytics.wallets.totalWallets / analytics.kyc.totalKYCs).toFixed(1)}`
                    : "1:0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cost distribution</span>
                <span className="font-medium">
                  {analytics.totalPlatformCost > 0
                    ? `${((analytics.kyc.totalKYCCost / analytics.totalPlatformCost) * 100).toFixed(0)}% KYC, ${((analytics.wallets.totalWalletCost / analytics.totalPlatformCost) * 100).toFixed(0)}% Wallets`
                    : "No costs yet"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">New KYCs today</span>
                <span className="font-medium text-blue-600">
                  {analytics.recentActivity.newKYCsToday}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">New wallets today</span>
                <span className="font-medium text-purple-600">
                  {analytics.recentActivity.newWalletsToday}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Today&apos;s total costs</span>
                <span className="font-medium text-green-600">
                  ${analytics.recentActivity.totalCostsToday.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
