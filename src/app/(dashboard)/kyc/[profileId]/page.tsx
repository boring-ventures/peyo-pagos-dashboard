"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { ExpandableImage } from "@/components/ui/expandable-image";
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
  RefreshCw,
  Hash,
  Activity,
  UserPlus,
  Send,
  Eye,
  CheckCheck,
  X,
} from "lucide-react";
import type {
  ProfileWithKYC,
  KYCProfileWithRelations,
  Event,
} from "@/types/kyc";

interface EndorsementRequirements {
  complete?: string[];
  pending?: string[];
  issues?: string[];
  missing?: string | null;
}
import {
  KYC_STATUS_LABELS,
  USER_ROLE_LABELS,
  USER_STATUS_LABELS,
  ENDORSEMENT_TYPE_LABELS,
  ENDORSEMENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  EVENT_MODULE_LABELS,
} from "@/types/kyc";

export default function KYCProfileDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.profileId as string;

  const [profile, setProfile] = useState<ProfileWithKYC | null>(null);
  const [kycDetails, setKycDetails] = useState<KYCProfileWithRelations | null>(
    null
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

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

  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      const response = await fetch(`/api/kyc/${profileId}/events`);

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos",
        variant: "destructive",
      });
    } finally {
      setLoadingEvents(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (profileId) {
      fetchProfileDetails();
      fetchEvents();
    }
  }, [profileId, fetchProfileDetails, fetchEvents]);

  const handleRefreshFromBridge = async () => {
    if (!profile?.kycProfile?.bridgeCustomerId) {
      toast({
        title: "Error",
        description: "No se encontró Customer ID de Bridge Protocol",
        variant: "destructive",
      });
      return;
    }

    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/kyc/${profileId}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al refrescar datos");
      }

      toast({
        title: "Datos actualizados",
        description: `${data.message}. ${data.updatedFields} campos actualizados.`,
      });

      // Refresh the profile details and events after successful update
      await fetchProfileDetails();
      await fetchEvents();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al refrescar datos desde Bridge Protocol";
      console.error("Error refreshing from Bridge:", error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (profileId) {
      fetchProfileDetails();
      fetchEvents();
    }
  }, [profileId, fetchProfileDetails, fetchEvents]);

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

  // Helper function to construct full Supabase storage URLs
  const getFullDocumentUrl = (
    filePath: string | null | undefined
  ): string | null => {
    if (!filePath || typeof filePath !== "string" || filePath.trim() === "") {
      return null;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error(
        "NEXT_PUBLIC_SUPABASE_URL environment variable is not defined"
      );
      return null;
    }

    // Construct the full URL
    return `${supabaseUrl}/storage/v1/object/public/documents/${filePath}`;
  };

  // Helper function to validate URLs
  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== "string" || url.trim() === "") {
      return false;
    }

    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
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

  const getEventIcon = (eventType: Event["type"]) => {
    switch (eventType) {
      case "USER_SIGNED_UP":
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case "USER_SUBMITTED_KYC":
        return <Send className="w-4 h-4 text-purple-600" />;
      case "USER_KYC_UNDER_VERIFICATION":
        return <Eye className="w-4 h-4 text-yellow-600" />;
      case "USER_KYC_APPROVED":
        return <CheckCheck className="w-4 h-4 text-green-600" />;
      case "USER_KYC_REJECTED":
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventColor = (eventType: Event["type"]) => {
    switch (eventType) {
      case "USER_SIGNED_UP":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "USER_SUBMITTED_KYC":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "USER_KYC_UNDER_VERIFICATION":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "USER_KYC_APPROVED":
        return "bg-green-50 text-green-700 border-green-200";
      case "USER_KYC_REJECTED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
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
      <div className="flex items-center justify-between">
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
        {profile.kycProfile?.bridgeCustomerId && (
          <Button
            onClick={handleRefreshFromBridge}
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Actualizando..." : "Refrescar desde Bridge"}
          </Button>
        )}
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
              {kycDetails?.bridgeCustomerId && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Hash className="h-3 w-3" />
                  Bridge ID:{" "}
                  <span className="font-mono">
                    {kycDetails.bridgeCustomerId}
                  </span>
                </p>
              )}
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
          <TabsList className="grid w-full grid-cols-7 p-1">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="verification">Verificación</TabsTrigger>
            <TabsTrigger value="endorsements">Endorsements</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
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

              {/* Endorsements */}
              {kycDetails?.endorsements &&
                kycDetails.endorsements.length > 0 && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Endorsements Bridge Protocol
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {kycDetails.endorsements.map((endorsement) => (
                        <div
                          key={endorsement.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline" className="font-medium">
                              {ENDORSEMENT_TYPE_LABELS[endorsement.name]}
                            </Badge>
                            <Badge
                              variant={
                                endorsement.status === "approved"
                                  ? "default"
                                  : endorsement.status === "revoked"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className={
                                endorsement.status === "approved"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : ""
                              }
                            >
                              {ENDORSEMENT_STATUS_LABELS[endorsement.status]}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {endorsement.requirements &&
                              typeof endorsement.requirements === "object" &&
                              "complete" in endorsement.requirements && (
                                <div className="space-y-1">
                                  <span>
                                    {(
                                      endorsement.requirements as EndorsementRequirements
                                    ).complete?.length || 0}{" "}
                                    completados
                                  </span>
                                  {(
                                    endorsement.requirements as EndorsementRequirements
                                  ).pending &&
                                    (
                                      endorsement.requirements as EndorsementRequirements
                                    ).pending!.length > 0 && (
                                      <span className="block text-yellow-600">
                                        {
                                          (
                                            endorsement.requirements as EndorsementRequirements
                                          ).pending!.length
                                        }{" "}
                                        pendientes
                                      </span>
                                    )}
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
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
                        {(() => {
                          const fullUrl = getFullDocumentUrl(doc.fileUrl);
                          return fullUrl && isValidUrl(fullUrl) ? (
                            <div className="mt-3 space-y-2">
                              <p className="text-sm font-medium">Archivo:</p>
                              <ExpandableImage
                                src={fullUrl}
                                alt={doc.description || "Documento"}
                                title={
                                  doc.description || `Documento ${index + 1}`
                                }
                                description={`Subido: ${formatDate(doc.createdAt)} • Tamaño: ${doc.fileSize ? Math.round(doc.fileSize / 1024) + " KB" : "N/A"}`}
                                width={400}
                                height={256}
                                className="max-w-md"
                                expandButtonPosition="center"
                              />
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    window.open(fullUrl, "_blank");
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Ver archivo
                                </Button>
                              </div>
                            </div>
                          ) : null;
                        })()}
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
                        {(() => {
                          const frontUrl = getFullDocumentUrl(info.imageFront);
                          const backUrl = getFullDocumentUrl(info.imageBack);
                          const hasValidFront =
                            frontUrl && isValidUrl(frontUrl);
                          const hasValidBack = backUrl && isValidUrl(backUrl);

                          return hasValidFront || hasValidBack ? (
                            <div className="mt-4 space-y-3">
                              <p className="text-sm font-medium">
                                Imágenes del documento:
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {hasValidFront && (
                                  <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                      Frente:
                                    </p>
                                    <ExpandableImage
                                      src={frontUrl!}
                                      alt="Documento - Frente"
                                      title={`${info.type} - Frente`}
                                      description={`País emisor: ${info.issuingCountry} • Número: ${info.number || "No especificado"}`}
                                      width={300}
                                      height={192}
                                      expandButtonPosition="center"
                                    />
                                  </div>
                                )}
                                {hasValidBack && (
                                  <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                      Reverso:
                                    </p>
                                    <ExpandableImage
                                      src={backUrl!}
                                      alt="Documento - Reverso"
                                      title={`${info.type} - Reverso`}
                                      description={`País emisor: ${info.issuingCountry} • Número: ${info.number || "No especificado"}`}
                                      width={300}
                                      height={192}
                                      expandButtonPosition="center"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null;
                        })()}
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

          {/* Endorsements Tab */}
          <TabsContent value="endorsements">
            {kycDetails?.endorsements && kycDetails.endorsements.length > 0 ? (
              <div className="space-y-6">
                {kycDetails.endorsements.map((endorsement) => (
                  <Card key={endorsement.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Shield className="h-6 w-6" />
                          {ENDORSEMENT_TYPE_LABELS[endorsement.name]}
                        </CardTitle>
                        <Badge
                          variant={
                            endorsement.status === "approved"
                              ? "default"
                              : endorsement.status === "revoked"
                                ? "destructive"
                                : "secondary"
                          }
                          className={
                            endorsement.status === "approved"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : ""
                          }
                        >
                          {ENDORSEMENT_STATUS_LABELS[endorsement.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {endorsement.requirements &&
                        typeof endorsement.requirements === "object" && (
                          <div className="space-y-6">
                            {/* Completados */}
                            {"complete" in endorsement.requirements &&
                              (
                                endorsement.requirements as EndorsementRequirements
                              ).complete &&
                              (
                                endorsement.requirements as EndorsementRequirements
                              ).complete!.length > 0 && (
                                <div>
                                  <h3 className="text-lg font-semibold text-green-600 mb-3">
                                    ✅ Requisitos Completados (
                                    {
                                      (
                                        endorsement.requirements as EndorsementRequirements
                                      ).complete!.length
                                    }
                                    )
                                  </h3>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {(
                                      endorsement.requirements as EndorsementRequirements
                                    ).complete!.map(
                                      (req: string, index: number) => (
                                        <Badge
                                          key={index}
                                          variant="outline"
                                          className="justify-start p-3 bg-green-50 text-green-700 border-green-200"
                                        >
                                          {req
                                            .replace(/_/g, " ")
                                            .replace(/\b\w/g, (l) =>
                                              l.toUpperCase()
                                            )}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Pendientes */}
                            {"pending" in endorsement.requirements &&
                              (
                                endorsement.requirements as EndorsementRequirements
                              ).pending &&
                              (
                                endorsement.requirements as EndorsementRequirements
                              ).pending!.length > 0 && (
                                <div>
                                  <h3 className="text-lg font-semibold text-yellow-600 mb-3">
                                    ⏳ Requisitos Pendientes (
                                    {
                                      (
                                        endorsement.requirements as EndorsementRequirements
                                      ).pending!.length
                                    }
                                    )
                                  </h3>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {(
                                      endorsement.requirements as EndorsementRequirements
                                    ).pending!.map(
                                      (req: string, index: number) => (
                                        <Badge
                                          key={index}
                                          variant="outline"
                                          className="justify-start p-3 bg-yellow-50 text-yellow-700 border-yellow-200"
                                        >
                                          {req
                                            .replace(/_/g, " ")
                                            .replace(/\b\w/g, (l) =>
                                              l.toUpperCase()
                                            )}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Issues */}
                            {"issues" in endorsement.requirements &&
                              (
                                endorsement.requirements as EndorsementRequirements
                              ).issues &&
                              (
                                endorsement.requirements as EndorsementRequirements
                              ).issues!.length > 0 && (
                                <div>
                                  <h3 className="text-lg font-semibold text-red-600 mb-3">
                                    ❌ Issues (
                                    {
                                      (
                                        endorsement.requirements as EndorsementRequirements
                                      ).issues!.length
                                    }
                                    )
                                  </h3>
                                  <div className="grid grid-cols-1 gap-3">
                                    {(
                                      endorsement.requirements as EndorsementRequirements
                                    ).issues!.map(
                                      (issue: string, index: number) => (
                                        <Badge
                                          key={index}
                                          variant="destructive"
                                          className="justify-start p-3"
                                        >
                                          {issue
                                            .replace(/_/g, " ")
                                            .replace(/\b\w/g, (l) =>
                                              l.toUpperCase()
                                            )}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Missing */}
                            {"missing" in endorsement.requirements &&
                              endorsement.requirements.missing !== null && (
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-600 mb-3">
                                    🔍 Información Faltante
                                  </h3>
                                  <Badge
                                    variant="outline"
                                    className="p-3 bg-gray-50 text-gray-700 border-gray-200"
                                  >
                                    {(
                                      endorsement.requirements.missing as string
                                    )
                                      .replace(/_/g, " ")
                                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                                  </Badge>
                                </div>
                              )}
                          </div>
                        )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">Sin Endorsements</h3>
                  <p className="text-muted-foreground">
                    No hay endorsements de Bridge Protocol para este perfil KYC
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Historial de Eventos
                </CardTitle>
                <CardDescription>
                  Cronología de eventos de autenticación y KYC para este usuario
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingEvents ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-4 border rounded-lg"
                      >
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : events.length > 0 ? (
                  <div className="space-y-4">
                    {events
                      .slice()
                      .reverse()
                      .map((event, index) => (
                        <div
                          key={event.id}
                          className={`flex items-start gap-3 p-4 border rounded-lg transition-colors hover:bg-gray-50/50 ${index === events.length - 1 ? "ring-2 ring-primary/20 bg-primary/5" : ""}`}
                        >
                          <div
                            className={`p-2 rounded-full ${getEventColor(event.type).split(" ").slice(0, 1).join(" ")}`}
                          >
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant="outline"
                                className={getEventColor(event.type)}
                              >
                                {EVENT_TYPE_LABELS[event.type]}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {EVENT_MODULE_LABELS[event.module]}
                              </Badge>
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(event.createdAt)}
                            </div>
                            {event.metadata &&
                              Object.keys(event.metadata).length > 0 && (
                                <details className="mt-2">
                                  <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                                    Ver detalles adicionales
                                  </summary>
                                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                    {JSON.stringify(event.metadata, null, 2)}
                                  </pre>
                                </details>
                              )}
                          </div>
                          {index === events.length - 1 && (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              Más reciente
                            </Badge>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-medium mb-2">Sin eventos</h3>
                      <p className="text-muted-foreground">
                        No hay eventos registrados para este usuario
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Debug Tab */}
          <TabsContent value="debug">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Bridge Protocol - Respuesta Completa
                </CardTitle>
                <CardDescription>
                  Información de debugging con la respuesta completa de la API
                  de Bridge Protocol
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.kycProfile?.bridgeRawResponse ? (
                  <div className="space-y-4">
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(
                          profile.kycProfile.bridgeRawResponse,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>
                        <strong>Bridge Customer ID:</strong>{" "}
                        {profile.kycProfile.bridgeCustomerId || "No asignado"}
                      </p>
                      <p>
                        <strong>Última actualización:</strong>{" "}
                        {formatDate(profile.kycProfile.updatedAt)}
                      </p>
                      <p>
                        <strong>Estado KYC:</strong>{" "}
                        {KYC_STATUS_LABELS[profile.kycProfile.kycStatus]}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Sin datos de Bridge Protocol
                    </h3>
                    <p className="text-muted-foreground">
                      No se ha registrado ninguna respuesta de la API de Bridge
                      Protocol para este perfil KYC
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
