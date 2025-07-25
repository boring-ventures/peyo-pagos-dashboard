"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, CreditCard, User, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { useCreateCard } from "@/hooks/use-cards";
import { Loader } from "@/components/ui/loader";

// Form validation schema
const createCardSchema = z.object({
  profileId: z.string().min(1, "Please select a user profile"),
  amount: z.coerce
    .number()
    .min(10, "Minimum amount is $10")
    .max(10000, "Maximum amount is $10,000"),
});

type CreateCardFormData = z.infer<typeof createCardSchema>;

interface Profile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  kycProfile?: {
    bridgeCustomerId: string | null;
  };
}

export function CreateCardModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const createCard = useCreateCard();

  const form = useForm<CreateCardFormData>({
    resolver: zodResolver(createCardSchema),
    defaultValues: {
      profileId: "",
      amount: 100,
    },
  });

  // Fetch eligible profiles when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchEligibleProfiles();
    }
  }, [isOpen]);

  const fetchEligibleProfiles = async () => {
    setLoadingProfiles(true);
    try {
      // Fetch users with approved KYC who can have cards
      const response = await fetch("/api/profiles?role=USER&kycApproved=true");
      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const onSubmit = async (data: CreateCardFormData) => {
    try {
      await createCard.mutateAsync(data);
      setIsOpen(false);
      form.reset();
    } catch (error) {
      // Error handling is done in the hook
      console.error("Error creating card:", error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  const formatDisplayName = (profile: Profile) => {
    const name = [profile.firstName, profile.lastName]
      .filter(Boolean)
      .join(" ");
    return name || profile.email || "Unknown User";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Create Card
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Create New Card
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Selection */}
            <FormField
              control={form.control}
              name="profileId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User Profile
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user profile" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingProfiles ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader size="sm" />
                          <span className="ml-2 text-sm text-muted-foreground">
                            Loading profiles...
                          </span>
                        </div>
                      ) : profiles.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No eligible profiles found
                        </div>
                      ) : (
                        profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {formatDisplayName(profile)}
                              </span>
                              {profile.email && (
                                <span className="text-xs text-muted-foreground">
                                  {profile.email}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a user with approved KYC to create a card for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Initial Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Initial Amount (USD)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="10"
                      max="10000"
                      placeholder="100"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Set the initial balance for the card ($10 - $10,000)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={createCard.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createCard.isPending}>
                {createCard.isPending ? (
                  <>
                    <Loader size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Create Card
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
