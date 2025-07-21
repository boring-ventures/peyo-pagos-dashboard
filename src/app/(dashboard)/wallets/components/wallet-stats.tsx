"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Users,
  TrendingUp,
  Network,
  Coins,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { WalletStats } from "@/types/wallet";
import { SUPPORTED_CHAINS } from "@/types/wallet";

interface WalletStatsProps {
  refreshKey: number;
}

export function WalletStats({ refreshKey }: WalletStatsProps) {
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/wallets/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching wallet stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const walletAdoptionPercentage =
    stats.totalUsersWithWallets > 0 && stats.totalWallets > 0
      ? (
          (stats.totalUsersWithWallets / (stats.totalUsersWithWallets + 50)) *
          100
        ).toFixed(1) // Estimated total users
      : 0;

  const avgWalletsPerUser =
    stats.totalUsersWithWallets > 0
      ? (stats.totalWallets / stats.totalUsersWithWallets).toFixed(1)
      : 0;

  // Get the top 3 chains by wallet count
  const topChains = Object.entries(stats.walletsByChain)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 px-2">
      {/* Total Users with Wallets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">
            Usuarios con Wallets
          </CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            {stats.totalUsersWithWallets.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {walletAdoptionPercentage}% de adopción estimada
          </p>
        </CardContent>
      </Card>

      {/* Total Wallets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Wallets
          </CardTitle>
          <Wallet className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.totalWallets.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            {avgWalletsPerUser} promedio por usuario
          </div>
        </CardContent>
      </Card>

      {/* New Wallets Today */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Nuevas Wallets Hoy
          </CardTitle>
          <Activity className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.recentActivity.newWalletsToday}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Coins className="h-3 w-3" />
            Actividad reciente
          </div>
        </CardContent>
      </Card>

      {/* Active Chains */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Blockchains Activas
          </CardTitle>
          <Network className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {stats.recentActivity.activeChains}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Network className="h-3 w-3" />
            Redes soportadas
          </div>
        </CardContent>
      </Card>

      {/* Top Chains Card - Spans 2 columns on large screens */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Distribución por Blockchain
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topChains.map(([chainKey, count]) => {
              const chain = SUPPORTED_CHAINS[chainKey];
              const percentage =
                stats.totalWallets > 0
                  ? ((count / stats.totalWallets) * 100).toFixed(1)
                  : 0;

              return (
                <div
                  key={chainKey}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: chain?.color || "#8B5CF6" }}
                    />
                    <span className="text-sm font-medium">
                      {chain?.displayName || chainKey}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {count.toLocaleString()} ({percentage}%)
                    </Badge>
                  </div>
                </div>
              );
            })}

            {Object.keys(stats.walletsByChain).length > 3 && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                +{Object.keys(stats.walletsByChain).length - 3} blockchains más
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Multiple Wallets Users */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios con Múltiples Wallets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {stats.recentActivity.usersWithMultipleWallets.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.totalUsersWithWallets > 0
                ? (
                    (stats.recentActivity.usersWithMultipleWallets /
                      stats.totalUsersWithWallets) *
                    100
                  ).toFixed(1)
                : 0}
              % de usuarios con wallets tienen múltiples wallets
            </p>
            <div className="flex gap-2 mt-3">
              <Badge variant="secondary">Diversificación de activos</Badge>
              <Badge variant="outline">Multi-chain</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
