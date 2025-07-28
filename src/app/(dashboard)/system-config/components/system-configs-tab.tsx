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
  useSystemConfigs,
  useCreateSystemConfig,
  useUpdateSystemConfig,
  useDeleteSystemConfig,
} from "@/hooks/use-system-config";
import { ConfigType, ConfigStatus } from "@prisma/client";
import {
  SystemConfig,
  UpdateSystemConfigRequest,
  CreateSystemConfigRequest,
} from "@/types/system-config";

import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function SystemConfigsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data, isLoading, error } = useSystemConfigs({ includeStats: true });
  const createConfig = useCreateSystemConfig();
  const updateConfig = useUpdateSystemConfig();
  const deleteConfig = useDeleteSystemConfig();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        Cargando configuraciones...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error al cargar las configuraciones: {error.message}
      </div>
    );
  }

  const configs = data?.configs || [];
  const stats = data?.stats;

  // Filter configs based on search and filters
  const filteredConfigs = configs.filter((config) => {
    const matchesSearch =
      config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || config.category === selectedCategory;
    const matchesType = selectedType === "all" || config.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Get unique categories and types for filters
  const categories = [
    ...new Set(configs.map((config) => config.category).filter(Boolean)),
  ];
  const types = Object.values(ConfigType);

  const handleCreateConfig = async (data: CreateSystemConfigRequest) => {
    try {
      await createConfig.mutateAsync(data);
      toast({
        title: "Configuración creada",
        description: "La configuración se ha creado correctamente.",
      });
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la configuración.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateConfig = async (
    configId: string,
    data: UpdateSystemConfigRequest
  ) => {
    try {
      await updateConfig.mutateAsync({ configId, data });
      toast({
        title: "Configuración actualizada",
        description: "La configuración se ha actualizado correctamente.",
      });
      setIsEditDialogOpen(false);
      setEditingConfig(null);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta configuración?")) {
      return;
    }

    try {
      await deleteConfig.mutateAsync(configId);
      toast({
        title: "Configuración eliminada",
        description: "La configuración se ha eliminado correctamente.",
      });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo eliminar la configuración.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: ConfigStatus) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      deprecated: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getTypeBadge = (type: ConfigType) => {
    const colors = {
      FEE: "bg-blue-100 text-blue-800",
      LIMIT: "bg-orange-100 text-orange-800",
      FEATURE_FLAG: "bg-green-100 text-green-800",
      INTEGRATION_SETTING: "bg-purple-100 text-purple-800",
    };
    return <Badge className={colors[type]}>{type}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Configuraciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConfigs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeConfigs}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactivas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.inactiveConfigs}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorías</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(stats.configsByCategory).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Buscar configuraciones..."
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
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="sm:max-w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Configuración
        </Button>
      </div>

      {/* Configurations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configuraciones del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Clave</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Última Modificación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConfigs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell className="font-medium">{config.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {config.key}
                  </TableCell>
                  <TableCell>{getTypeBadge(config.type)}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate">
                      {typeof config.value === "object"
                        ? JSON.stringify(config.value)
                        : String(config.value)}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(config.status)}</TableCell>
                  <TableCell>{config.category || "-"}</TableCell>
                  <TableCell>
                    {config.lastModifiedAt
                      ? format(
                          new Date(config.lastModifiedAt),
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
                            setEditingConfig(config);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteConfig(config.id)}
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
            <DialogTitle>Nueva Configuración</DialogTitle>
          </DialogHeader>
          <CreateConfigForm
            onSave={handleCreateConfig}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Configuración</DialogTitle>
          </DialogHeader>
          {editingConfig && (
            <EditConfigForm
              config={editingConfig}
              onSave={handleUpdateConfig}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingConfig(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateConfigForm({
  onSave,
  onCancel,
}: {
  onSave: (data: CreateSystemConfigRequest) => Promise<void>;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    description: "",
    value: "",
    type: "FEE",
    category: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedValue = JSON.parse(formData.value);
      await onSave({
        name: formData.name,
        key: formData.key,
        description: formData.description,
        value: parsedValue,
        type: formData.type as ConfigType,
        category: formData.category,
      });
    } catch (error: any) {
      toast({
        title: "Error al crear configuración",
        description: error.message || "El valor no es un JSON válido.",
        variant: "destructive",
      });
    }
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
        <label className="text-sm font-medium">Clave</label>
        <Input
          value={formData.key}
          onChange={(e) => setFormData({ ...formData, key: e.target.value })}
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

      <div className="space-y-2">
        <label className="text-sm font-medium">Valor (JSON)</label>
        <Textarea
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          placeholder='Ejemplo: {"apiKey": "your_api_key"}'
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tipo</label>
        <Select
          value={formData.type}
          onValueChange={(value) =>
            setFormData({ ...formData, type: value as ConfigType })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FEE">FEE</SelectItem>
            <SelectItem value="LIMIT">LIMIT</SelectItem>
            <SelectItem value="FEATURE_FLAG">FEATURE_FLAG</SelectItem>
            <SelectItem value="INTEGRATION_SETTING">
              INTEGRATION_SETTING
            </SelectItem>
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

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Crear Configuración</Button>
      </div>
    </form>
  );
}

function EditConfigForm({
  config,
  onSave,
  onCancel,
}: {
  config: SystemConfig;
  onSave: (configId: string, data: UpdateSystemConfigRequest) => Promise<void>;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: config.name,
    description: config.description || "",
    value: config.value,
    status: config.status,
    category: config.category || "",
    changeReason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(config.id, formData);
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

      <div className="space-y-2">
        <label className="text-sm font-medium">Valor</label>
        <Input
          value={
            typeof formData.value === "object"
              ? JSON.stringify(formData.value)
              : String(formData.value)
          }
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setFormData({ ...formData, value: parsed });
            } catch {
              setFormData({ ...formData, value: e.target.value });
            }
          }}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Estado</label>
        <Select
          value={formData.status}
          onValueChange={(value) =>
            setFormData({ ...formData, status: value as ConfigStatus })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
            <SelectItem value="deprecated">Deprecado</SelectItem>
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
