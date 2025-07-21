"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlatformAnalytics } from "@/types/analytics";

interface CostBreakdownChartProps {
  analytics: PlatformAnalytics | undefined;
  isLoading: boolean;
}

export function CostBreakdownChart({
  analytics,
  isLoading,
}: CostBreakdownChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics?.monthlyBreakdown?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>No monthly data available yet</p>
            <p className="text-sm">
              Data will appear as KYCs are processed over time
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);

  // Find max value for scaling the visual bars
  const maxCost = Math.max(
    ...analytics.monthlyBreakdown.map((item) => item.totalCosts)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly Cost Breakdown</CardTitle>
        <p className="text-sm text-muted-foreground">
          Last 6 months of KYC and wallet costs
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics.monthlyBreakdown.map((monthData, index) => {
            const barWidth =
              maxCost > 0 ? (monthData.totalCosts / maxCost) * 100 : 0;

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{monthData.month}</span>
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700"
                    >
                      KYC: {formatCurrency(monthData.kycCosts)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700"
                    >
                      Wallets: {formatCurrency(monthData.walletCosts)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 font-medium"
                    >
                      Total: {formatCurrency(monthData.totalCosts)}
                    </Badge>
                  </div>
                </div>

                {/* Visual bar */}
                <div className="relative">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">
                Total KYC Costs (6mo):{" "}
              </span>
              <span className="font-medium text-blue-600">
                {formatCurrency(
                  analytics.monthlyBreakdown.reduce(
                    (sum, month) => sum + month.kycCosts,
                    0
                  )
                )}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">
                Total Wallet Costs (6mo):{" "}
              </span>
              <span className="font-medium text-purple-600">
                {formatCurrency(
                  analytics.monthlyBreakdown.reduce(
                    (sum, month) => sum + month.walletCosts,
                    0
                  )
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
