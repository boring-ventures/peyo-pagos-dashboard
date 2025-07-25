"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import { USER_ROLE_LABELS } from "@/types/user";
import { PasswordInput } from "@/components/utils/password-input";
import { PasswordStrengthIndicator } from "@/components/utils/password-strength-indicator";
import { saltAndHashPassword } from "@/lib/auth/password-crypto";

const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Debe ser un email válido"),
  firstName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  lastName: z
    .string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede exceder 50 caracteres"),
  role: z.enum(["USER", "ADMIN", "SUPERADMIN"], {
    required_error: "Debe seleccionar un rol",
  }),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una letra minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

export function CreateUserModal({
  open,
  onOpenChange,
  onUserCreated,
}: CreateUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "USER",
      password: "",
    },
  });

  const onSubmit = async (values: CreateUserFormValues) => {
    setIsSubmitting(true);
    try {
      // Hash the password with email as salt (same as sign-in flow)
      const hashedPassword = await saltAndHashPassword(
        values.password,
        values.email
      );

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          password: hashedPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear usuario");
      }

      toast({
        title: "Usuario creado exitosamente",
        description: `${values.firstName} ${values.lastName} ha sido creado como ${USER_ROLE_LABELS[values.role]} con acceso de autenticación`,
      });

      form.reset();
      setPassword("");
      onUserCreated();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al crear usuario";

      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      setPassword("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Crear Nuevo Usuario
          </DialogTitle>
          <DialogDescription>
            Crea un nuevo usuario en la plataforma. Los usuarios regulares
            requerirán verificación KYC, mientras que los super administradores
            tendrán acceso completo sin KYC.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Juan"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Pérez"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="juan.perez@ejemplo.com"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        field.onChange(e);
                        setPassword(e.target.value);
                      }}
                    />
                  </FormControl>
                  <PasswordStrengthIndicator password={password} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(USER_ROLE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                          {key === "SUPERADMIN" && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (Sin KYC, Analytics)
                            </span>
                          )}
                          {key === "ADMIN" && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (Sin KYC, Sin Analytics)
                            </span>
                          )}
                          {key === "USER" && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (Requiere KYC)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear Usuario
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
