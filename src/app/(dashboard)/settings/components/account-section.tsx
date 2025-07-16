"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock } from "lucide-react";

export function AccountSection() {
  const { profile, user } = useCurrentUser();

  if (!profile || !user) return null;

  // Format user creation date
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de la Cuenta</CardTitle>
        <CardDescription>Detalles sobre tu cuenta y acceso.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Estado</p>
            <div>
              {profile.status === 'active' ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200"
                >
                  Activo
                </Badge>
              ) : profile.status === 'disabled' ? (
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200"
                >
                  Deshabilitado
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200"
                >
                  Eliminado
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Rol</p>
            <p className="text-sm text-muted-foreground">
              {(profile.role as string) === "USER" && "Usuario"}
              {(profile.role as string) === "SUPERADMIN" && "Administrador"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Miembro desde</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              <span>{createdAt}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
