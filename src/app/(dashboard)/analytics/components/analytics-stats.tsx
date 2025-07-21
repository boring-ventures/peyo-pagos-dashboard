"use client";

import {
  DollarSign,
  Users,
  Wallet,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlatformAnalytics } from "@/types/analytics";

interface AnalyticsStatsProps {
  analytics: PlatformAnalytics | undefined;
  isLoading: boolean;
}

export function AnalyticsStats({ analytics, isLoading }: AnalyticsStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="space-y-6">
      {/* Main Cost Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Platform Cost
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics.totalPlatformCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              KYC + Wallet costs combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Costs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(analytics.kyc.totalKYCCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.kyc.totalKYCs} KYCs × $3.00 each
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Costs</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(analytics.wallets.totalWalletCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.wallets.totalWallets} wallets × $0.25 each
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Costs
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(analytics.recentActivity.totalCostsToday)}
            </div>
            <p className="text-xs text-muted-foreground">
              New KYCs: {analytics.recentActivity.newKYCsToday}, Wallets:{" "}
              {analytics.recentActivity.newWalletsToday}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KYC Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">KYC Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50">
                  {analytics.kyc.kycsByStatus.active}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(analytics.kyc.kycsByStatus.active * 3)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Under Review</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-50">
                  {analytics.kyc.kycsByStatus.under_review}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(analytics.kyc.kycsByStatus.under_review * 3)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Rejected</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-red-50">
                  {analytics.kyc.kycsByStatus.rejected}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(analytics.kyc.kycsByStatus.rejected * 3)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Incomplete</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-50">
                  {analytics.kyc.kycsByStatus.incomplete}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(analytics.kyc.kycsByStatus.incomplete * 3)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Awaiting Questionnaire</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50">
                  {analytics.kyc.kycsByStatus.awaiting_questionnaire}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(
                    analytics.kyc.kycsByStatus.awaiting_questionnaire * 3
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wallet Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(analytics.wallets.walletsByChain).map(
              ([chain, count]) => (
                <div key={chain} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        chain === "solana" ? "bg-purple-500" : "bg-blue-500"
                      }`}
                    />
                    <span className="text-sm capitalize">{chain}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{count}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(count * 0.25)}
                    </span>
                  </div>
                </div>
              )
            )}

            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Total Users with Wallets
                </span>
                <Badge variant="outline" className="bg-gray-50">
                  {analytics.wallets.totalUsersWithWallets}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
