"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, CreditCard } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useCreateCardForProfile } from "@/hooks/use-cards";

const formSchema = z.object({
  profileId: z.string().min(1, "Please select a user"),
  amount: z.coerce
    .number()
    .min(10, "Minimum amount is $10")
    .max(10000, "Maximum amount is $10,000"),
});

type FormData = z.infer<typeof formSchema>;

interface EligibleProfile {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export function CreateCardModal() {
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<EligibleProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const createCard = useCreateCardForProfile();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profileId: "",
      amount: 100,
    },
  });

  const fetchEligibleProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const response = await fetch("/api/profiles?kycApproved=true");
      if (!response.ok) throw new Error("Failed to fetch profiles");

      const data = await response.json();
      setProfiles(data.profiles || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load eligible users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchEligibleProfiles();
    } else {
      form.reset();
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createCard.mutateAsync(data);
      setOpen(false);
      form.reset();
    } catch {
      // Error handling is done in the hook
    }
  };

  const getUserDisplayName = (profile: EligibleProfile) => {
    const name = [profile.firstName, profile.lastName]
      .filter(Boolean)
      .join(" ");
    return name || profile.email || "Usuario Sin Nombre";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Crear Tarjeta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Crear Nueva Tarjeta PayWithMoon
          </DialogTitle>
          <DialogDescription>
            Crea una nueva tarjeta de débito virtual para un usuario con KYC
            aprobado. La tarjeta será procesada a través de PayWithMoon.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="profileId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuario Elegible *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loadingProfiles}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingProfiles
                              ? "Cargando usuarios..."
                              : "Selecciona un usuario con KYC aprobado"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingProfiles ? (
                        <SelectItem value="" disabled>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Cargando...
                          </div>
                        </SelectItem>
                      ) : profiles.length === 0 ? (
                        <SelectItem value="" disabled>
                          No hay usuarios elegibles
                        </SelectItem>
                      ) : (
                        profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {getUserDisplayName(profile)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ID: {profile.userId.slice(0, 8)}... •{" "}
                                {profile.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Solo se muestran usuarios con KYC aprobado y Bridge Customer
                    ID.
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto Inicial (USD) *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        placeholder="100"
                        className="pl-7"
                        min={10}
                        max={10000}
                        step={1}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Monto entre $10 y $10,000 USD. Este será el balance inicial
                    de la tarjeta.
                  </p>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createCard.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createCard.isPending}
                className="flex items-center gap-2"
              >
                {createCard.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {createCard.isPending ? "Creando..." : "Crear Tarjeta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
