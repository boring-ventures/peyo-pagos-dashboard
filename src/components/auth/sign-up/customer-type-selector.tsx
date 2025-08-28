"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const customerTypeSchema = z.object({
  customerType: z.enum(["individual", "business"], {
    required_error: "Por favor selecciona un tipo de cuenta",
  }),
});

type CustomerTypeData = z.infer<typeof customerTypeSchema>;

interface CustomerTypeSelectorProps {
  onContinue: (customerType: "individual" | "business") => void;
  className?: string;
  defaultValue?: "individual" | "business";
}

export function CustomerTypeSelector({ 
  onContinue, 
  className, 
  defaultValue 
}: CustomerTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<"individual" | "business" | null>(
    defaultValue || null
  );

  const form = useForm<CustomerTypeData>({
    resolver: zodResolver(customerTypeSchema),
    defaultValues: {
      customerType: defaultValue,
    },
  });

  const handleSubmit = (data: CustomerTypeData) => {
    onContinue(data.customerType);
  };

  const customerTypes = [
    {
      value: "individual" as const,
      title: "Cliente Individual",
      description: "Cuenta personal para uso individual",
      icon: User,
      features: [
        "Verificación KYC personal",
        "Gestión de cuenta individual", 
        "Verificación de documentos personales",
        "Proceso de verificación estándar",
      ],
      timeframe: "La verificación generalmente toma 1-2 días hábiles",
    },
    {
      value: "business" as const,
      title: "Cliente Empresarial",
      description: "Próximamente disponible - En desarrollo",
      icon: Building2,
      features: [
        "KYB empresarial (TBD)",
        "Verificación de beneficiarios reales (TBD)",
        "Documentos empresariales (TBD)",
        "Diligencia debida mejorada (TBD)",
      ],
      timeframe: "Funcionalidad en desarrollo",
      disabled: true,
    },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* PEYO Logo */}
      <div className="text-center">
        <Image
          src="/assets/logo.png"
          alt="PEYO Logo"
          width={120}
          height={40}
          className="mx-auto"
        />
      </div>
      
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Elige el Tipo de Cuenta
        </h1>
        <p className="text-muted-foreground">
          Selecciona el tipo de cuenta que deseas crear
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="customerType"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedType(value as "individual" | "business");
                    }}
                    defaultValue={field.value}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                  >
                    {customerTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = selectedType === type.value;
                      const isDisabled = type.disabled || false;
                      
                      return (
                        <div key={type.value}>
                          <FormItem className="flex items-center space-y-0">
                            <FormControl>
                              <RadioGroupItem 
                                value={type.value} 
                                id={type.value}
                                className="sr-only"
                                disabled={isDisabled}
                              />
                            </FormControl>
                            <FormLabel
                              htmlFor={type.value}
                              className={cn(
                                "flex-1",
                                isDisabled 
                                  ? "cursor-not-allowed opacity-60" 
                                  : "cursor-pointer"
                              )}
                            >
                              <Card
                                className={cn(
                                  "transition-all duration-200",
                                  !isDisabled && "hover:shadow-md",
                                  isSelected && !isDisabled && "ring-2 ring-primary border-primary",
                                  isDisabled && "bg-muted/50 border-dashed"
                                )}
                              >
                                <CardHeader className="pb-3">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        isSelected && !isDisabled
                                          ? "bg-primary text-primary-foreground" 
                                          : isDisabled 
                                            ? "bg-muted/50" 
                                            : "bg-muted"
                                      )}
                                    >
                                      <Icon className={cn("h-5 w-5", isDisabled && "opacity-50")} />
                                    </div>
                                    <div className="flex-1">
                                      <CardTitle className="text-base">
                                        {type.title}
                                      </CardTitle>
                                      <CardDescription className="text-sm">
                                        {type.description}
                                      </CardDescription>
                                    </div>
                                    {isSelected && (
                                      <CheckCircle2 className="h-5 w-5 text-primary" />
                                    )}
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0 space-y-4">
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium">
                                      Lo que necesitarás:
                                    </h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                      {type.features.map((feature, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                          {feature}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="pt-2 border-t border-border/50">
                                    <p className="text-xs text-muted-foreground">
                                      {type.timeframe}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            </FormLabel>
                          </FormItem>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-center">
            <Button 
              type="submit" 
              size="lg"
              disabled={!selectedType || selectedType === "business"}
              className="min-w-[200px]"
            >
              {selectedType === "business" ? "Próximamente" : "Continuar"}
              {selectedType !== "business" && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </form>
      </Form>

      <div className="text-center space-y-2 pt-6 border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          ¿Necesitas ayuda para elegir? 
        </p>
        <p className="text-xs text-muted-foreground max-w-lg mx-auto">
          Las cuentas individuales son para uso personal, mientras que las cuentas empresariales son para
          compañías, organizaciones y actividades comerciales. Siempre puedes contactar
          soporte si no estás seguro de qué opción es la adecuada para ti.
        </p>
      </div>
    </div>
  );
}