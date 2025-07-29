"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateCryptoDeposit } from "@/hooks/use-crypto-deposits";
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
import { Plus, Trash2, Coins } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import type { CreateCryptoDepositConfigRequest } from "@/types/crypto-deposits";

const formSchema = z.object({
  chainId: z.string().min(1, "Chain ID is required"),
  chainName: z.string().min(1, "Chain name is required"),
  displayName: z.string().min(1, "Display name is required"),
  isEnabled: z.boolean(),
  supportedTokens: z.array(z.object({
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

interface CreateCryptoDepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCryptoDepositModal({
  open,
  onOpenChange,
}: CreateCryptoDepositModalProps) {
  const createMutation = useCreateCryptoDeposit();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chainId: "",
      chainName: "",
      displayName: "",
      isEnabled: true,
      supportedTokens: [],
      depositInstructions: "",
      processingTime: "5-10 minutes",
      riskLevel: "low",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "supportedTokens",
  });


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
      const requestData: CreateCryptoDepositConfigRequest = {
        ...data,
        supportedTokens: data.supportedTokens.map(token => ({
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

      await createMutation.mutateAsync(requestData);
      
      toast({
        title: "Configuration Created",
        description: `${data.displayName} has been added successfully.`,
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create configuration",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Add New Chain Configuration
          </DialogTitle>
          <DialogDescription>
            Configure a new blockchain network for crypto deposits in the mobile app.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Chain Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chain Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="chainId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chain ID</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., ethereum, arbitrum, base, polygon"
                        />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for the blockchain network (snake_case format)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="chainName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chain Name (snake_case)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., ethereum_mainnet, arbitrum_one"
                          />
                        </FormControl>
                        <FormDescription>
                          Internal name for mobile app identification (snake_case)
                        </FormDescription>
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
                          <Input {...field} placeholder="e.g., Ethereum Mainnet, Arbitrum One" />
                        </FormControl>
                        <FormDescription>
                          User-friendly name shown in the mobile app
                        </FormDescription>
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
                          <Input {...field} placeholder="https://etherscan.io" />
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
                            These instructions will be shown to users in the mobile app
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Configuration"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}