"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const authSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido"),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una letra minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type AuthFormData = z.infer<typeof authSchema>;

interface AuthStepProps {
  onComplete: (authData: { email: string; password: string; supabaseUser: any }) => void;
}

// Password strength calculation
const calculatePasswordStrength = (password: string) => {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  Object.values(checks).forEach(check => {
    if (check) score += 20;
  });

  let level = 'weak';
  let color = 'bg-red-500';
  
  if (score >= 80) {
    level = 'strong';
    color = 'bg-green-500';
  } else if (score >= 60) {
    level = 'good';
    color = 'bg-yellow-500';
  } else if (score >= 40) {
    level = 'fair';
    color = 'bg-orange-500';
  }

  return { score, level, color, checks };
};

export function AuthStep({ onComplete }: AuthStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const supabase = createClientComponentClient();

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    
    try {
      // Create new user - Supabase will handle duplicate email detection
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/sign-up/verify`,
        },
      });

      if (signUpError) {
        // Handle specific error cases
        if (signUpError.message.includes('already registered') || 
            signUpError.message.includes('User already registered') ||
            signUpError.code === 'user_already_exists') {
          toast({
            title: "Usuario ya registrado",
            description: "Este correo electrónico ya está registrado. Usa la página de inicio de sesión.",
            variant: "destructive",
          });
          return;
        }
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // Create profile record in our database
      try {
        const profileResponse = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: signUpData.user.id,
            email: data.email,
            firstName: '',
            lastName: '',
            role: 'USER',
            status: 'active',
          }),
        });

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          // If profile already exists, that's OK - user might be re-registering
          if (profileResponse.status !== 409) {
            console.error('Failed to create profile:', errorData);
            throw new Error('Failed to create user profile');
          }
        }

        toast({
          title: "¡Cuenta creada!",
          description: "Tu cuenta ha sido creada exitosamente. Continuemos con tu registro.",
        });

        onComplete({
          email: data.email,
          password: data.password,
          supabaseUser: signUpData.user,
        });

      } catch (profileError) {
        console.error('Profile creation error:', profileError);
        // Even if profile creation fails, we can still continue
        // The middleware and auth provider will handle missing profiles gracefully
        
        toast({
          title: "¡Cuenta creada!",
          description: "Tu cuenta ha sido creada. Continuemos con tu registro.",
        });

        onComplete({
          email: data.email,
          password: data.password,
          supabaseUser: signUpData.user,
        });
      }

    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error al crear cuenta",
        description: error.message || "No se pudo crear tu cuenta. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Tu correo electrónico será utilizado para acceder a tu cuenta y recibir notificaciones importantes sobre tu proceso KYC.
            </AlertDescription>
          </Alert>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo Electrónico *</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="tu@ejemplo.com" 
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => {
              const passwordStrength = calculatePasswordStrength(field.value || '');
              
              return (
                <FormItem>
                  <FormLabel>Contraseña *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        {...field}
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  
                  {/* Password Strength Indicator */}
                  {field.value && field.value.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Fortaleza de la contraseña:</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength.level === 'strong' ? 'text-green-600' :
                          passwordStrength.level === 'good' ? 'text-yellow-600' :
                          passwordStrength.level === 'fair' ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {passwordStrength.level === 'strong' ? 'Fuerte' :
                           passwordStrength.level === 'good' ? 'Buena' :
                           passwordStrength.level === 'fair' ? 'Regular' : 'Débil'}
                        </span>
                      </div>
                      <Progress value={passwordStrength.score} className="h-2" />
                      
                      {/* Password Requirements */}
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className={`flex items-center space-x-1 ${passwordStrength.checks.length ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{passwordStrength.checks.length ? '✓' : '○'}</span>
                          <span>8+ caracteres</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{passwordStrength.checks.uppercase ? '✓' : '○'}</span>
                          <span>Mayúscula</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{passwordStrength.checks.lowercase ? '✓' : '○'}</span>
                          <span>Minúscula</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${passwordStrength.checks.number ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{passwordStrength.checks.number ? '✓' : '○'}</span>
                          <span>Número</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar Contraseña *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repite tu contraseña"
                      {...field}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              <>
                Crear cuenta y continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}