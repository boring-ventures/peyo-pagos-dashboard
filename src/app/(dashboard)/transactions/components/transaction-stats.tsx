"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactionStats } from "@/hooks/use-transactions";
import {
  CreditCard,
  TrendingUp,
  Users,
  Activity,
  DollarSign,
  Wallet,
} from "lucide-react";

interface TransactionStatsProps {
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
}

export function TransactionStats({ dateRange }: TransactionStatsProps) {
  const { data: stats, isLoading, error } = useTransactionStats(dateRange);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-[60px] mb-1" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Failed to load stats
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const topCurrency = stats.currencyBreakdown[0];
  const topPaymentRail = stats.paymentRailBreakdown[0];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Transactions
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalTransactions.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.recentTransactions} in last 24h
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${parseFloat(stats.totalVolume).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Across all currencies</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Unique Customers
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.uniqueCustomers.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Active customers</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unique Wallets</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.uniqueWallets.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Connected wallets</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Currency</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {topCurrency?.currency || "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            {topCurrency?.count.toLocaleString() || 0} transactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Top Payment Rail
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">
            {topPaymentRail?.paymentRail || "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            {topPaymentRail?.count.toLocaleString() || 0} transactions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
