"use client";

import { useState, useEffect } from "react";
import {
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { KYCStats } from "@/types/kyc";

interface KYCStatsProps {
  refreshKey: number;
}

export function KYCStats({ refreshKey }: KYCStatsProps) {
  const [stats, setStats] = useState<KYCStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/kyc/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching KYC stats:", error);
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

  const activeKYCs = stats.kycStatusCounts.active;
  const pendingReview =
    stats.kycStatusCounts.under_review +
    stats.kycStatusCounts.awaiting_questionnaire +
    stats.kycStatusCounts.awaiting_ubo;
  const rejectedKYCs = stats.kycStatusCounts.rejected;
  const completionRate =
    stats.totalUsers > 0
      ? ((activeKYCs / stats.totalUsers) * 100).toFixed(1)
      : 0;

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
            {stats.totalKYCProfiles} con perfil KYC
          </p>
        </CardContent>
      </Card>

      {/* Active KYCs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">KYC Aprobados</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{activeKYCs}</div>
          <p className="text-xs text-muted-foreground">
            {completionRate}% de tasa de finalización
          </p>
        </CardContent>
      </Card>

      {/* Pending Review */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pendientes Revisión
          </CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {pendingReview}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            Requieren atención
          </div>
        </CardContent>
      </Card>

      {/* Rejected KYCs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">KYC Rechazados</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{rejectedKYCs}</div>
          <p className="text-xs text-muted-foreground">
            Necesitan correcciones
          </p>
        </CardContent>
      </Card>

      {/* Today's Activity */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Actividad de Hoy
          </CardTitle>
          <CardDescription>
            Resumen de las acciones realizadas hoy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Nuevos KYC</span>
              </div>
              <div className="text-xl font-bold">
                {stats.recentActivity.newKYCsToday}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Aprobados</span>
              </div>
              <div className="text-xl font-bold text-green-600">
                {stats.recentActivity.approvedToday}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Rechazados</span>
              </div>
              <div className="text-xl font-bold text-red-600">
                {stats.recentActivity.rejectedToday}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">En Revisión</span>
              </div>
              <div className="text-xl font-bold text-yellow-600">
                {stats.recentActivity.pendingReview}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}
