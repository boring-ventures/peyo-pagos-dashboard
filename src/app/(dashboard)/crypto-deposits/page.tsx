"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/providers/auth-provider";
import { useCryptoDeposits, useDeleteCryptoDeposit } from "@/hooks/use-crypto-deposits";
import { CreateCryptoDepositModal } from "./components/create-crypto-deposit-modal";
import { EditCryptoDepositModal } from "./components/edit-crypto-deposit-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Coins,
  Plus,
  Settings,
  Shield,
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { canAccessModule } from "@/lib/auth/role-permissions";
import type { CryptoDepositConfig } from "@/types/crypto-deposits";
import { toast } from "@/components/ui/use-toast";

export default function CryptoDepositsPage() {
  const { profile } = useAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<CryptoDepositConfig | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<CryptoDepositConfig | null>(null);

  const { data, isLoading, error, refetch } = useCryptoDeposits();
  const deleteMutation = useDeleteCryptoDeposit();
  // We'll create toggle mutations dynamically

  // Check if user has access to crypto deposits (only SUPERADMIN)
  if (!profile || !canAccessModule(profile.role, "system-config")) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to access this module. Only super
              administrators can manage crypto deposit configurations.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleEdit = (config: CryptoDepositConfig) => {
    setSelectedConfig(config);
    setEditModalOpen(true);
  };

  const handleDelete = (config: CryptoDepositConfig) => {
    setConfigToDelete(config);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!configToDelete) return;

    try {
      await deleteMutation.mutateAsync(configToDelete.id);
      toast({
        title: "Configuration Deleted",
        description: `${configToDelete.displayName} configuration has been deleted.`,
      });
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete configuration",
        variant: "destructive",
      });
    }
  };

  const handleToggle = async (config: CryptoDepositConfig, isEnabled: boolean) => {
    try {
      const response = await fetch(`/api/crypto-deposits/${config.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isEnabled }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Refetch data to update UI
      refetch();
      
      toast({
        title: "Configuration Updated",
        description: `${config.displayName} has been ${isEnabled ? "enabled" : "disabled"}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update configuration",
        variant: "destructive",
      });
    }
  };

  const getRiskLevelBadge = (riskLevel: "low" | "medium" | "high") => {
    const colors = {
      low: "bg-green-50 text-green-700 border-green-200",
      medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
      high: "bg-red-50 text-red-700 border-red-200",
    };

    return (
      <Badge variant="outline" className={colors[riskLevel]}>
        {riskLevel.toUpperCase()}
      </Badge>
    );
  };

  const formatAmount = (amount?: number) => {
    if (amount === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Coins className="h-8 w-8 text-primary" />
            Crypto Deposits Configuration
          </h1>
          <p className="text-muted-foreground">
            Manage supported chains and deposit instructions for the mobile app
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Chain
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load crypto deposit configurations: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      {data?.configs.length && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Chains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.configs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Enabled Chains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.configs.filter((c) => c.isEnabled).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {data.configs.reduce(
                  (sum, config) => sum + config.supportedTokens.filter((t) => t.isEnabled).length,
                  0
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Supported Chains
          </CardTitle>
          <CardDescription>
            Configure which blockchain networks and tokens are supported for deposits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.configs.length ? (
            <div className="text-center py-12">
              <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Chains Configured</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first supported blockchain network
              </p>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Chain
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Processing</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {config.iconUrl && (
                          <Image
                            src={config.iconUrl}
                            alt={config.chainName}
                            className="h-8 w-8 rounded-full"
                            width={32}
                            height={32}
                          />
                        )}
                        <div>
                          <div className="font-medium">{config.displayName}</div>
                          <div className="text-sm text-muted-foreground">
                            {config.chainId}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={config.isEnabled}
                          onCheckedChange={(checked) => handleToggle(config, checked)}
                        />
                        <Badge
                          variant={config.isEnabled ? "default" : "secondary"}
                          className={
                            config.isEnabled
                              ? "bg-green-50 text-green-700 border-green-200"
                              : ""
                          }
                        >
                          {config.isEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {config.supportedTokens
                          .slice(0, 4)
                          .map((token) => (
                            <Badge 
                              key={token.id} 
                              variant={token.isEnabled ? "default" : "secondary"}
                              className={`text-xs ${token.isEnabled 
                                ? "bg-green-50 text-green-700 border-green-200" 
                                : "bg-gray-50 text-gray-500 border-gray-200"
                              }`}
                            >
                              {token.symbol}
                              {!token.isEnabled && " (disabled)"}
                            </Badge>
                          ))}
                        {config.supportedTokens.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{config.supportedTokens.length - 4}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {config.supportedTokens.filter((token) => token.isEnabled).length} enabled, {" "}
                        {config.supportedTokens.filter((token) => !token.isEnabled).length} disabled
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {config.minimumAmount && (
                          <div>Min: {formatAmount(config.minimumAmount)}</div>
                        )}
                        {config.maximumAmount && (
                          <div>Max: {formatAmount(config.maximumAmount)}</div>
                        )}
                        {!config.minimumAmount && !config.maximumAmount && (
                          <span className="text-muted-foreground">No limits</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getRiskLevelBadge(config.riskLevel)}</TableCell>
                    <TableCell>
                      <div className="text-sm">{config.processingTime}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(config)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {config.explorerUrl && (
                            <DropdownMenuItem asChild>
                              <a
                                href={config.explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Explorer
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(config)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateCryptoDepositModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      {selectedConfig && (
        <EditCryptoDepositModal
          open={editModalOpen}
          onOpenChange={(open) => {
            setEditModalOpen(open);
            if (!open) setSelectedConfig(null);
          }}
          config={selectedConfig}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the configuration for{" "}
              <strong>{configToDelete?.displayName}</strong>? This action cannot be undone
              and will remove all deposit options for this chain from the mobile app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}