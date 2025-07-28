"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings, CreditCard } from "lucide-react";
import { SystemConfigsTab } from "./components/system-configs-tab";
import { FeeConfigsTab } from "./components/fee-configs-tab";

export default function SystemConfigPage() {
  const [activeTab, setActiveTab] = useState("system-configs");

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Configuración del Sistema
        </h2>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="system-configs"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configuraciones Generales
          </TabsTrigger>
          <TabsTrigger value="fee-configs" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Configuración de Tarifas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system-configs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuraciones del Sistema</CardTitle>
              <CardDescription>
                Gestiona configuraciones generales del sistema, feature flags,
                límites y configuraciones de integración.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemConfigsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fee-configs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Tarifas</CardTitle>
              <CardDescription>
                Gestiona las tarifas aplicadas a transacciones cripto y emisión
                de tarjetas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeeConfigsTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
