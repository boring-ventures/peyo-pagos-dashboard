"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowRight, 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Users, 
  FileText, 
  CheckCircle2,
  Loader2,
  AlertCircle,
  Plus,
  Trash2 
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DocumentUpload } from "./document-upload";
import { 
  businessRegistrationSchema, 
  SUPPORTED_COUNTRIES,
  type BusinessRegistrationData
} from "@/types/customer";
import { cn } from "@/lib/utils";

interface BusinessRegistrationFormProps {
  onBack: () => void;
  onComplete?: (data: BusinessRegistrationData, files?: Map<string, File>) => void;
  initialData?: BusinessRegistrationData;
  className?: string;
}

const FORM_STEPS = [
  { id: 1, title: "Información de la Empresa", icon: Building2 },
  { id: 2, title: "Dirección de la Empresa", icon: MapPin },
  { id: 3, title: "Beneficiarios Finales", icon: Users },
  { id: 4, title: "Documentos", icon: FileText },
  { id: 5, title: "Términos y Envío", icon: CheckCircle2 },
];

export function BusinessRegistrationForm({ onBack, onComplete, initialData, className }: BusinessRegistrationFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, File[]>>(new Map());

  const form = useForm<BusinessRegistrationData>({
    resolver: zodResolver(businessRegistrationSchema),
    mode: "onBlur",
    defaultValues: initialData || {
      customerType: "business",
      businessLegalName: "",
      email: "",
      businessType: undefined,
      businessDescription: "",
      registeredAddress: {
        streetLine1: "",
        streetLine2: "",
        city: "",
        subdivision: "",
        postalCode: "",
        country: "USA",
      },
      isDao: false,
      isHighRisk: false,
      conductsMoneyServices: false,
      accountPurpose: undefined,
      sourceOfFunds: undefined,
      ultimateBeneficialOwners: [
        {
          firstName: "",
          lastName: "",
          birthDate: "",
          email: "",
          address: {
            streetLine1: "",
            city: "",
            subdivision: "",
            postalCode: "",
            country: "USA",
          },
          hasOwnership: false,
          isDirector: false,
          hasControl: false,
          isSigner: false,
          identifyingInformation: [],
        }
      ],
      identifyingInformation: [],
      documents: [],
      hasAcceptedTerms: false,
    },
  });

  const { watch, trigger, formState: { isValid } } = form;
  const watchedValues = watch();
  const progress = (currentStep / FORM_STEPS.length) * 100;

  const handleNext = async () => {
    const isStepValid = await trigger();
    if (isStepValid && currentStep < FORM_STEPS.length) {
      setCurrentStep(prev => prev + 1);
    } else if (!isStepValid) {
      toast({
        title: "Error de Validación",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      onBack();
    }
  };

  const onSubmit = async (data: BusinessRegistrationData) => {
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      
      // Add files
      let fileIndex = 0;
      for (const [documentType, files] of uploadedFiles) {
        for (const file of files) {
          formData.append(`${documentType}_${fileIndex}`, file);
          fileIndex++;
        }
      }

      const response = await fetch('/api/customers', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      toast({
        title: "¡Registro Exitoso!",
        description: "Tu cuenta empresarial ha sido creada y está siendo verificada.",
      });

      if (onComplete) {
        // Convert Map<string, File[]> to Map<string, File> by taking the first file from each array
        const singleFileMap = new Map<string, File>();
        uploadedFiles.forEach((files, key) => {
          if (files.length > 0) {
            singleFileMap.set(key, files[0]);
          }
        });
        onComplete(data, singleFileMap);
      } else {
        router.push(`/sign-up/success?customerId=${result.customerId}&type=business`);
      }

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registro Fallido", 
        description: error instanceof Error ? error.message : 'El registro falló',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addBeneficialOwner = () => {
    const currentOwners = form.getValues('ultimateBeneficialOwners');
    form.setValue('ultimateBeneficialOwners', [
      ...currentOwners,
      {
        firstName: "",
        lastName: "",
        birthDate: "",
        email: "",
        address: {
          streetLine1: "",
          city: "",
          subdivision: "",
          postalCode: "",
          country: "USA",
        },
        hasOwnership: false,
        isDirector: false,
        hasControl: false,
        isSigner: false,
        identifyingInformation: [],
      }
    ]);
  };

  const removeBeneficialOwner = (index: number) => {
    const currentOwners = form.getValues('ultimateBeneficialOwners');
    if (currentOwners.length > 1) {
      form.setValue('ultimateBeneficialOwners', currentOwners.filter((_, i) => i !== index));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="businessLegalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Legal de la Empresa *</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corporation Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico Empresarial *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="admin@empresa.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Este será tu correo de inicio de sesión
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Empresa *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="corporation">Corporación</SelectItem>
                        <SelectItem value="llc">LLC</SelectItem>
                        <SelectItem value="partnership">Sociedad</SelectItem>
                        <SelectItem value="sole_proprietorship">Propietario Único</SelectItem>
                        <SelectItem value="non_profit">Sin Fines de Lucro</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primaryWebsite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sitio Web</FormLabel>
                    <FormControl>
                      <Input placeholder="https://acme.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="businessDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción de la Empresa *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe las actividades y servicios de tu empresa..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="registeredAddress.streetLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Avenida Empresarial" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registeredAddress.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nueva York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registeredAddress.subdivision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado/Provincia *</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registeredAddress.postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Postal *</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registeredAddress.country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUPPORTED_COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
Los Beneficiarios Finales (UBOs) son individuos que poseen o controlan 25% o más de la empresa.
              </AlertDescription>
            </Alert>

            {watchedValues.ultimateBeneficialOwners?.map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Beneficiario Final {index + 1}</CardTitle>
                    {watchedValues.ultimateBeneficialOwners!.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBeneficialOwner(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`ultimateBeneficialOwners.${index}.firstName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre *</FormLabel>
                          <FormControl>
                            <Input placeholder="Juan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`ultimateBeneficialOwners.${index}.lastName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellido *</FormLabel>
                          <FormControl>
                            <Input placeholder="Pérez" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`ultimateBeneficialOwners.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="juan@ejemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`ultimateBeneficialOwners.${index}.birthDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Nacimiento *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <FormField
                      control={form.control}
                      name={`ultimateBeneficialOwners.${index}.hasOwnership`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="text-sm">Tiene Propiedad</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`ultimateBeneficialOwners.${index}.isDirector`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="text-sm">Es Director</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`ultimateBeneficialOwners.${index}.hasControl`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="text-sm">Tiene Control</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addBeneficialOwner}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Otro Beneficiario Final
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <DocumentUpload
              label="Documentos de Registro Empresarial"
              description="Acta constitutiva, licencia comercial, etc."
              required
              maxFiles={5}
              documentType="business_documents"
              onFilesChange={(files) => setUploadedFiles(prev => new Map(prev).set('business', files))}
            />

            <DocumentUpload
              label="Tax Identification Documents"
              description="EIN documentation or tax registration"
              required
              maxFiles={2}
              documentType="tax_documents"
              onFilesChange={(files) => setUploadedFiles(prev => new Map(prev).set('tax', files))}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revisa la Información de tu Empresa</CardTitle>
                <CardDescription>
                  Por favor revisa toda la información antes de enviar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Empresa:</span>
                    <p className="text-muted-foreground">{watchedValues.businessLegalName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Correo:</span>
                    <p className="text-muted-foreground">{watchedValues.email}</p>
                  </div>
                  <div>
                    <span className="font-medium">Beneficial Owners:</span>
                    <p className="text-muted-foreground">
                      {watchedValues.ultimateBeneficialOwners?.length || 0}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Documents:</span>
                    <p className="text-muted-foreground">
                      {Array.from(uploadedFiles.values()).flat().length} archivos subidos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="hasAcceptedTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Acepto los Términos de Servicio y Política de Privacidad *
                    </FormLabel>
                    <FormDescription>
                      By checking this box, you confirm that all information provided is accurate.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Registro Empresarial</h1>
          <Badge variant="outline">Paso {currentStep} de {FORM_STEPS.length}</Badge>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        <div className="flex items-center gap-2">
          {React.createElement(FORM_STEPS[currentStep - 1].icon, { 
            className: "h-5 w-5 text-primary" 
          })}
          <h2 className="font-semibold">{FORM_STEPS[currentStep - 1].title}</h2>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {renderStepContent()}
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentStep === 1 ? 'Volver a Selección de Tipo' : 'Anterior'}
        </Button>

        {currentStep === FORM_STEPS.length ? (
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Enviar Aplicación
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={isSubmitting}>
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}