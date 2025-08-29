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
  User,
  Clock,
  DollarSign,
  Hash,
  Eye,
  EyeOff,
  Calendar,
  Shield,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Loader2,
  Ban,
  Wallet,
} from "lucide-react";
import {
  FlatCardWithDetails,
  BalanceAdditionStatus,
} from "@/types/card";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";

interface FlatCardDetailsModalProps {
  card: FlatCardWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FlatCardDetailsModal({
  card,
  isOpen,
  onClose,
}: FlatCardDetailsModalProps) {
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  if (!card) return null;

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP p");
    } catch {
      return dateString;
    }
  };

  const maskCardNumber = (pan: string) => {
    return showSensitiveData ? pan : `****-****-****-${pan.slice(-4)}`;
  };

  const maskCVV = (cvv: string) => {
    return showSensitiveData ? cvv : "***";
  };

  const getStatusBadge = (
    isActive: boolean,
    terminated: boolean,
    frozen: boolean
  ) => {
    if (terminated) {
      return <Badge variant="destructive">Terminated</Badge>;
    }
    if (frozen) {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          Frozen
        </Badge>
      );
    }
    if (isActive) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          Active
        </Badge>
      );
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const getBalanceAdditionStatusIcon = (status: BalanceAdditionStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "cancelled":
        return <Ban className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getBalanceAdditionStatusVariant = (status: BalanceAdditionStatus) => {
    switch (status) {
      case "completed":
        return "default" as const;
      case "pending":
        return "secondary" as const;
      case "processing":
        return "outline" as const;
      case "failed":
        return "destructive" as const;
      case "cancelled":
        return "secondary" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Card Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          <div className="space-y-6">
            {/* Card Status and Basic Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Hash className="h-4 w-4" />
                    Card Information
                  </CardTitle>
                  {getStatusBadge(card.isActive, card.terminated, card.frozen)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Card ID
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {card.moonCardId}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopyToClipboard(card.moonCardId, "Card ID")
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Product ID
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {card.cardProductId}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopyToClipboard(
                            card.cardProductId,
                            "Product ID"
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
                      Created
                    </p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(card.createdAt)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Updated
                    </p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(card.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Balance Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-4 w-4" />
                  Balance Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Current Balance
                    </p>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(card.balance)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Available Balance
                    </p>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(card.availableBalance)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-4 w-4" />
                    Card Details
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSensitiveData(!showSensitiveData)}
                  >
                    {showSensitiveData ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Show
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Card Number
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {maskCardNumber(card.pan)}
                      </code>
                      {showSensitiveData && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopyToClipboard(card.pan, "Card Number")
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      CVV
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {maskCVV(card.cvv)}
                      </code>
                      {showSensitiveData && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(card.cvv, "CVV")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Expiration
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">
                        {card.displayExpiration}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Support Token
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded break-all">
                        {card.supportToken}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopyToClipboard(
                            card.supportToken,
                            "Support Token"
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
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
                      {[card.profile.firstName, card.profile.lastName]
                        .filter(Boolean)
                        .join(" ") || "N/A"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <p className="font-medium">{card.profile.email || "N/A"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      User Tag
                    </p>
                    <p className="font-medium">
                      {card.profile.userTag || "N/A"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      User Status
                    </p>
                    <Badge
                      variant={
                        card.profile.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {card.profile.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Balance Additions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-4 w-4" />
                    Card Balance Additions
                  </CardTitle>
                  <Badge variant="outline">
                    {card.balanceAdditions?.length || 0} additions
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {!card.balanceAdditions ||
                card.balanceAdditions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="mx-auto h-8 w-8 mb-2" />
                    <p>No balance additions found for this card.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {card.balanceAdditions.map((addition) => (
                      <div key={addition.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getBalanceAdditionStatusIcon(addition.status)}
                            <Badge
                              variant={getBalanceAdditionStatusVariant(
                                addition.status
                              )}
                            >
                              {addition.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {addition.source.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              +{formatCurrency(addition.amount)}
                            </div>
                            {addition.feeAmount && (
                              <div className="text-sm text-muted-foreground">
                                Fee: {formatCurrency(addition.feeAmount)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Method:
                            </span>
                            <span className="ml-1 font-medium">
                              {addition.method}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Created:
                            </span>
                            <span className="ml-1 font-medium">
                              {formatDate(addition.createdAt)}
                            </span>
                          </div>
                          {addition.processedAt && (
                            <div>
                              <span className="text-muted-foreground">
                                Processed:
                              </span>
                              <span className="ml-1 font-medium">
                                {formatDate(addition.processedAt)}
                              </span>
                            </div>
                          )}
                          {addition.description && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">
                                Description:
                              </span>
                              <span className="ml-1 font-medium">
                                {addition.description}
                              </span>
                            </div>
                          )}
                        </div>

                        {addition.sourceTransactionId && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2">
                              <Wallet className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Source Transaction:
                              </span>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {addition.sourceTransactionId}
                              </code>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
