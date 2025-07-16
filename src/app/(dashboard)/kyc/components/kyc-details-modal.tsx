"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  MapPin,
  FileText,
  Calendar,
  Shield,
  Building,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProfileWithKYC, KYCProfileWithRelations } from "@/types/kyc";
import {
  KYC_STATUS_LABELS,
  BRIDGE_STATUS_LABELS,
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
} from "@/types/kyc";

interface KYCDetailsModalProps {
  profile: ProfileWithKYC;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KYCDetailsModal({
  profile,
  open,
  onOpenChange,
}: KYCDetailsModalProps) {
  const [kycDetails, setKycDetails] = useState<KYCProfileWithRelations | null>(
    null
  );

  const fetchKYCDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/kyc/${profile.id}/details`);
      if (response.ok) {
        const data = await response.json();
        setKycDetails(data.kycProfile);
      }
    } catch (error) {
      console.error("Error fetching KYC details:", error);
    }
  }, [profile.id]);

  useEffect(() => {
    if (open && profile.kycProfile) {
      fetchKYCDetails();
    }
  }, [open, profile, fetchKYCDetails]);

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

  const formatDate = (date: Date | string | null) => {
    if (!date) return "No disponible";
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "under_review":
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-8">
        <DialogHeader>
          <DialogTitle>Detalles de KYC - {getUserDisplayName()}</DialogTitle>
          <DialogDescription>
            Información completa del perfil y verificación KYC del usuario
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {/* User Info Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="" alt={getUserDisplayName()} />
                    <AvatarFallback className="text-lg">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {getUserDisplayName()}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {profile.email}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {USER_ROLE_LABELS[profile.role]}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          profile.status === "active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : profile.status === "disabled"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {USER_STATUS_LABELS[profile.status]}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {!profile.kycProfile ? (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Sin perfil KYC</h3>
                  <p className="text-muted-foreground">
                    Este usuario no ha iniciado el proceso de verificación KYC
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 p-1">
                  <TabsTrigger value="overview">Resumen</TabsTrigger>
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
                  <TabsTrigger value="verification">Verificación</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent
                  value="overview"
                  className="space-y-6 p-4 bg-muted/20 rounded-lg"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* KYC Status */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Estado KYC
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(profile.kycProfile.kycStatus)}
                          <Badge variant="outline" className="bg-gray-50">
                            {KYC_STATUS_LABELS[profile.kycProfile.kycStatus]}
                          </Badge>
                        </div>
                        {profile.kycProfile.kycRejectionReason && (
                          <p className="text-sm text-red-600 mt-2">
                            <strong>Razón de rechazo:</strong>{" "}
                            {profile.kycProfile.kycRejectionReason}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Bridge Status */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Building className="w-4 h-4 mr-2" />
                          Estado Bridge Protocol
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(
                            profile.kycProfile.bridgeVerificationStatus ||
                              "not_started"
                          )}
                          <Badge variant="outline" className="bg-gray-50">
                            {
                              BRIDGE_STATUS_LABELS[
                                profile.kycProfile.bridgeVerificationStatus ||
                                  "not_started"
                              ]
                            }
                          </Badge>
                        </div>
                        {profile.kycProfile.bridgeCustomerId && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Customer ID:</strong>{" "}
                            {profile.kycProfile.bridgeCustomerId}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          Timeline de KYC
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <div>
                            <span className="text-sm font-medium">Creado:</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {formatDate(profile.kycProfile.createdAt)}
                            </span>
                          </div>
                        </div>
                        {profile.kycProfile.kycSubmittedAt && (
                          <div className="flex items-center space-x-3">
                            <FileText className="w-4 h-4 text-yellow-600" />
                            <div>
                              <span className="text-sm font-medium">
                                Enviado:
                              </span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {formatDate(profile.kycProfile.kycSubmittedAt)}
                              </span>
                            </div>
                          </div>
                        )}
                        {profile.kycProfile.kycApprovedAt && (
                          <div className="flex items-center space-x-3">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <div>
                              <span className="text-sm font-medium">
                                Aprobado:
                              </span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {formatDate(profile.kycProfile.kycApprovedAt)}
                              </span>
                            </div>
                          </div>
                        )}
                        {profile.kycProfile.kycRejectedAt && (
                          <div className="flex items-center space-x-3">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <div>
                              <span className="text-sm font-medium">
                                Rechazado:
                              </span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {formatDate(profile.kycProfile.kycRejectedAt)}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Personal Info Tab */}
                <TabsContent
                  value="personal"
                  className="space-y-6 p-4 bg-muted/20 rounded-lg"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Información Personal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Nombre</label>
                          <p className="text-sm text-muted-foreground">
                            {profile.kycProfile.firstName || "No proporcionado"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Segundo Nombre
                          </label>
                          <p className="text-sm text-muted-foreground">
                            {profile.kycProfile.middleName ||
                              "No proporcionado"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Apellido
                          </label>
                          <p className="text-sm text-muted-foreground">
                            {profile.kycProfile.lastName || "No proporcionado"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Email</label>
                          <p className="text-sm text-muted-foreground">
                            {profile.kycProfile.email || "No proporcionado"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Teléfono
                          </label>
                          <p className="text-sm text-muted-foreground">
                            {profile.kycProfile.phone || "No proporcionado"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Fecha de Nacimiento
                          </label>
                          <p className="text-sm text-muted-foreground">
                            {profile.kycProfile.birthDate
                              ? new Date(
                                  profile.kycProfile.birthDate
                                ).toLocaleDateString("es-ES")
                              : "No proporcionado"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Nacionalidad
                          </label>
                          <p className="text-sm text-muted-foreground">
                            {profile.kycProfile.nationality ||
                              "No proporcionado"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Tipo de Cliente
                          </label>
                          <p className="text-sm text-muted-foreground">
                            {profile.kycProfile.customerType === "individual"
                              ? "Individual"
                              : "Empresa"}
                          </p>
                        </div>
                      </div>

                      {/* Address */}
                      {kycDetails?.address && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium flex items-center mb-3">
                              <MapPin className="w-4 h-4 mr-2" />
                              Dirección
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Dirección
                                </label>
                                <p className="text-sm text-muted-foreground">
                                  {kycDetails.address.streetLine1}
                                  {kycDetails.address.streetLine2 &&
                                    `, ${kycDetails.address.streetLine2}`}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  Ciudad
                                </label>
                                <p className="text-sm text-muted-foreground">
                                  {kycDetails.address.city}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  País
                                </label>
                                <p className="text-sm text-muted-foreground">
                                  {kycDetails.address.country}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">
                                  Código Postal
                                </label>
                                <p className="text-sm text-muted-foreground">
                                  {kycDetails.address.postalCode ||
                                    "No proporcionado"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent
                  value="documents"
                  className="space-y-6 p-4 bg-muted/20 rounded-lg"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Documentos e Identificación
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!kycDetails?.identifyingInfo?.length &&
                      !kycDetails?.documents?.length ? (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            No hay documentos cargados
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Identifying Information */}
                          {kycDetails?.identifyingInfo?.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-3">
                                Documentos de Identificación
                              </h4>
                              <div className="space-y-3">
                                {kycDetails.identifyingInfo.map(
                                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                  (doc, _index) => (
                                    <div
                                      key={doc.id}
                                      className="border rounded-lg p-3"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <Badge variant="secondary">
                                          {doc.type}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDate(doc.createdAt)}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <span className="font-medium">
                                            País Emisor:
                                          </span>{" "}
                                          {doc.issuingCountry}
                                        </div>
                                        <div>
                                          <span className="font-medium">
                                            Número:
                                          </span>{" "}
                                          {doc.number || "No proporcionado"}
                                        </div>
                                        {doc.expiration && (
                                          <div className="col-span-2">
                                            <span className="font-medium">
                                              Expira:
                                            </span>{" "}
                                            {formatDate(doc.expiration)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {/* Other Documents */}
                          {kycDetails?.documents?.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-3">
                                Otros Documentos
                              </h4>
                              <div className="space-y-3">
                                {kycDetails.documents.map((doc, _index) => (
                                  <div
                                    key={doc.id}
                                    className="border rounded-lg p-3"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge variant="outline">
                                        Documento #{_index + 1}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDate(doc.createdAt)}
                                      </span>
                                    </div>
                                    {doc.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {doc.description}
                                      </p>
                                    )}
                                    {doc.fileSize && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Tamaño:{" "}
                                        {(doc.fileSize / 1024 / 1024).toFixed(
                                          2
                                        )}{" "}
                                        MB
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Verification Tab */}
                <TabsContent
                  value="verification"
                  className="space-y-6 p-4 bg-muted/20 rounded-lg"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Estado de Verificación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Capabilities */}
                      <div>
                        <h4 className="font-medium mb-3">
                          Capacidades Bridge Protocol
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">Pago Crypto</span>
                            <Badge
                              variant={
                                profile.kycProfile.payinCrypto === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {profile.kycProfile.payinCrypto || "pending"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">Retiro Crypto</span>
                            <Badge
                              variant={
                                profile.kycProfile.payoutCrypto === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {profile.kycProfile.payoutCrypto || "pending"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">Pago Fiat</span>
                            <Badge
                              variant={
                                profile.kycProfile.payinFiat === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {profile.kycProfile.payinFiat || "pending"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="text-sm">Retiro Fiat</span>
                            <Badge
                              variant={
                                profile.kycProfile.payoutFiat === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {profile.kycProfile.payoutFiat || "pending"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Rejection Reasons */}
                      {kycDetails?.rejectionReasons &&
                        kycDetails.rejectionReasons.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3 text-red-600">
                              Razones de Rechazo
                            </h4>
                            <div className="space-y-3">
                              {kycDetails.rejectionReasons.map((reason) => (
                                <div
                                  key={reason.id}
                                  className="border-l-4 border-red-500 pl-4 py-2"
                                >
                                  <p className="text-sm font-medium">
                                    {reason.reason}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {reason.developerReason}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(reason.createdAt)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Requirements */}
                      {(profile.kycProfile.requirementsDue?.length > 0 ||
                        profile.kycProfile.futureRequirementsDue?.length >
                          0) && (
                        <div>
                          <h4 className="font-medium mb-3">
                            Requisitos Pendientes
                          </h4>
                          <div className="space-y-2">
                            {profile.kycProfile.requirementsDue?.map(
                              (req, index) => (
                                <Badge
                                  key={index}
                                  variant="destructive"
                                  className="mr-2"
                                >
                                  {req}
                                </Badge>
                              )
                            )}
                            {profile.kycProfile.futureRequirementsDue?.map(
                              (req, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="mr-2"
                                >
                                  {req} (futuro)
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
