"use client";

import { useState, useEffect } from "react";
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
import { PhoneInput } from "@/components/ui/phone-input";
import { DatePicker } from "@/components/ui/date-picker";
import { CountrySelect, COUNTRIES } from "@/components/ui/country-select";
import { 
  ArrowRight, 
  ArrowLeft, 
  User, 
  MapPin, 
  FileText, 
  CheckCircle2,
  Loader2,
  AlertCircle 
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DocumentUpload, type ProcessedFile } from "./document-upload";
import { 
  individualRegistrationSchema, 
  type IndividualRegistrationData
} from "@/types/customer";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface IndividualRegistrationFormProps {
  onBack?: () => void;
  onComplete?: (data: IndividualRegistrationData, files?: Map<string, File>) => void;
  initialData?: IndividualRegistrationData;
  className?: string;
}

interface FormStep {
  id: number;
  title: string;
  description: string;
  icon: typeof User;
  fields: (keyof IndividualRegistrationData)[];
}

const FORM_STEPS: FormStep[] = [
  {
    id: 1,
    title: "Información Personal",
    description: "Datos personales básicos",
    icon: User,
    fields: ["firstName", "lastName", "middleName", "email", "phone", "birthDate", "nationality"],
  },
  {
    id: 2,
    title: "Información de Dirección", 
    description: "Tu dirección de residencia",
    icon: MapPin,
    fields: ["residentialAddress"],
  },
  {
    id: 3,
    title: "Información Adicional",
    description: "Empleo y propósito de la cuenta",
    icon: FileText,
    fields: ["employmentStatus", "expectedMonthlyPayments", "accountPurpose", "sourceOfFunds"],
  },
  {
    id: 4,
    title: "Documentos de Identidad",
    description: "Subir documentos de identificación",
    icon: FileText,
    fields: ["identifyingInformation.0.type", "identifyingInformation.0.imageFront"],
  },
  {
    id: 5,
    title: "Términos de Servicio",
    description: "Aceptar términos de Bridge",
    icon: FileText,
    fields: ["tosAccepted"],
  },
  {
    id: 6,
    title: "Revisión Final",
    description: "Revisar y enviar",
    icon: CheckCircle2,
    fields: ["hasAcceptedTerms"],
  },
];

