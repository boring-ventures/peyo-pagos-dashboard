"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { ProfileWithKYC } from "@/types/kyc";
import { KYC_STATUS_LABELS } from "@/types/kyc";
import type { KYCStatus } from "@prisma/client";

const statusUpdateSchema = z
  .object({
    kycStatus: z.string().optional(),
    rejectionReason: z.string().optional(),
  })
  .refine(
    (data) => {
      // If rejecting, reason is required
      if (data.kycStatus === "rejected" && !data.rejectionReason) {
        return false;
      }
      // At least one status must be selected
      return data.kycStatus;
    },
    {
      message: "Debe seleccionar un estado para actualizar",
    }
  );

type StatusUpdateFormValues = z.infer<typeof statusUpdateSchema>;

interface KYCStatusUpdateModalProps {
  profile: ProfileWithKYC;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function KYCStatusUpdateModal({
  profile,
  open,
  onOpenChange,
  onUpdate,
}: KYCStatusUpdateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StatusUpdateFormValues>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      kycStatus: "keep_current",
      rejectionReason: "",
    },
  });

  const watchedKycStatus = form.watch("kycStatus");
  const isRejecting = watchedKycStatus === "rejected";

  const getUserInitials = () => {
    if (profile.firstName || profile.lastName) {
      return [profile.firstName?.[0], profile.lastName?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase();
    }
    return profile.email?.[0]?.toUpperCase() || "U";
  };

  const getUserDisplayName = () => {
    const fullName = [profile.firstName, profile.lastName]
      .filter(Boolean)
      .join(" ");
    return fullName || profile.email || "Sin nombre";
  };

  const handleSubmit = async (data: StatusUpdateFormValues) => {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/kyc", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId: profile.id,
          kycStatus:
            data.kycStatus && data.kycStatus !== "keep_current"
              ? data.kycStatus
              : undefined,
          rejectionReason: data.rejectionReason || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar el estado");
      }

      toast({
        title: "Estado actualizado",
        description: `El estado KYC de ${getUserDisplayName()} ha sido actualizado correctamente.`,
      });

      onUpdate();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error updating KYC status:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el estado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Actualizar Estado KYC</DialogTitle>
          <DialogDescription>
            Cambia el estado de verificación KYC para el usuario seleccionado
          </DialogDescription>
        </DialogHeader>

        {/* User Info */}
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" alt={getUserDisplayName()} />
            <AvatarFallback className="text-xs">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{getUserDisplayName()}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        {/* Current Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Estado Actual:</h4>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              KYC:{" "}
              {profile.kycProfile?.kycStatus
                ? KYC_STATUS_LABELS[profile.kycProfile.kycStatus as KYCStatus]
                : "Sin KYC"}
            </Badge>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* KYC Status */}
            <FormField
              control={form.control}
              name="kycStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nuevo Estado KYC</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado KYC" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="keep_current">
                        Mantener actual
                      </SelectItem>
                      {Object.entries(KYC_STATUS_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bridge Status */}

            {/* Rejection Reason */}
            {isRejecting && (
              <FormField
                control={form.control}
                name="rejectionReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-red-600">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Razón de Rechazo *
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explica por qué se rechaza la verificación KYC..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Warning for rejection */}
            {isRejecting && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">
                    Rechazar verificación KYC
                  </p>
                  <p className="text-red-700">
                    Esta acción marcará el KYC como rechazado y requerirá que el
                    usuario corrija los problemas identificados antes de poder
                    proceder.
                  </p>
                </div>
              </div>
            )}

            {/* Success info for approval */}
            {watchedKycStatus === "active" && (
              <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-800">
                    Aprobar verificación KYC
                  </p>
                  <p className="text-green-700">
                    Esta acción marcará el KYC como aprobado y permitirá al
                    usuario acceder a todas las funcionalidades de la
                    plataforma.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={isRejecting ? "bg-red-600 hover:bg-red-700" : ""}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    {isRejecting ? (
                      <XCircle className="w-4 h-4 mr-2" />
                    ) : watchedKycStatus === "active" ? (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    ) : null}
                    Actualizar Estado
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {isSubmitting && (
          <LoadingScreen
            variant="overlay"
            message="Actualizando estado KYC..."
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
