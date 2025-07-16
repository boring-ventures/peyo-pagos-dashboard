"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  User,
  FileText,
  Calendar,
  Shield,
  Building,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
} from "lucide-react";
import type { ProfileWithKYC, KYCProfileWithRelations } from "@/types/kyc";
import {
  KYC_STATUS_LABELS,
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
} from "@/types/kyc";

export default function KYCProfileDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.profileId as string;

  const [profile, setProfile] = useState<ProfileWithKYC | null>(null);
  const [kycDetails, setKycDetails] = useState<KYCProfileWithRelations | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const fetchProfileDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/kyc/${profileId}/details`);

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Perfil no encontrado",
            description: "El perfil solicitado no existe",
            variant: "destructive",
          });
          router.push("/kyc");
          return;
        }
        throw new Error("Failed to fetch profile details");
      }

      const data = await response.json();
      setProfile(data.profile);
      setKycDetails(data.kycProfile);
    } catch (error) {
      console.error("Error fetching profile details:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profileId, router]);

  useEffect(() => {
    if (profileId) {
      fetchProfileDetails();
    }
  }, [profileId, fetchProfileDetails]);

  const getUserInitials = () => {
    if (!profile) return "U";
    if (profile.firstName || profile.lastName) {
      return [profile.firstName?.[0], profile.lastName?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase();
    }
    return profile.email?.[0]?.toUpperCase() || "U";
  };

  const getUserDisplayName = () => {
    if (!profile) return "Usuario";
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

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        {/* Profile Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-xl">Perfil no encontrado</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/kyc")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a KYC
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Detalles de KYC</h1>
          <p className="text-muted-foreground">
            Información completa del usuario y verificación
          </p>
        </div>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/10">
              <AvatarImage src="" alt={getUserDisplayName()} />
              <AvatarFallback className="text-lg bg-primary/10">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{getUserDisplayName()}</h2>
              <p className="text-muted-foreground flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {profile.email}
              </p>
              <div className="flex gap-2 mt-2">
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
                  {getStatusIcon(profile.status)}
                  {USER_STATUS_LABELS[profile.status]}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KYC Details */}
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
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Estado KYC
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(kycDetails?.kycStatus || "not_started")}
                    <Badge
                      variant="outline"
                      className={
                        kycDetails?.kycStatus === "active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : kycDetails?.kycStatus === "rejected"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }
                    >
                      {
                        KYC_STATUS_LABELS[
                          kycDetails?.kycStatus || "not_started"
                        ]
                      }
                    </Badge>
                  </div>

                  {kycDetails?.kycRejectionReason && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-red-600">
                          Razón de rechazo:
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {kycDetails.kycRejectionReason}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Fechas Importantes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Registro:</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(profile.createdAt)}
                    </p>
                  </div>

                  {kycDetails?.createdAt && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">KYC Iniciado:</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(kycDetails.createdAt)}
                      </p>
                    </div>
                  )}

                  {kycDetails?.kycApprovedAt && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">KYC Aprobado:</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(kycDetails.kycApprovedAt)}
                      </p>
                    </div>
                  )}

                  {kycDetails?.kycRejectedAt && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">KYC Rechazado:</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(kycDetails.kycRejectedAt)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Personal Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Nombre:</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.firstName || "No especificado"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Apellido:</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.lastName || "No especificado"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Email:</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.email}
                  </p>
                </div>

                {kycDetails?.address && (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Dirección:</p>
                      <p className="text-sm text-muted-foreground">
                        {kycDetails.address.streetLine1}
                        {kycDetails.address.streetLine2 &&
                          `, ${kycDetails.address.streetLine2}`}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Ciudad:</p>
                      <p className="text-sm text-muted-foreground">
                        {kycDetails.address.city}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Estado/Provincia:</p>
                      <p className="text-sm text-muted-foreground">
                        {kycDetails.address.subdivision || "No especificado"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Código Postal:</p>
                      <p className="text-sm text-muted-foreground">
                        {kycDetails.address.postalCode || "No especificado"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">País:</p>
                      <p className="text-sm text-muted-foreground">
                        {kycDetails.address.country}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kycDetails?.documents && kycDetails.documents.length > 0 ? (
                  <div className="space-y-4">
                    {kycDetails.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">
                            {doc.description || `Documento ${index + 1}`}
                          </p>
                          <Badge variant="outline">
                            {doc.fileUrl ? "Subido" : "Pendiente"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Subido: {formatDate(doc.createdAt)}
                        </p>
                        {doc.purposes && doc.purposes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {doc.purposes.map((purpose, purposeIndex) => (
                              <Badge
                                key={purposeIndex}
                                variant="secondary"
                                className="text-xs"
                              >
                                {purpose.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {doc.fileSize && (
                          <p className="text-xs text-muted-foreground">
                            Tamaño: {Math.round(doc.fileSize / 1024)} KB
                          </p>
                        )}

                        {/* Mostrar imagen del documento si está disponible */}
                        {doc.fileUrl && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm font-medium">Archivo:</p>
                            <div className="border rounded-lg overflow-hidden max-w-md">
                              <Image
                                src={doc.fileUrl}
                                alt={doc.description || "Documento"}
                                width={400}
                                height={256}
                                className="w-full h-64 object-cover"
                                onError={(e) => {
                                  // Si falla cargar la imagen, mostrar un placeholder
                                  e.currentTarget.src =
                                    "/placeholder-document.png";
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (doc.fileUrl) {
                                    window.open(doc.fileUrl, "_blank");
                                  }
                                }}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Ver archivo
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No se han subido documentos
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Información de Verificación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {kycDetails?.identifyingInfo &&
                kycDetails.identifyingInfo.length > 0 ? (
                  <div className="space-y-4">
                    {kycDetails.identifyingInfo.map((info, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Tipo:</p>
                            <p className="text-sm text-muted-foreground">
                              {info.type}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Número:</p>
                            <p className="text-sm text-muted-foreground">
                              {info.number || "No especificado"}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">País emisor:</p>
                            <p className="text-sm text-muted-foreground">
                              {info.issuingCountry}
                            </p>
                          </div>
                          {info.expiration && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Expiración:</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(info.expiration)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Sección de imágenes de documentos */}
                        {(info.imageFront || info.imageBack) && (
                          <div className="mt-4 space-y-3">
                            <p className="text-sm font-medium">
                              Imágenes del documento:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {info.imageFront && (
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    Frente:
                                  </p>
                                  <div className="border rounded-lg overflow-hidden">
                                    <Image
                                      src={info.imageFront}
                                      alt="Documento - Frente"
                                      width={300}
                                      height={192}
                                      className="w-full h-48 object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src =
                                          "/placeholder-document.png";
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                              {info.imageBack && (
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    Reverso:
                                  </p>
                                  <div className="border rounded-lg overflow-hidden">
                                    <Image
                                      src={info.imageBack}
                                      alt="Documento - Reverso"
                                      width={300}
                                      height={192}
                                      className="w-full h-48 object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src =
                                          "/placeholder-document.png";
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Creado: {formatDate(info.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No hay información de verificación disponible
                    </p>
                  </div>
                )}

                {kycDetails?.rejectionReasons &&
                  kycDetails.rejectionReasons.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-medium text-red-600">
                          Historial de Rechazos
                        </h4>
                        {kycDetails.rejectionReasons.map((rejection, index) => (
                          <div
                            key={index}
                            className="border border-red-200 rounded-lg p-4 space-y-2"
                          >
                            <p className="text-sm font-medium">
                              {rejection.reason}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {rejection.developerReason}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(rejection.createdAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