export function IndividualRegistrationForm({ onBack, onComplete, initialData, className }: IndividualRegistrationFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, File[]>>(new Map());
  const [, setProcessedFiles] = useState<Map<string, ProcessedFile[]>>(new Map());
  const [tosLoading, setTosLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isProcessingTosCallback, setIsProcessingTosCallback] = useState(false);
  
  const form = useForm<IndividualRegistrationData>({
    resolver: zodResolver(individualRegistrationSchema),
    mode: "onChange", // Change to onChange to update validation in real-time
    shouldFocusError: false,
    reValidateMode: "onChange", // Re-validate on changes
    defaultValues: initialData || {
      customerType: "individual",
      firstName: "",
      lastName: "",
      middleName: "",
      email: "",
      phone: "",
      birthDate: "",
      nationality: "",
      residentialAddress: {
        streetLine1: "",
        streetLine2: "",
        city: "",
        subdivision: "",
        postalCode: "",
        country: "",
      },
      employmentStatus: undefined,
      expectedMonthlyPayments: undefined,
      accountPurpose: undefined,
      accountPurposeOther: "",
      sourceOfFunds: undefined,
      identifyingInformation: [{
        type: undefined,
        issuingCountry: "",
        imageFront: undefined,
        imageBack: undefined
      }],
      documents: [],
      tosAccepted: false,
      tosSignedAgreementId: "",
      hasAcceptedTerms: false,
    },
  });

  const { watch, trigger, setValue, formState: { isValid } } = form;
  const watchedValues = watch();
  const nationalityValue = watch("nationality");

  // Auto-save form data to Supabase as user types
  useEffect(() => {
    // Don't save while loading data or if data hasn't been loaded yet
    if (isLoadingData || !dataLoaded) return;
    
    const saveFormData = async () => {
      try {
        const formData = form.getValues();
        // Only save if we have actual data (not empty form)
        const hasData = formData.email || formData.firstName || formData.lastName;
        if (!hasData && currentStep === 1) {
          console.log('Skipping save - form is empty');
          return;
        }
        
        // Save to Supabase
        const response = await fetch('/api/registration-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formData,
            currentStep,
            files: Object.fromEntries(
              Array.from(uploadedFiles.entries()).map(([key, files]) => [
                key,
                files.map(file => ({
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  lastModified: file.lastModified
                }))
              ])
            ) // Convert Map to object with file metadata
          }),
        });
        
        if (response.ok) {
          console.log('Form data saved to Supabase');
          // Also keep localStorage as backup
          const saveData = {
            formData,
            currentStep,
            timestamp: Date.now(),
          };
          localStorage.setItem('individual-registration-form-data', JSON.stringify(saveData));
        } else {
          console.warn('Failed to save to Supabase, keeping localStorage only');
        }
      } catch (error) {
        console.warn('Failed to save form data:', error);
      }
    };

    // Debounce the save to avoid too frequent writes
    const timeoutId = setTimeout(saveFormData, 2000); // Increased to 2s for API calls
    return () => clearTimeout(timeoutId);
  }, [watchedValues, currentStep, form, isLoadingData, dataLoaded, uploadedFiles]);

  // Clear form data only when explicitly navigating away (not on reload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Don't clear data on page reload/refresh
      // Data should persist across refreshes
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Don't reset form on unmount - let data persist
    };
  }, []);

  // Auto-populate address country from nationality selection
  useEffect(() => {
    if (nationalityValue && !watchedValues.residentialAddress?.country) {
      // Since both nationality and address use the same COUNTRIES list, 
      // we can directly use the same country code
      setValue("residentialAddress.country", nationalityValue);
    }
  }, [nationalityValue, watchedValues.residentialAddress?.country, setValue]);

  // Load saved form data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      setIsLoadingData(true);
      try {
        // First try to load from Supabase
        let savedData = null;
        try {
          const response = await fetch('/api/registration-draft');
          if (response.ok) {
            const { draft } = await response.json();
            if (draft) {
              console.log('Loading from Supabase draft:', draft);
              console.log('Draft files:', draft.files);
              savedData = {
                formData: draft.formData,
                currentStep: draft.currentStep,
                timestamp: new Date(draft.updatedAt).getTime(),
                files: draft.files || {}
              };
              
              // Restore uploaded files from draft
              if (draft.files && Object.keys(draft.files).length > 0) {
                console.log('Restoring file references from draft:', draft.files);
                // Create File objects from stored file data (we can't recreate the exact files, but we can create placeholder files for validation)
                const restoredFiles = new Map<string, File[]>();
                for (const [key, fileArray] of Object.entries(draft.files)) {
                  if (Array.isArray(fileArray) && fileArray.length > 0) {
                    // Create placeholder File objects for validation purposes
                    const placeholderFiles: File[] = fileArray.map((fileData: any, index: number) => {
                      const fileName = fileData?.name || `document_${index}`;
                      return new File([''], fileName, { type: fileData?.type || 'image/jpeg' });
                    });
                    restoredFiles.set(key, placeholderFiles);
                  }
                }
                setUploadedFiles(restoredFiles);
                console.log('File references restored:', restoredFiles);
              }
            }
          }
        } catch (supabaseError) {
          console.warn('Failed to load from Supabase, trying localStorage:', supabaseError);
        }
        
        // Fallback to localStorage if Supabase fails
        if (!savedData) {
          const saved = localStorage.getItem('individual-registration-form-data');
          if (saved) {
            savedData = JSON.parse(saved);
            console.log('Loading from localStorage fallback');
          }
        }
        
        if (savedData) {
          const { formData, currentStep: savedStep, timestamp } = savedData;
          const isRecent = Date.now() - timestamp < 24 * 60 * 60 * 1000; // 24 hours
          
          if (isRecent && formData) {
            console.log('Loading saved form data:', formData);
            
            // Restore all form values in batch
            const updates: Array<Promise<any>> = [];
            
            // First set customerType if it exists
            if (formData.customerType) {
              await setValue('customerType', formData.customerType, { shouldValidate: false });
            }
            
            // Restore form values with proper deep object handling
            Object.keys(formData).forEach(key => {
              const value = formData[key];
              if (value !== undefined && value !== null) {
                // Handle nested objects like residentialAddress
                if (key === 'residentialAddress' || (typeof value === 'object' && !Array.isArray(value))) {
                  Object.keys(value).forEach(subKey => {
                    const subValue = value[subKey];
                    if (subValue !== undefined && subValue !== null) {
                      updates.push(setValue(`${key}.${subKey}` as any, subValue, { shouldValidate: false }));
                    }
                  });
                } 
                // Handle arrays like identifyingInformation
                else if (Array.isArray(value)) {
                  // Set the entire array at once if it's not empty
                  if (value.length > 0) {
                    updates.push(setValue(key as any, value, { shouldValidate: false }));
                  }
                }
                // Handle simple values
                else {
                  updates.push(setValue(key as any, value, { shouldValidate: false }));
                }
              }
            });
            
            // Wait for all updates to complete
            await Promise.all(updates);
            
            // Check if ToS was previously accepted
            if (formData.tosAccepted && formData.tosSignedAgreementId) {
              // Restore ToS acceptance state
              await setValue("tosAccepted", true, { shouldValidate: false });
              await setValue("tosSignedAgreementId", formData.tosSignedAgreementId, { shouldValidate: false });
            }
            
            // Force form to re-render with new values
            await form.trigger();
            
            // Restore current step if provided
            if (savedStep && savedStep >= 1 && savedStep <= 6) {
              setCurrentStep(savedStep);
            }
            
            const restoredValues = form.getValues();
            console.log('Form data restored:', restoredValues);
            console.log('🎯 hasAcceptedTerms after restore:', restoredValues.hasAcceptedTerms);
            console.log('🎯 tosAccepted after restore:', restoredValues.tosAccepted);
            console.log('🎯 tosSignedAgreementId after restore:', restoredValues.tosSignedAgreementId);
            
            // CRITICAL: Check if we have ToS data in sessionStorage that should override the restored data
            const sessionTosAccepted = sessionStorage.getItem("bridgeTosAccepted");
            const sessionAgreementId = sessionStorage.getItem("bridgeTosAgreementId");
            
            if (sessionTosAccepted === "true" && sessionAgreementId) {
              console.log('🚨 OVERRIDING restored data with current ToS session data');
              console.log('📝 Session ToS data:', { sessionTosAccepted, sessionAgreementId });
              console.log('📝 Restored ToS data:', { 
                tosAccepted: restoredValues.tosAccepted, 
                tosSignedAgreementId: restoredValues.tosSignedAgreementId 
              });
              
              // Override the restored data with current session data
              setValue("tosAccepted", true, { shouldValidate: true, shouldDirty: true });
              setValue("tosSignedAgreementId", sessionAgreementId, { shouldValidate: true, shouldDirty: true });
              setValue("hasAcceptedTerms", true, { shouldValidate: true, shouldDirty: true });
              
              await form.trigger(['tosAccepted', 'tosSignedAgreementId', 'hasAcceptedTerms']);
              console.log('✅ ToS session data applied over restored data');
              
            } else if (restoredValues.tosAccepted && restoredValues.tosSignedAgreementId) {
              console.log('🔧 ToS data found in restored data, ensuring all ToS fields are set...');
              await setValue("hasAcceptedTerms", true, { shouldValidate: true });
              await form.trigger(['tosAccepted', 'tosSignedAgreementId', 'hasAcceptedTerms']);
              console.log('✅ ToS fields re-validated after restore');
            }
            
            toast({
              title: "Datos Restaurados",
              description: "Tu información de registro ha sido restaurada.",
              duration: 3000,
            });
            setDataLoaded(true);
          } else {
            // No saved data, mark as loaded anyway
            setDataLoaded(true);
          }
        } else {
          // No saved data, mark as loaded anyway
          setDataLoaded(true);
        }
      } catch (error) {
        console.warn('Failed to load saved form data:', error);
        setDataLoaded(true);
      } finally {
        setIsLoadingData(false);
      }
    };

    // Load saved data on mount
    loadSavedData();
  }, [setValue, form]);

  // Check for ToS acceptance from sessionStorage (when returning from Bridge ToS page)
  useEffect(() => {
    const checkTosAcceptance = async () => {
      console.log('🔍 Checking ToS acceptance from sessionStorage...');
      console.log('📊 Current state:', { isLoadingData, dataLoaded });
      
      const tosAccepted = sessionStorage.getItem("bridgeTosAccepted");
      const agreementId = sessionStorage.getItem("bridgeTosAgreementId");
      const goToFinalStep = sessionStorage.getItem("bridgeTosFinalStep");
      
      console.log('📋 SessionStorage ToS values:', {
        tosAccepted,
        agreementId,
        goToFinalStep
      });
      
      // Don't process if we're still loading data, but do show what we found
      if (isLoadingData) {
        if (tosAccepted === "true" && agreementId) {
          console.log('⏳ ToS data found but waiting for data loading to complete...');
        }
        return;
      }
      
      if (tosAccepted === "true" && agreementId) {
        setIsProcessingTosCallback(true);
        console.log('Processing Bridge ToS callback...');
        
        // Set the ToS values synchronously
        console.log('🔧 Setting form values during ToS callback...');
        console.log('📝 Agreement ID to set:', agreementId);
        
        // Set values with validation enabled to ensure they stick
        setValue("tosAccepted", true, { shouldValidate: true, shouldDirty: true });
        setValue("tosSignedAgreementId", agreementId, { shouldValidate: true, shouldDirty: true });
        setValue("hasAcceptedTerms", true, { shouldValidate: true, shouldDirty: true });
        console.log('✅ hasAcceptedTerms set to true during ToS callback');
        
        // Verify the values were set correctly
        const currentValues = form.getValues();
        console.log('🔍 Form values after setting:', {
          tosAccepted: currentValues.tosAccepted,
          tosSignedAgreementId: currentValues.tosSignedAgreementId,
          hasAcceptedTerms: currentValues.hasAcceptedTerms
        });
        
        // Force form to update with new values immediately
        await form.trigger();
        
        // Get the updated form data after forcing the update
        const formData = form.getValues();
        const saveData = {
          formData: {
            ...formData,
            tosAccepted: true,
            tosSignedAgreementId: agreementId,
            hasAcceptedTerms: true
          },
          currentStep: 6,
          timestamp: Date.now(),
        };
        localStorage.setItem('individual-registration-form-data', JSON.stringify(saveData));
        
        // Also save immediately to Supabase
        try {
          const response = await fetch('/api/registration-draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              formData: saveData.formData,
              currentStep: 6,
              files: Object.fromEntries(
              Array.from(uploadedFiles.entries()).map(([key, files]) => [
                key,
                files.map(file => ({
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  lastModified: file.lastModified
                }))
              ])
            ) // Convert Map to object with file metadata
            }),
          });
          
          if (response.ok) {
            console.log('ToS acceptance saved to Supabase with step 6');
          }
        } catch (error) {
          console.warn('Failed to save ToS acceptance to Supabase:', error);
        }
        
        // Force a complete form update and validation
        await form.trigger();
        
        // Specifically trigger validation for the required fields
        await form.trigger(['tosAccepted', 'tosSignedAgreementId', 'hasAcceptedTerms']);
        
        // If coming from Bridge ToS, advance to final step
        if (goToFinalStep === "true") {
          // Ensure all form values are available
          const allValues = form.getValues();
          console.log('Form values before going to step 6:', allValues);
          
          // Set step immediately, then complete processing
          setCurrentStep(6); // Go to final "Revisión Final" step
          
          toast({
            title: "¡Términos Aceptados!",
            description: "Términos aceptados exitosamente. Ahora puedes revisar y enviar tu registro.",
            duration: 4000,
          });
        } else {
          toast({
            title: "Términos Aceptados",
            description: "Has aceptado exitosamente los términos de servicio de Bridge.",
          });
        }
        
        // Delay clearing sessionStorage to allow form restoration logic to access it
        setTimeout(() => {
          console.log('🧹 Clearing ToS sessionStorage after delay...');
          sessionStorage.removeItem("bridgeTosAccepted");
          sessionStorage.removeItem("bridgeTosAgreementId");
          sessionStorage.removeItem("bridgeTosFinalStep");
        }, 2000); // 2 second delay to ensure form restoration is complete
        
        // Mark ToS callback processing as complete
        setIsProcessingTosCallback(false);
        console.log('Bridge ToS callback processing completed');
      }
    };

    // Check on mount
    checkTosAcceptance();
    
    // Also listen for storage events (in case opened in multiple tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bridgeTosAccepted" || e.key === "bridgeTosAgreementId") {
        checkTosAcceptance();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [setValue, isLoadingData, form]);
  
  // Additional check when data loading completes
  useEffect(() => {
    if (!isLoadingData && dataLoaded) {
      console.log('📊 Data loading completed, running additional ToS check...');
      const tosAccepted = sessionStorage.getItem("bridgeTosAccepted");
      const agreementId = sessionStorage.getItem("bridgeTosAgreementId");
      
      if (tosAccepted === "true" && agreementId) {
        console.log('🎯 Found ToS data after data loading completed, processing...');
        // Trigger the ToS check function manually
        const checkEvent = new Event('storage');
        window.dispatchEvent(checkEvent);
      }
    }
  }, [isLoadingData, dataLoaded]);

  // Additional effect to ensure ToS data is loaded when entering step 6
  useEffect(() => {
    if (currentStep === 6) {
      console.log('📑 Step 6 mounted - checking ToS data...');
      
      const sessionAgreementId = sessionStorage.getItem("bridgeTosAgreementId");
      const currentFormData = form.getValues();
      
      console.log('🔍 Step 6 ToS Check:', {
        currentStep,
        formTosId: currentFormData.tosSignedAgreementId,
        sessionTosId: sessionAgreementId,
        formTosAccepted: currentFormData.tosAccepted
      });
      
      // If we have ToS data in session but not in form, update the form
      if (sessionAgreementId && !currentFormData.tosSignedAgreementId) {
        console.log('🔧 Step 6: Updating form with ToS data from session');
        setValue("tosSignedAgreementId", sessionAgreementId, { shouldValidate: true, shouldDirty: true });
        setValue("tosAccepted", true, { shouldValidate: true, shouldDirty: true });
        setValue("hasAcceptedTerms", true, { shouldValidate: true, shouldDirty: true });
        
        // Trigger form update
        form.trigger();
      }
    }
  }, [currentStep, setValue, form]);

  // Periodic check to ensure ToS data doesn't get lost due to form resets
  useEffect(() => {
    const interval = setInterval(() => {
      const sessionAgreementId = sessionStorage.getItem("bridgeTosAgreementId");
      const currentFormData = form.getValues();
      
      // Only check if we're in the later steps and have session data
      if (currentStep >= 5 && sessionAgreementId && !currentFormData.tosSignedAgreementId) {
        console.log('🔄 Periodic check: Restoring lost ToS data');
        setValue("tosSignedAgreementId", sessionAgreementId, { shouldValidate: true, shouldDirty: true });
        setValue("tosAccepted", true, { shouldValidate: true, shouldDirty: true });
        setValue("hasAcceptedTerms", true, { shouldValidate: true, shouldDirty: true });
      }
    }, 1000); // Check every second
    
    return () => clearInterval(interval);
  }, [currentStep, setValue, form]);

  const currentStepData = FORM_STEPS[currentStep - 1];
  const progress = (currentStep / FORM_STEPS.length) * 100;

  const validateCurrentStep = async (): Promise<boolean> => {
    const fieldsToValidate = currentStepData.fields;
    if (fieldsToValidate && fieldsToValidate.length > 0) {
      // Only trigger validation, don't change any values
      const result = await trigger(fieldsToValidate as (keyof IndividualRegistrationData)[], { shouldFocus: false });
      return result;
    }
    return true;
  };

  const handleNext = async () => {
    // Only validate on the final step
    if (currentStep === FORM_STEPS.length) {
      const isStepValid = await validateCurrentStep();
      
      if (!isStepValid) {
        toast({
          title: "Error de Validación",
          description: "Por favor completa todos los campos requeridos antes de continuar.",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep < FORM_STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else if (onBack) {
      onBack();
    }
  };

  // File handling is managed by individual upload handlers in the form

  const onSubmit = async (data: IndividualRegistrationData) => {
    console.log('📋 Form submission started with data:', data);
    console.log('🏠 Address data:', data.residentialAddress);
    console.log('📄 Documents data:', data.identifyingInformation);
    console.log('📂 Uploaded files state:', uploadedFiles);
    console.log('📁 Files available:', Array.from(uploadedFiles.entries()));
    console.log('✅ ToS Data Check:', {
      tosAccepted: data.tosAccepted,
      tosSignedAgreementId: data.tosSignedAgreementId,
      hasAcceptedTerms: data.hasAcceptedTerms
    });
    
    // Ensure ToS agreement ID is included in the submission
    if (data.tosAccepted && data.tosSignedAgreementId) {
      console.log('🎯 Including Bridge ToS agreement ID:', data.tosSignedAgreementId);
    } else {
      console.warn('⚠️ Missing Bridge ToS data in form submission:', {
        tosAccepted: data.tosAccepted,
        tosSignedAgreementId: data.tosSignedAgreementId
      });
    }
    
    setIsSubmitting(true);
    
    try {
      // If onComplete prop is provided (from parent page), use it instead of direct API call
      if (onComplete) {
        // Clear saved form data on successful completion
        localStorage.removeItem('individual-registration-form-data');
        onComplete(data, uploadedFiles);
        return;
      }

      // Prepare form data with files
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      
      // Add uploaded files
      let fileIndex = 0;
      for (const [documentType, files] of uploadedFiles) {
        for (const file of files) {
          formData.append(`${documentType}_${fileIndex}`, file);
          fileIndex++;
        }
      }

      console.log('Submitting individual registration:', {
        customerType: data.customerType,
        email: data.email,
        fileCount: fileIndex,
      });

      // Submit to API
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
        description: "Tu cuenta ha sido creada y está siendo verificada.",
      });

      // Redirect to success page
      router.push(`/sign-up/success?customerId=${result.customerId}&type=individual`);

    } catch (error) {
      console.error('Registration error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      toast({
        title: "Error en el Registro", 
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    // Show loading state if data is still being loaded or processing ToS callback
    if (isLoadingData || isProcessingTosCallback) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">
            {isProcessingTosCallback 
              ? "Procesando aceptación de términos..." 
              : "Cargando datos del formulario..."
            }
          </span>
        </div>
      );
    }
    
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                key="personal-firstname"
                control={form.control}
                name="firstName"
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
                key="personal-lastname"
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos *</FormLabel>
                    <FormControl>
                      <Input placeholder="García" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Segundo Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                key="personal-email"
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="juan@ejemplo.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Este será tu correo de acceso
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Teléfono</FormLabel>
                    <FormControl>
                      <PhoneInput 
                        value={field.value} 
                        onChange={field.onChange}
                        defaultCountry="MX"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento *</FormLabel>
                    <FormControl>
                      <DatePicker 
                        value={field.value} 
                        onChange={field.onChange}
                        maxDate={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)} // 18 years ago
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País de Nacionalidad</FormLabel>
                    <FormControl>
                      <CountrySelect 
                        value={field.value} 
                        onChange={field.onChange}
                        placeholder="Selecciona tu país..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <FormField
              key="residential-street1"
              control={form.control}
              name="residentialAddress.streetLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección *</FormLabel>
                  <FormControl>
                    <Input placeholder="Av. Principal 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              key="residential-street2"
              control={form.control}
              name="residentialAddress.streetLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento, Suite, etc.</FormLabel>
                  <FormControl>
                    <Input placeholder="Depto 4B (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                key="residential-city"
                control={form.control}
                name="residentialAddress.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ciudad de México" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                key="residential-subdivision"
                control={form.control}
                name="residentialAddress.subdivision"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado/Provincia *</FormLabel>
                    <FormControl>
                      <Input placeholder="CDMX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                key="residential-postal"
                control={form.control}
                name="residentialAddress.postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Postal *</FormLabel>
                    <FormControl>
                      <Input placeholder="06700" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                key="residential-country"
                control={form.control}
                name="residentialAddress.country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País *</FormLabel>
                    <FormControl>
                      <CountrySelect 
                        value={field.value} 
                        onChange={field.onChange}
                        placeholder="Selecciona tu país de residencia..."
                      />
                    </FormControl>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                key="additional-employment"
                control={form.control}
                name="employmentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado Laboral</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu estado laboral" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="employed">Empleado</SelectItem>
                        <SelectItem value="self_employed">Trabajador Independiente</SelectItem>
                        <SelectItem value="unemployed">Desempleado</SelectItem>
                        <SelectItem value="student">Estudiante</SelectItem>
                        <SelectItem value="retired">Jubilado</SelectItem>
                        <SelectItem value="homemaker">Ama/o de Casa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedMonthlyPayments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagos Mensuales Esperados</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el rango" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0_4999">$0 - $4,999</SelectItem>
                        <SelectItem value="5000_9999">$5,000 - $9,999</SelectItem>
                        <SelectItem value="10000_49999">$10,000 - $49,999</SelectItem>
                        <SelectItem value="50000_plus">$50,000+</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            <FormField
              key="additional-accountpurpose"
              control={form.control}
              name="accountPurpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propósito de la Cuenta</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el propósito de tu cuenta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="charitable_donations">Donaciones Benéficas</SelectItem>
                      <SelectItem value="ecommerce_retail_payments">Pagos de Comercio Electrónico</SelectItem>
                      <SelectItem value="investment_purposes">Propósitos de Inversión</SelectItem>
                      <SelectItem value="operating_a_company">Operación de una Empresa</SelectItem>
                      <SelectItem value="payments_to_friends_or_family_abroad">Pagos a Amigos o Familia en el Extranjero</SelectItem>
                      <SelectItem value="personal_or_living_expenses">Gastos Personales o de Vida</SelectItem>
                      <SelectItem value="protect_wealth">Proteger Patrimonio</SelectItem>
                      <SelectItem value="purchase_goods_and_services">Comprar Bienes y Servicios</SelectItem>
                      <SelectItem value="receive_payment_for_freelancing">Recibir Pagos por Trabajo Independiente</SelectItem>
                      <SelectItem value="receive_salary">Recibir Salario</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedValues.accountPurpose === 'other' && (
              <FormField
                control={form.control}
                name="accountPurposeOther"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Por favor especifica</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe el propósito de tu cuenta..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              key="additional-sourceoffunds"
              control={form.control}
              name="sourceOfFunds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuente de Fondos</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la fuente de fondos" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="salary">Salario</SelectItem>
                      <SelectItem value="company_funds">Fondos de Empresa</SelectItem>
                      <SelectItem value="investments_loans">Inversiones/Préstamos</SelectItem>
                      <SelectItem value="inheritance">Herencia</SelectItem>
                      <SelectItem value="government_benefits">Beneficios Gubernamentales</SelectItem>
                      <SelectItem value="savings">Ahorros</SelectItem>
                      <SelectItem value="pension_retirement">Pensión/Jubilación</SelectItem>
                      <SelectItem value="gifts">Regalos</SelectItem>
                      <SelectItem value="sale_of_assets_real_estate">Venta de Activos/Bienes Raíces</SelectItem>
                      <SelectItem value="ecommerce_reseller">Revendedor E-commerce</SelectItem>
                      <SelectItem value="gambling_proceeds">Ganancias de Juego</SelectItem>
                      <SelectItem value="someone_elses_funds">Fondos de Terceros</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Por favor sube imágenes claras y de alta calidad de tus documentos de identificación.
                Todos los documentos deben ser válidos y claramente legibles.
              </AlertDescription>
            </Alert>

            {/* Document Type Selection */}
            <FormField
              key="document-type"
              control={form.control}
              name="identifyingInformation.0.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Documento *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de documento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="drivers_license">Licencia de Conducir</SelectItem>
                      <SelectItem value="passport">Pasaporte</SelectItem>
                      <SelectItem value="national_id">Cédula de Identidad</SelectItem>
                      <SelectItem value="matriculate_id">Cédula de Matrícula</SelectItem>
                      <SelectItem value="military_id">Identificación Militar</SelectItem>
                      <SelectItem value="permanent_residency_id">ID de Residencia Permanente</SelectItem>
                      <SelectItem value="state_or_provincial_id">ID Estatal o Provincial</SelectItem>
                      <SelectItem value="visa">Visa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Document Details */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <FormField
                key="document-issuing-country"
                control={form.control}
                name="identifyingInformation.0.issuingCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País Emisor *</FormLabel>
                    <FormControl>
                      <CountrySelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selecciona el país emisor"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Document Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="identifyingInformation.0.imageFront"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Foto del Frente *</FormLabel>
                    <FormControl>
                      <div className="flex flex-col space-y-2">
                        <input
                          {...field}
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                // Upload to Supabase immediately
                                const uploadFormData = new FormData();
                                uploadFormData.append('file', file);
                                uploadFormData.append('documentType', 'identifyingInformation');
                                uploadFormData.append('documentSide', 'front');

                                const response = await fetch('/api/upload-document', {
                                  method: 'POST',
                                  body: uploadFormData,
                                });

                                if (response.ok) {
                                  const { fileName, publicUrl } = await response.json();
                                  console.log('✅ File uploaded:', fileName);
                                  
                                  // Update uploadedFiles state
                                  setUploadedFiles(prev => {
                                    const newMap = new Map(prev);
                                    newMap.set('identifyingInformation', [file]);
                                    return newMap;
                                  });
                                  
                                  // Set form field value
                                  onChange(file);
                                  
                                  toast({
                                    title: "Archivo Subido",
                                    description: "Tu documento se ha subido exitosamente.",
                                  });
                                } else {
                                  const error = await response.json();
                                  throw new Error(error.error || 'Upload failed');
                                }
                              } catch (error) {
                                console.error('Upload error:', error);
                                toast({
                                  title: "Error de Subida",
                                  description: error instanceof Error ? error.message : "Error al subir el archivo",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        {value && (
                          <p className="text-sm text-muted-foreground">
                            Archivo: {value.name}
                          </p>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="identifyingInformation.0.imageBack"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Foto del Reverso</FormLabel>
                    <FormControl>
                      <div className="flex flex-col space-y-2">
                        <input
                          {...field}
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                // Upload to Supabase immediately
                                const uploadFormData = new FormData();
                                uploadFormData.append('file', file);
                                uploadFormData.append('documentType', 'identifyingInformation');
                                uploadFormData.append('documentSide', 'back');

                                const response = await fetch('/api/upload-document', {
                                  method: 'POST',
                                  body: uploadFormData,
                                });

                                if (response.ok) {
                                  const { fileName, publicUrl } = await response.json();
                                  console.log('✅ Back image uploaded:', fileName);
                                  
                                  // Update uploadedFiles state (append to existing)
                                  setUploadedFiles(prev => {
                                    const newMap = new Map(prev);
                                    const existing = newMap.get('identifyingInformation') || [];
                                    newMap.set('identifyingInformation', [...existing, file]);
                                    return newMap;
                                  });
                                  
                                  // Set form field value
                                  onChange(file);
                                  
                                  toast({
                                    title: "Archivo Subido",
                                    description: "El reverso del documento se ha subido exitosamente.",
                                  });
                                } else {
                                  const error = await response.json();
                                  throw new Error(error.error || 'Upload failed');
                                }
                              } catch (error) {
                                console.error('Upload error:', error);
                                toast({
                                  title: "Error de Subida",
                                  description: error instanceof Error ? error.message : "Error al subir el archivo",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        {value && (
                          <p className="text-sm text-muted-foreground">
                            Archivo: {value.name}
                          </p>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Documents */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-4">Documentos Adicionales (Opcional)</h3>
              
              <FormField
                control={form.control}
                name="documents.0.file"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Documento Adicional</FormLabel>
                    <FormControl>
                      <div className="flex flex-col space-y-2">
                        <input
                          {...field}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                // Upload to Supabase immediately
                                const uploadFormData = new FormData();
                                uploadFormData.append('file', file);
                                uploadFormData.append('documentType', 'documents');
                                uploadFormData.append('documentSide', 'additional');

                                const response = await fetch('/api/upload-document', {
                                  method: 'POST',
                                  body: uploadFormData,
                                });

                                if (response.ok) {
                                  const { fileName, publicUrl } = await response.json();
                                  console.log('✅ Additional document uploaded:', fileName);
                                  
                                  // Update uploadedFiles state
                                  setUploadedFiles(prev => {
                                    const newMap = new Map(prev);
                                    newMap.set('documents', [file]);
                                    return newMap;
                                  });
                                  
                                  // Set form field value
                                  onChange(file);
                                  
                                  toast({
                                    title: "Documento Subido",
                                    description: "Tu documento adicional se ha subido exitosamente.",
                                  });
                                } else {
                                  const error = await response.json();
                                  throw new Error(error.error || 'Upload failed');
                                }
                              } catch (error) {
                                console.error('Upload error:', error);
                                toast({
                                  title: "Error de Subida",
                                  description: error instanceof Error ? error.message : "Error al subir el archivo",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/90"
                        />
                        {value && (
                          <p className="text-sm text-muted-foreground">
                            Archivo: {value.name}
                          </p>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Para continuar con tu registro, debes aceptar los Términos de Servicio de Bridge.
                Este paso es requerido para procesar tu aplicación KYC.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Términos de Servicio de Bridge</CardTitle>
                <CardDescription>
                  Bridge es nuestro proveedor de servicios KYC y cumplimiento. Debes aceptar sus términos de servicio para continuar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      Al hacer clic en "Acepto los Términos", serás dirigido a una ventana para revisar y aceptar
                      los Términos de Servicio de Bridge. Este es un paso obligatorio para completar tu verificación KYC.
                    </p>
                    <p className="text-xs text-gray-500">
                      Una vez que aceptes los términos, podrás continuar con el proceso de registro.
                    </p>
                  </div>
                  
                  {!watchedValues.tosAccepted ? (
                    <Button 
                      type="button" 
                      className="w-full"
                      disabled={tosLoading}
                      onClick={async () => {
                        try {
                          setTosLoading(true);
                          
                          // Call our API to generate Bridge ToS link
                          const response = await fetch('/api/bridge/tos-link', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              redirect_uri: `${window.location.origin}/sign-up/tos-callback`
                            }),
                          });

                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || 'Failed to generate ToS link');
                          }

                          const { url } = await response.json();
                          
                          // Open Bridge ToS page in the same window
                          window.location.href = url;
                          
                        } catch (error: any) {
                          console.error('ToS link generation error:', error);
                          setTosLoading(false);
                          
                          toast({
                            title: "Error",
                            description: error.message || "Hubo un problema al generar el enlace de términos de servicio.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      {tosLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generando enlace...
                        </>
                      ) : (
                        "Acepto los Términos de Bridge"
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Términos de Bridge aceptados</span>
                      </div>
                      {watchedValues.tosSignedAgreementId && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs text-green-800">
                            <strong>ID de Acuerdo:</strong> {watchedValues.tosSignedAgreementId}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {watchedValues.tosAccepted && (
              <FormField
                key="tos-accepted"
                control={form.control}
                name="tosAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={true}
                        disabled={true}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal text-green-600">
                        ✓ He aceptado los Términos de Servicio de Bridge
                      </FormLabel>
                      <FormDescription>
                        Términos aceptados exitosamente con ID: {watchedValues.tosSignedAgreementId}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}
          </div>
        );

      case 6:
        // Get current form values directly for the review
        const currentFormData = form.getValues();
        const reviewData = currentFormData || watchedValues;
        
        // Debug: Log the form data to see what's available
        console.log('🔍 Step 6 Review Data:', {
          currentFormData,
          watchedValues,
          reviewData,
          tosFields: {
            tosAccepted: reviewData.tosAccepted,
            tosSignedAgreementId: reviewData.tosSignedAgreementId,
            hasAcceptedTerms: reviewData.hasAcceptedTerms
          }
        });
        
        const documentCount = [
          reviewData.identifyingInformation?.[0]?.imageFront,
          reviewData.identifyingInformation?.[0]?.imageBack,
          reviewData.documents?.[0]?.file
        ].filter(Boolean).length;
        
        // Helper function to convert 2-char country code to 3-char ISO 3166-1
        const getISO3CountryCode = (iso2Code: string) => {
          if (!iso2Code) return '';
          const countryMap: Record<string, string> = {
            'AD': 'AND', 'AE': 'ARE', 'AF': 'AFG', 'AG': 'ATG', 'AI': 'AIA', 'AL': 'ALB', 'AM': 'ARM', 'AO': 'AGO', 'AQ': 'ATA', 'AR': 'ARG', 'AS': 'ASM', 'AT': 'AUT', 'AU': 'AUS', 'AW': 'ABW', 'AX': 'ALA', 'AZ': 'AZE',
            'BA': 'BIH', 'BB': 'BRB', 'BD': 'BGD', 'BE': 'BEL', 'BF': 'BFA', 'BG': 'BGR', 'BH': 'BHR', 'BI': 'BDI', 'BJ': 'BEN', 'BL': 'BLM', 'BM': 'BMU', 'BN': 'BRN', 'BO': 'BOL', 'BQ': 'BES', 'BR': 'BRA', 'BS': 'BHS', 'BT': 'BTN', 'BV': 'BVT', 'BW': 'BWA', 'BY': 'BLR', 'BZ': 'BLZ',
            'CA': 'CAN', 'CC': 'CCK', 'CD': 'COD', 'CF': 'CAF', 'CG': 'COG', 'CH': 'CHE', 'CI': 'CIV', 'CK': 'COK', 'CL': 'CHL', 'CM': 'CMR', 'CN': 'CHN', 'CO': 'COL', 'CR': 'CRI', 'CU': 'CUB', 'CV': 'CPV', 'CW': 'CUW', 'CX': 'CXR', 'CY': 'CYP', 'CZ': 'CZE',
            'DE': 'DEU', 'DJ': 'DJI', 'DK': 'DNK', 'DM': 'DMA', 'DO': 'DOM', 'DZ': 'DZA', 'EC': 'ECU', 'EE': 'EST', 'EG': 'EGY', 'EH': 'ESH', 'ER': 'ERI', 'ES': 'ESP', 'ET': 'ETH', 'FI': 'FIN', 'FJ': 'FJI', 'FK': 'FLK', 'FM': 'FSM', 'FO': 'FRO', 'FR': 'FRA',
            'GA': 'GAB', 'GB': 'GBR', 'GD': 'GRD', 'GE': 'GEO', 'GF': 'GUF', 'GG': 'GGY', 'GH': 'GHA', 'GI': 'GIB', 'GL': 'GRL', 'GM': 'GMB', 'GN': 'GIN', 'GP': 'GLP', 'GQ': 'GNQ', 'GR': 'GRC', 'GS': 'SGS', 'GT': 'GTM', 'GU': 'GUM', 'GW': 'GNB', 'GY': 'GUY',
            'HK': 'HKG', 'HM': 'HMD', 'HN': 'HND', 'HR': 'HRV', 'HT': 'HTI', 'HU': 'HUN', 'ID': 'IDN', 'IE': 'IRL', 'IL': 'ISR', 'IM': 'IMN', 'IN': 'IND', 'IO': 'IOT', 'IQ': 'IRQ', 'IR': 'IRN', 'IS': 'ISL', 'IT': 'ITA', 'JE': 'JEY', 'JM': 'JAM', 'JO': 'JOR', 'JP': 'JPN',
            'KE': 'KEN', 'KG': 'KGZ', 'KH': 'KHM', 'KI': 'KIR', 'KM': 'COM', 'KN': 'KNA', 'KP': 'PRK', 'KR': 'KOR', 'KW': 'KWT', 'KY': 'CYM', 'KZ': 'KAZ', 'LA': 'LAO', 'LB': 'LBN', 'LC': 'LCA', 'LI': 'LIE', 'LK': 'LKA', 'LR': 'LBR', 'LS': 'LSO', 'LT': 'LTU', 'LU': 'LUX', 'LV': 'LVA', 'LY': 'LBY',
            'MA': 'MAR', 'MC': 'MCO', 'MD': 'MDA', 'ME': 'MNE', 'MF': 'MAF', 'MG': 'MDG', 'MH': 'MHL', 'MK': 'MKD', 'ML': 'MLI', 'MM': 'MMR', 'MN': 'MNG', 'MO': 'MAC', 'MP': 'MNP', 'MQ': 'MTQ', 'MR': 'MRT', 'MS': 'MSR', 'MT': 'MLT', 'MU': 'MUS', 'MV': 'MDV', 'MW': 'MWI', 'MX': 'MEX', 'MY': 'MYS', 'MZ': 'MOZ',
            'NA': 'NAM', 'NC': 'NCL', 'NE': 'NER', 'NF': 'NFK', 'NG': 'NGA', 'NI': 'NIC', 'NL': 'NLD', 'NO': 'NOR', 'NP': 'NPL', 'NR': 'NRU', 'NU': 'NIU', 'NZ': 'NZL', 'OM': 'OMN', 'PA': 'PAN', 'PE': 'PER', 'PF': 'PYF', 'PG': 'PNG', 'PH': 'PHL', 'PK': 'PAK', 'PL': 'POL', 'PM': 'SPM', 'PN': 'PCN', 'PR': 'PRI', 'PS': 'PSE', 'PT': 'PRT', 'PW': 'PLW', 'PY': 'PRY',
            'QA': 'QAT', 'RE': 'REU', 'RO': 'ROU', 'RS': 'SRB', 'RU': 'RUS', 'RW': 'RWA', 'SA': 'SAU', 'SB': 'SLB', 'SC': 'SYC', 'SD': 'SDN', 'SE': 'SWE', 'SG': 'SGP', 'SH': 'SHN', 'SI': 'SVN', 'SJ': 'SJM', 'SK': 'SVK', 'SL': 'SLE', 'SM': 'SMR', 'SN': 'SEN', 'SO': 'SOM', 'SR': 'SUR', 'SS': 'SSD', 'ST': 'STP', 'SV': 'SLV', 'SX': 'SXM', 'SY': 'SYR', 'SZ': 'SWZ',
            'TC': 'TCA', 'TD': 'TCD', 'TF': 'ATF', 'TG': 'TGO', 'TH': 'THA', 'TJ': 'TJK', 'TK': 'TKL', 'TL': 'TLS', 'TM': 'TKM', 'TN': 'TUN', 'TO': 'TON', 'TR': 'TUR', 'TT': 'TTO', 'TV': 'TUV', 'TW': 'TWN', 'TZ': 'TZA', 'UA': 'UKR', 'UG': 'UGA', 'UM': 'UMI', 'US': 'USA', 'UY': 'URY', 'UZ': 'UZB',
            'VA': 'VAT', 'VC': 'VCT', 'VE': 'VEN', 'VG': 'VGB', 'VI': 'VIR', 'VN': 'VNM', 'VU': 'VUT', 'WF': 'WLF', 'WS': 'WSM', 'YE': 'YEM', 'YT': 'MYT', 'ZA': 'ZAF', 'ZM': 'ZMB', 'ZW': 'ZWE'
          };
          return countryMap[iso2Code] || iso2Code;
        };
        
        // Ensure we have the ToS agreement ID - try multiple sources and update form if needed
        let tosAgreementId = reviewData.tosSignedAgreementId || 
                              watchedValues.tosSignedAgreementId || 
                              sessionStorage.getItem("bridgeTosAgreementId") || 
                              '';
        
        console.log('🎯 ToS Agreement ID Resolution:', {
          reviewData: reviewData.tosSignedAgreementId,
          watchedValues: watchedValues.tosSignedAgreementId,
          sessionStorage: sessionStorage.getItem("bridgeTosAgreementId"),
          final: tosAgreementId
        });
        
        // If we found the agreement ID in sessionStorage but it's not in the form, update the form
        if (!reviewData.tosSignedAgreementId && sessionStorage.getItem("bridgeTosAgreementId")) {
          const sessionAgreementId = sessionStorage.getItem("bridgeTosAgreementId");
          console.log('🔄 Updating form with ToS agreement ID from sessionStorage:', sessionAgreementId);
          
          // Update form values immediately
          setValue("tosSignedAgreementId", sessionAgreementId, { shouldValidate: true, shouldDirty: true });
          setValue("tosAccepted", true, { shouldValidate: true, shouldDirty: true });
          tosAgreementId = sessionAgreementId;
          
          // Re-get the current form data after update
          const updatedFormData = form.getValues();
          console.log('📋 Updated form data:', {
            tosAccepted: updatedFormData.tosAccepted,
            tosSignedAgreementId: updatedFormData.tosSignedAgreementId
          });
        }

        const bridgeData = {
          type: "individual",
          first_name: reviewData.firstName || '',
          middle_name: reviewData.middleName || '',
          last_name: reviewData.lastName || '',
          email: reviewData.email || '',
          phone: reviewData.phone || '',
          residential_address: {
            street_line_1: reviewData.residentialAddress?.streetLine1 || '',
            street_line_2: reviewData.residentialAddress?.streetLine2 || '',
            city: reviewData.residentialAddress?.city || '',
            postal_code: reviewData.residentialAddress?.postalCode || '',
            country: getISO3CountryCode(reviewData.residentialAddress?.country || '')
          },
          birth_date: reviewData.birthDate || '',
          nationality: getISO3CountryCode(reviewData.nationality || ''),
          signed_agreement_id: tosAgreementId,
          account_purpose: reviewData.accountPurpose || '',
          employment_status: reviewData.employmentStatus || '',
          expected_monthly_payments_usd: reviewData.expectedMonthlyPayments || '',
          source_of_funds: reviewData.sourceOfFunds || '',
          identifying_information: [
            ...(reviewData.identifyingInformation?.[0]?.type ? [{
              type: reviewData.identifyingInformation[0].type,
              issuing_country: getISO3CountryCode(reviewData.identifyingInformation[0].issuingCountry || ''),
              image_front: reviewData.identifyingInformation[0].imageFront ? "data:image/jpeg;base64,[BASE64_ENCODED_FRONT_IMAGE]" : undefined,
              image_back: reviewData.identifyingInformation[0].imageBack ? "data:image/jpeg;base64,[BASE64_ENCODED_BACK_IMAGE]" : undefined
            }] : [])
          ],
          documents: [
            // Additional supporting documents (optional)
            ...(reviewData.documents?.length && reviewData.documents.length > 0 && reviewData.documents[0]?.file ? [{
              purposes: ["proof_of_account_purpose"],
              file: "data:image/jpeg;base64,[BASE64_ENCODED_ADDITIONAL_FILE]",
              description: reviewData.documents[0]?.description || ''
            }] : [])
          ]
        };
        
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revisa tu Información</CardTitle>
                <CardDescription>
                  Por favor revisa toda la información que has proporcionado antes de enviar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nombre:</span>
                    <p className="text-muted-foreground">
                      {reviewData.firstName} {reviewData.middleName} {reviewData.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Correo:</span>
                    <p className="text-muted-foreground">{reviewData.email}</p>
                  </div>
                  <div>
                    <span className="font-medium">Dirección:</span>
                    <p className="text-muted-foreground">
                      {reviewData.residentialAddress?.streetLine1}, {reviewData.residentialAddress?.city}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Documentos:</span>
                    <p className="text-muted-foreground">
                      {documentCount} archivos subidos
                    </p>
                  </div>
                  {tosAgreementId && (
                    <div>
                      <span className="font-medium">Términos:</span>
                      <p className="text-muted-foreground text-green-600">
                        ✓ Aceptados (ID: {tosAgreementId.substring(0, 8)}...)
                      </p>
                    </div>
                  )}
                  {!tosAgreementId && (
                    <div>
                      <span className="font-medium">Términos:</span>
                      <p className="text-muted-foreground text-red-600">
                        ⚠️ ID no encontrado
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* JSON Preview for Bridge API */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Vista Previa de Datos para Bridge
                  {tosAgreementId ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      ✓ ToS ID Incluido
                    </span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      ⚠️ ToS ID Faltante
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Esta es la información que se enviará al API de Bridge para verificación.
                  {!tosAgreementId && (
                    <span className="block text-red-600 mt-2 text-sm">
                      ⚠️ Advertencia: El ID del acuerdo de términos no se encontró. 
                      El registro puede fallar sin este campo.
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto max-h-96">
                  {JSON.stringify(bridgeData, null, 2)}
                </pre>
              </CardContent>
            </Card>

            
            <FormField
              control={form.control}
              name="hasAcceptedTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value || reviewData.tosAccepted || false}
                      onCheckedChange={(checked) => {
                        console.log('🔲 Checkbox clicked:', checked);
                        console.log('📝 Current field value:', field.value);
                        console.log('🎯 Checked value received:', checked);
                        
                        // If Bridge ToS is accepted, always keep it checked
                        const newValue = reviewData.tosAccepted || checked === true;
                        setValue("hasAcceptedTerms", newValue, { shouldValidate: true });
                        console.log('✅ Set hasAcceptedTerms to:', newValue);
                        console.log('🌉 Bridge ToS accepted:', reviewData.tosAccepted);
                        
                        // Also call field.onChange for consistency
                        field.onChange(newValue);
                      }}
                      disabled={false}
                      className={(field.value || reviewData.tosAccepted) ? "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" : ""}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel 
                      className={(field.value || reviewData.tosAccepted) ? "text-green-600" : "cursor-pointer"}
                      onClick={() => {
                        const currentState = field.value || reviewData.tosAccepted;
                        const newValue = reviewData.tosAccepted || !currentState;
                        console.log('🏷️ Label clicked, current:', currentState, 'setting to:', newValue);
                        setValue("hasAcceptedTerms", newValue, { shouldValidate: true });
                      }}
                    >
                      Acepto los Términos de Servicio y Política de Privacidad *
                    </FormLabel>
                    <FormDescription>
                      {reviewData.tosAccepted ? 
                        "Bridge ToS ya aceptados. Por favor, acepta también nuestros términos generales." :
                        "Al marcar esta casilla, aceptas nuestros términos de servicio y confirmas que toda la información proporcionada es precisa y completa."
                      }
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
    <div className={cn("max-w-2xl mx-auto space-y-6", className)}>
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
      
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Registro Individual</h1>
          <Badge variant="outline">
            Paso {currentStep} de {FORM_STEPS.length}
          </Badge>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        {/* Step Indicators */}
        <div className="flex justify-between text-xs">
          {FORM_STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep || 
              (step.id === 5 && watchedValues.tosAccepted);
            const isCurrent = stepNumber === currentStep;
            
            return (
              <div 
                key={step.id} 
                className={cn(
                  "flex items-center gap-1",
                  isCompleted && "text-green-600",
                  isCurrent && !isCompleted && "text-primary font-medium",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <span className={cn(
                    "w-3 h-3 rounded-full border",
                    isCurrent && "bg-primary border-primary",
                    !isCurrent && "border-muted-foreground"
                  )} />
                )}
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sm:hidden">{stepNumber}</span>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center gap-2">
          {currentStepData.id === 5 && watchedValues.tosAccepted ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <currentStepData.icon className="h-5 w-5 text-primary" />
          )}
          <div>
            <h2 className="font-semibold">
              {currentStepData.title}
              {currentStepData.id === 5 && watchedValues.tosAccepted && (
                <span className="ml-2 text-green-600 text-sm">✓ Completado</span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {renderStepContent()}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentStep === 1 ? 'Volver a Selección de Tipo' : 'Anterior'}
        </Button>

        {currentStep === FORM_STEPS.length ? (
          <Button
            onClick={async () => {
              console.log('🚀 BUTTON CLICKED! Submit button was pressed');
              console.log('Submit clicked - Form state:', {
                isValid,
                errors: form.formState.errors,
                values: form.getValues()
              });
              
              // First manually validate the form, but skip file validation for now
              // Files are handled separately in uploadedFiles state
              const formData = form.getValues();
              
              // Check critical required fields manually
              console.log('🔍 Starting critical fields validation...');
              console.log('📋 Current form data:', formData);
              console.log('🎯 ToS fields:', {
                tosAccepted: formData.tosAccepted,
                tosSignedAgreementId: formData.tosSignedAgreementId,
                hasAcceptedTerms: formData.hasAcceptedTerms
              });

              // Also check what's actually in the form state
              const currentFormValues = form.getValues();
              console.log('📝 Current form values from form.getValues():', {
                tosAccepted: currentFormValues.tosAccepted,
                tosSignedAgreementId: currentFormValues.tosSignedAgreementId,
                hasAcceptedTerms: currentFormValues.hasAcceptedTerms
              });

              const criticalFields = ['firstName', 'lastName', 'email', 'birthDate'];
              
              // Check ToS fields separately with more detailed logic
              const tosFields = ['tosAccepted', 'tosSignedAgreementId', 'hasAcceptedTerms'];
              const basicMissingFields = criticalFields.filter(field => {
                const value = formData[field as keyof typeof formData];
                return !value || value === '';
              });
              
              const tosMissingFields = tosFields.filter(field => {
                const formDataValue = formData[field as keyof typeof formData];
                const formStateValue = currentFormValues[field as keyof typeof currentFormValues];
                
                // Consider the field missing only if BOTH form data and form state don't have it
                const isMissing = (!formDataValue || formDataValue === '') && 
                                 (!formStateValue || formStateValue === '');
                
                console.log(`🔍 Checking ${field}:`, {
                  formDataValue,
                  formStateValue,
                  isMissing
                });
                
                return isMissing;
              });
              
              const missingFields = [...basicMissingFields, ...tosMissingFields];
              
              console.log('Critical fields validation result:', { 
                basicMissingFields, 
                tosMissingFields, 
                totalMissingFields: missingFields 
              });
              
              if (missingFields.length > 0) {
                console.log('❌ Missing critical fields:', missingFields);
                toast({
                  title: "Campos Requeridos",
                  description: `Por favor completa: ${missingFields.join(', ')}`,
                  variant: "destructive",
                  duration: 8000,
                });
                return;
              }
              
              console.log('✅ All critical fields validation passed!');
              
              // Check if we have uploaded files - check multiple sources:
              // 1. Local uploadedFiles state
              const hasIdentifyingFiles = uploadedFiles.has('identifyingInformation') && 
                uploadedFiles.get('identifyingInformation')!.length > 0;
              
              // 2. Form field values (direct file objects)
              const hasFilesInForm = formData.identifyingInformation?.[0]?.imageFront || 
                formData.identifyingInformation?.[0]?.imageBack;
              
              // 3. Check if files exist in the database
              let hasFilesInDB = false;
              try {
                const response = await fetch('/api/registration-draft');
                if (response.ok) {
                  const { draft } = await response.json();
                  if (draft?.files && typeof draft.files === 'object') {
                    hasFilesInDB = Object.keys(draft.files).length > 0;
                  }
                }
              } catch (error) {
                console.warn('Failed to check files in database:', error);
              }
              
              console.log('File validation check:', {
                hasIdentifyingFiles,
                hasFilesInForm,
                hasFilesInDB,
                uploadedFilesSize: uploadedFiles.size,
                formDataFiles: formData.identifyingInformation
              });
              
              if (!hasIdentifyingFiles && !hasFilesInForm && !hasFilesInDB) {
                toast({
                  title: "Documentos Requeridos",
                  description: "Por favor sube al menos un documento de identificación.",
                  variant: "destructive",
                  duration: 8000,
                });
                return;
              }
              
              console.log('Manual validation passed');
              
              // If validation passes, submit the form
              console.log('Submitting form data:', formData);
              await onSubmit(formData);
            }}
            disabled={isSubmitting || isProcessingTosCallback}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : isProcessingTosCallback ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando términos...
              </>
            ) : (
              <>
                Enviar Solicitud
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
          >
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}