"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Copy,
  CreditCard,
  Wallet,
  User,
  Clock,
  ArrowRightLeft,
  DollarSign,
  Hash,
  Globe,
} from "lucide-react";
import { TransactionDetailsModalProps } from "@/types/transaction";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

export function TransactionDetailsModal({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailsModalProps) {
  if (!transaction) return null;

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    });
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num)
      ? amount
      : num.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP p");
    } catch {
      return dateString;
    }
  };

  const getChainBadgeColor = (chain: string) => {
    const colors: Record<string, string> = {
      solana:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      base: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      ethereum: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      polygon:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
    return (
      colors[chain.toLowerCase()] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaction Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          <div className="space-y-6">
            {/* Basic Transaction Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Hash className="h-4 w-4" />
                  Transaction Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Transaction ID
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {transaction.bridgeTransactionId}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopyToClipboard(
                            transaction.bridgeTransactionId,
                            "Transaction ID"
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Customer ID
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {transaction.customerId}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopyToClipboard(
                            transaction.customerId,
                            "Customer ID"
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Amount
                    </p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-lg font-semibold">
                        {formatAmount(transaction.amount)}
                      </span>
                      {transaction.sourceCurrency && (
                        <Badge variant="outline">
                          {transaction.sourceCurrency.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {transaction.developerFee && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Developer Fee
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-medium text-orange-600">
                          {formatAmount(transaction.developerFee)}
                        </span>
                        {transaction.sourceCurrency && (
                          <Badge variant="outline">
                            {transaction.sourceCurrency.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Created
                    </p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(transaction.bridgeCreatedAt)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Updated
                    </p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(transaction.bridgeUpdatedAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Rails & Currencies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ArrowRightLeft className="h-4 w-4" />
                  Payment Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center space-x-4">
                  {/* Source */}
                  <div className="text-center space-y-2 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      From
                    </p>
                    <div className="space-y-1">
                      {transaction.sourcePaymentRail && (
                        <Badge
                          className={getChainBadgeColor(
                            transaction.sourcePaymentRail
                          )}
                        >
                          {transaction.sourcePaymentRail.toUpperCase()}
                        </Badge>
                      )}
                      {transaction.sourceCurrency && (
                        <div>
                          <Badge variant="outline">
                            {transaction.sourceCurrency.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-center">
                    <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
                  </div>

                  {/* Destination */}
                  <div className="text-center space-y-2 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      To
                    </p>
                    <div className="space-y-1">
                      {transaction.destinationPaymentRail && (
                        <Badge
                          className={getChainBadgeColor(
                            transaction.destinationPaymentRail
                          )}
                        >
                          {transaction.destinationPaymentRail.toUpperCase()}
                        </Badge>
                      )}
                      {transaction.destinationCurrency && (
                        <div>
                          <Badge variant="outline">
                            {transaction.destinationCurrency.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wallet className="h-4 w-4" />
                  Wallet Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Wallet Address
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded break-all">
                        {transaction.wallet.address}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopyToClipboard(
                            transaction.wallet.address,
                            "Wallet Address"
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Chain
                    </p>
                    <Badge
                      className={getChainBadgeColor(transaction.wallet.chain)}
                    >
                      {transaction.wallet.chain.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Wallet Tag
                  </p>
                  <Badge variant="secondary">
                    {transaction.wallet.walletTag
                      .replace("_", " ")
                      .toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-4 w-4" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Name
                    </p>
                    <p className="font-medium">
                      {[
                        transaction.wallet.profile.firstName,
                        transaction.wallet.profile.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ") || "N/A"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <p className="font-medium">
                      {transaction.wallet.profile.email || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      User Tag
                    </p>
                    <p className="font-medium">
                      {transaction.wallet.profile.userTag || "N/A"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Status
                    </p>
                    <Badge
                      variant={
                        transaction.wallet.profile.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {transaction.wallet.profile.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Raw Bridge Data */}
            {transaction.bridgeRawData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="h-4 w-4" />
                    Bridge API Raw Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
                    {JSON.stringify(transaction.bridgeRawData, null, 2)}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      handleCopyToClipboard(
                        JSON.stringify(transaction.bridgeRawData, null, 2),
                        "Raw Bridge Data"
                      )
                    }
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Raw Data
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
