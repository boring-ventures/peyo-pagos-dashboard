"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  useFeeConfigs,
  useCreateFeeConfig,
  useUpdateFeeConfig,
  useDeleteFeeConfig,
} from "@/hooks/use-system-config";
import { FeeType } from "@prisma/client";
import {
  FeeConfig,
  UpdateFeeConfigRequest,
  CreateFeeConfigRequest,
} from "@/types/system-config";

import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function FeeConfigsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFeeType, setSelectedFeeType] = useState<string>("all");
  const [editingFee, setEditingFee] = useState<FeeConfig | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data, isLoading, error } = useFeeConfigs({ includeStats: true });
  const createFee = useCreateFeeConfig();
  const updateFee = useUpdateFeeConfig();
  const deleteFee = useDeleteFeeConfig();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        Cargando tarifas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error al cargar las tarifas: {error.message}
      </div>
    );
  }

  const fees = data?.fees || [];
  const stats = data?.stats;

  // Filter fees based on search and filters
  const filteredFees = fees.filter((fee) => {
    const matchesSearch =
      fee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || fee.category === selectedCategory;
    const matchesFeeType =
      selectedFeeType === "all" || fee.feeType === selectedFeeType;
    return matchesSearch && matchesCategory && matchesFeeType;
  });

  // Get unique categories and fee types for filters
  const categories = [
    ...new Set(fees.map((fee) => fee.category).filter(Boolean)),
  ];
  const feeTypes = Object.values(FeeType);

  const handleCreateFee = async (data: CreateFeeConfigRequest) => {
    try {
      await createFee.mutateAsync(data);
      toast({
        title: "Tarifa creada",
        description: "La tarifa se ha creado correctamente.",
      });
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la tarifa.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateFee = async (
    feeId: string,
    data: UpdateFeeConfigRequest
  ) => {
    try {
      await updateFee.mutateAsync({ feeId, data });
      toast({
        title: "Tarifa actualizada",
        description: "La tarifa se ha actualizado correctamente.",
      });
      setIsEditDialogOpen(false);
      setEditingFee(null);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarifa.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFee = async (feeId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarifa?")) {
      return;
    }

    try {
      await deleteFee.mutateAsync(feeId);
      toast({
        title: "Tarifa eliminada",
        description: "La tarifa se ha eliminado correctamente.",
      });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarifa.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default">Activa</Badge>
    ) : (
      <Badge variant="secondary">Inactiva</Badge>
    );
  };

  const getFeeTypeBadge = (feeType: FeeType) => {
    const colors = {
      DEVELOPER_FEE: "bg-blue-100 text-blue-800",
      CREDIT_CARD_EMISSION_FEE: "bg-green-100 text-green-800",
      TRANSACTION_FEE: "bg-purple-100 text-purple-800",
      WITHDRAWAL_FEE: "bg-orange-100 text-orange-800",
      DEPOSIT_FEE: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={colors[feeType]}>{feeType.replace(/_/g, " ")}</Badge>
    );
  };

  const getFeeStructureBadge = (structure: string) => {
    const colors = {
      percentage: "bg-blue-100 text-blue-800",
      fixed_amount: "bg-green-100 text-green-800",
      tiered: "bg-purple-100 text-purple-800",
    };
    return (
      <Badge className={colors[structure] || "bg-gray-100 text-gray-800"}>
        {structure.replace(/_/g, " ")}
      </Badge>
    );
  };

  const formatAmount = (
    amount: number,
    currency: string,
    structure: string
  ) => {
    if (structure === "percentage") {
      return `${amount}%`;
    }
    return `${currency} ${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Tarifas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFees}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeFees}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactivas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.inactiveFees}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tipos de Tarifa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(stats.feesByType).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Buscar tarifas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:max-w-sm"
          />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="sm:max-w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedFeeType} onValueChange={setSelectedFeeType}>
            <SelectTrigger className="sm:max-w-[180px]">
              <SelectValue placeholder="Tipo de Tarifa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {feeTypes.map((feeType) => (
                <SelectItem key={feeType} value={feeType}>
                  {feeType.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Tarifa
        </Button>
      </div>

      {/* Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Tarifas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estructura</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Moneda</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Última Modificación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell className="font-medium">{fee.name}</TableCell>
                  <TableCell>{getFeeTypeBadge(fee.feeType)}</TableCell>
                  <TableCell>
                    {getFeeStructureBadge(fee.feeStructure)}
                  </TableCell>
                  <TableCell>
                    {formatAmount(fee.amount, fee.currency, fee.feeStructure)}
                  </TableCell>
                  <TableCell>{fee.currency}</TableCell>
                  <TableCell>{getStatusBadge(fee.isActive)}</TableCell>
                  <TableCell>{fee.category || "-"}</TableCell>
                  <TableCell>
                    {fee.lastModifiedAt
                      ? format(
                          new Date(fee.lastModifiedAt),
                          "dd/MM/yyyy HH:mm",
                          { locale: es }
                        )
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingFee(fee);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteFee(fee.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nueva Tarifa</DialogTitle>
          </DialogHeader>
          <CreateFeeForm
            onSave={handleCreateFee}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Tarifa</DialogTitle>
          </DialogHeader>
          {editingFee && (
            <EditFeeForm
              fee={editingFee}
              onSave={handleUpdateFee}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingFee(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateFeeForm({
  onSave,
  onCancel,
}: {
  onSave: (data: CreateFeeConfigRequest) => Promise<void>;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    currency: "USD",
    feeStructure: "percentage",
    minAmount: "",
    maxAmount: "",
    isActive: true,
    category: "",
    feeType: "DEVELOPER_FEE",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateFeeConfigRequest = {
      ...formData,
      amount: parseFloat(formData.amount),
      minAmount: formData.minAmount ? parseFloat(formData.minAmount) : undefined,
      maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : undefined,
    };
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Descripción</label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Monto</label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Moneda</label>
          <Select
            value={formData.currency}
            onValueChange={(value) =>
              setFormData({ ...formData, currency: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="MXN">MXN</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Estructura de Tarifa</label>
        <Select
          value={formData.feeStructure}
          onValueChange={(value) =>
            setFormData({ ...formData, feeStructure: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">Porcentaje</SelectItem>
            <SelectItem value="fixed_amount">Monto Fijo</SelectItem>
            <SelectItem value="tiered">Por Niveles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Monto Mínimo</label>
          <Input
            type="number"
            step="0.01"
            value={formData.minAmount}
            onChange={(e) =>
              setFormData({ ...formData, minAmount: e.target.value })
            }
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Monto Máximo</label>
          <Input
            type="number"
            step="0.01"
            value={formData.maxAmount}
            onChange={(e) =>
              setFormData({ ...formData, maxAmount: e.target.value })
            }
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Estado</label>
        <Select
          value={formData.isActive.toString()}
          onValueChange={(value) =>
            setFormData({ ...formData, isActive: value === "true" })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Activa</SelectItem>
            <SelectItem value="false">Inactiva</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Categoría</label>
        <Input
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tipo de Tarifa</label>
        <Select
          value={formData.feeType}
          onValueChange={(value) =>
            setFormData({ ...formData, feeType: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DEVELOPER_FEE">Desarrollador</SelectItem>
            <SelectItem value="CREDIT_CARD_EMISSION_FEE">
              Tarifa de Emisión de Tarjeta de Crédito
            </SelectItem>
            <SelectItem value="TRANSACTION_FEE">
              Tarifa de Transacción
            </SelectItem>
            <SelectItem value="WITHDRAWAL_FEE">Tarifa de Retiro</SelectItem>
            <SelectItem value="DEPOSIT_FEE">Tarifa de Depósito</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Crear Tarifa</Button>
      </div>
    </form>
  );
}

function EditFeeForm({
  fee,
  onSave,
  onCancel,
}: {
  fee: FeeConfig;
  onSave: (feeId: string, data: UpdateFeeConfigRequest) => Promise<void>;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: fee.name,
    description: fee.description || "",
    amount: fee.amount,
    currency: fee.currency,
    feeStructure: fee.feeStructure,
    minAmount: fee.minAmount || "",
    maxAmount: fee.maxAmount || "",
    isActive: fee.isActive,
    category: fee.category || "",
    changeReason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      minAmount: formData.minAmount ? parseFloat(formData.minAmount) : null,
      maxAmount: formData.maxAmount ? parseFloat(formData.maxAmount) : null,
      amount: parseFloat(formData.amount),
    };
    await onSave(fee.id, data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Descripción</label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Monto</label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Moneda</label>
          <Select
            value={formData.currency}
            onValueChange={(value) =>
              setFormData({ ...formData, currency: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="MXN">MXN</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Estructura de Tarifa</label>
        <Select
          value={formData.feeStructure}
          onValueChange={(value) =>
            setFormData({ ...formData, feeStructure: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">Porcentaje</SelectItem>
            <SelectItem value="fixed_amount">Monto Fijo</SelectItem>
            <SelectItem value="tiered">Por Niveles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Monto Mínimo</label>
          <Input
            type="number"
            step="0.01"
            value={formData.minAmount}
            onChange={(e) =>
              setFormData({ ...formData, minAmount: e.target.value })
            }
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Monto Máximo</label>
          <Input
            type="number"
            step="0.01"
            value={formData.maxAmount}
            onChange={(e) =>
              setFormData({ ...formData, maxAmount: e.target.value })
            }
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Estado</label>
        <Select
          value={formData.isActive.toString()}
          onValueChange={(value) =>
            setFormData({ ...formData, isActive: value === "true" })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Activa</SelectItem>
            <SelectItem value="false">Inactiva</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Categoría</label>
        <Input
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Razón del cambio</label>
        <Textarea
          value={formData.changeReason}
          onChange={(e) =>
            setFormData({ ...formData, changeReason: e.target.value })
          }
          placeholder="Opcional: explica por qué estás haciendo este cambio"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar Cambios</Button>
      </div>
    </form>
  );
}
