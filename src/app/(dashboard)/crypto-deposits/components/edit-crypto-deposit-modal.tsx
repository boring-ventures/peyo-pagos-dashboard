"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateCryptoDeposit } from "@/hooks/use-crypto-deposits";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import type { CryptoDepositConfig, UpdateCryptoDepositConfigRequest } from "@/types/crypto-deposits";

const formSchema = z.object({
  chainName: z.string().min(1, "Chain name is required"),
  displayName: z.string().min(1, "Display name is required"),
  isEnabled: z.boolean(),
  supportedTokens: z.array(z.object({
    id: z.string().optional(),
    symbol: z.string().min(1, "Symbol is required"),
    name: z.string().min(1, "Name is required"),
    contractAddress: z.string().optional(),
    decimals: z.number().int().min(0, "Decimals must be 0 or greater"),
    isEnabled: z.boolean(),
    minimumDeposit: z.number().optional(),
    maximumDeposit: z.number().optional(),
    depositInstructions: z.string().optional(),
    iconUrl: z.string().optional(),
  })).min(1, "At least one token is required"),
  depositInstructions: z.string().min(1, "Deposit instructions are required"),
  minimumAmount: z.number().optional(),
  maximumAmount: z.number().optional(),
  processingTime: z.string().min(1, "Processing time is required"),
  riskLevel: z.enum(["low", "medium", "high"]),
  iconUrl: z.string().optional(),
  explorerUrl: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditCryptoDepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CryptoDepositConfig;
}

export function EditCryptoDepositModal({
  open,
  onOpenChange,
  config,
}: EditCryptoDepositModalProps) {
  const updateMutation = useUpdateCryptoDeposit(config.id);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chainName: config.chainName,
      displayName: config.displayName,
      isEnabled: config.isEnabled,
      supportedTokens: config.supportedTokens,
      depositInstructions: config.depositInstructions,
      minimumAmount: config.minimumAmount,
      maximumAmount: config.maximumAmount,
      processingTime: config.processingTime,
      riskLevel: config.riskLevel,
      iconUrl: config.iconUrl,
      explorerUrl: config.explorerUrl,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "supportedTokens",
  });

  // Reset form when config changes
  useEffect(() => {
    if (config) {
      form.reset({
        chainName: config.chainName,
        displayName: config.displayName,
        isEnabled: config.isEnabled,
        supportedTokens: config.supportedTokens,
        depositInstructions: config.depositInstructions,
        minimumAmount: config.minimumAmount,
        maximumAmount: config.maximumAmount,
          processingTime: config.processingTime,
        riskLevel: config.riskLevel,
        iconUrl: config.iconUrl,
        explorerUrl: config.explorerUrl,
      });
    }
  }, [config, form]);

  const addToken = () => {
    append({
      symbol: "",
      name: "",
      contractAddress: "",
      decimals: 18,
      isEnabled: true,
      minimumDeposit: undefined,
      maximumDeposit: undefined,
      depositInstructions: "",
      iconUrl: "",
    });
  };

  const onSubmit = async (data: FormData) => {
    try {
      const requestData: UpdateCryptoDepositConfigRequest = {
        ...data,
        supportedTokens: data.supportedTokens.map((token, index) => ({
          id: token.id || `token-${index}`,
          symbol: token.symbol,
          name: token.name,
          contractAddress: token.contractAddress || undefined,
          decimals: token.decimals,
          isEnabled: token.isEnabled,
          minimumDeposit: token.minimumDeposit || undefined,
          maximumDeposit: token.maximumDeposit || undefined,
          depositInstructions: token.depositInstructions || undefined,
          iconUrl: token.iconUrl || undefined,
        })),
      };

      await updateMutation.mutateAsync(requestData);
      
      toast({
        title: "Configuration Updated",
        description: `${data.displayName} has been updated successfully.`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update configuration",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Edit {config.displayName} Configuration
          </DialogTitle>
          <DialogDescription>
            Update the configuration for {config.chainName} blockchain deposits.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Chain Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chain Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Badge variant="outline">{config.chainId}</Badge>
                  <span className="text-sm text-muted-foreground">Chain ID (cannot be changed)</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="chainName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chain Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="iconUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon URL (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/icon.png" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="explorerUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Explorer URL</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Chain</FormLabel>
                        <FormDescription>
                          Allow deposits for this chain in the mobile app
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="depositInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={4}
                          placeholder="e.g., Send only supported tokens to this address. Minimum confirmations: 12. Processing time: 5-15 minutes."
                          className="resize-none"
                        />
                      </FormControl>
                      <FormDescription>
                        Instructions shown to users when depositing on this chain. Be specific about requirements, confirmations, and processing times.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="processingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Processing Time</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="5-10 minutes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="riskLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minimumAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Amount (USD)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maximumAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Amount (USD)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Supported Tokens */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Supported Tokens</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addToken}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Token
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline">Token {index + 1}</Badge>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name={`supportedTokens.${index}.symbol`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Symbol</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="ETH" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`supportedTokens.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ethereum" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name={`supportedTokens.${index}.contractAddress`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contract Address (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="0x..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`supportedTokens.${index}.decimals`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Decimals</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name={`supportedTokens.${index}.minimumDeposit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min Deposit (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.000001"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`supportedTokens.${index}.maximumDeposit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Deposit (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.000001"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`supportedTokens.${index}.depositInstructions`}
                      render={({ field }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Token-specific Instructions (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={2}
                              placeholder="e.g., For ERC-20 tokens, ensure sufficient ETH for gas fees"
                              className="resize-none"
                            />
                          </FormControl>
                          <FormDescription>
                            Additional instructions specific to this token (overrides chain instructions)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`supportedTokens.${index}.isEnabled`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Enable Token</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </Card>
                ))}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update Configuration"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}