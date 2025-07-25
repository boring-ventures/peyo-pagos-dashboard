"use client";

import { useState, useEffect } from "react";
import { Users, Shield, UserCheck, UserX, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserStats } from "@/types/user";

interface UserStatsProps {
  refreshKey: number;
}

export function UserStats({ refreshKey }: UserStatsProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
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

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 px-2">
      {/* Total Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold mb-2">
            {stats.totalUsers.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.recentActivity.newUsersToday} nuevos hoy
          </p>
        </CardContent>
      </Card>

      {/* Administrators */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Administradores</CardTitle>
          <Shield className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalSuperAdmins + stats.totalAdmins}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.totalSuperAdmins} Super, {stats.totalAdmins} Admin
          </p>
        </CardContent>
      </Card>

      {/* Active Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Usuarios Activos
          </CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.recentActivity.activeUsers}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            Estado activo
          </div>
        </CardContent>
      </Card>

      {/* Disabled Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Usuarios Deshabilitados
          </CardTitle>
          <UserX className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats.recentActivity.disabledUsers}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <UserX className="h-3 w-3" />
            Requieren atención
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
