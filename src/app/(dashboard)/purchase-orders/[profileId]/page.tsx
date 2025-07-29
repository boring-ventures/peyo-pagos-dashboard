"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CalendarIcon,
  Download,
  FileText,
  Loader2,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  PurchaseOrder,
  GeneratePurchaseOrderRequest,
  GeneratePurchaseOrderResponse,
} from "@/types/purchase-order";
import { canAccessModule } from "@/lib/auth/role-permissions";

export default function PurchaseOrderPage() {
  const { profile } = useAuth();
  const params = useParams();
  const profileId = params?.profileId as string;
  const printRef = useRef<HTMLDivElement>(null);

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for generation parameters
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");

  const handlePrint = useCallback(() => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Purchase Order ${purchaseOrder?.orderNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; }
                .company-info { text-align: center; margin-bottom: 20px; }
                .billing-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .billing-section { width: 45%; }
                .order-details { margin-bottom: 20px; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                .items-table th { background-color: #f5f5f5; font-weight: bold; }
                .totals { text-align: right; margin-bottom: 30px; }
                .total-line { margin-bottom: 8px; }
                .total-amount { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 8px; }
                .notes { margin-top: 30px; }
                @media print { body { margin: 0; } }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }, [purchaseOrder]);

  const handleDownloadPDF = useCallback(() => {
    // For now, trigger print dialog (PDF save option)
    handlePrint();
  }, [handlePrint]);

  // Check if user has access
  if (!profile || !canAccessModule(profile.role, "analytics")) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to generate purchase orders. Only
              administrators can access this feature.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleGeneratePurchaseOrder = async () => {
    if (!profileId) return;

    setIsGenerating(true);
    setError(null);

    try {
      const requestBody: GeneratePurchaseOrderRequest = {
        profileId,
        userId: profileId, // Assuming profileId maps to userId for now
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
        notes: notes || undefined,
        paymentTerms: paymentTerms || undefined,
      };

      const response = await fetch(
        `/api/purchase-orders/${profileId}/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: GeneratePurchaseOrderResponse = await response.json();
      setPurchaseOrder(data.purchaseOrder);
    } catch (err) {
      console.error("Error generating purchase order:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate purchase order"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Receipt className="h-8 w-8 text-primary" />
            Purchase Order Generator
          </h1>
          <p className="text-muted-foreground">
            Generate billing statements for KYC and wallet services
          </p>
        </div>
      </div>

      {/* Generation Form */}
      {!purchaseOrder && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generate Purchase Order</CardTitle>
            <CardDescription>
              Configure the parameters for generating a purchase order/bill
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Period Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate
                        ? format(startDate, "PPP")
                        : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Service Period End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g., Net 30, Due on Receipt"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes or terms..."
                rows={3}
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGeneratePurchaseOrder}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Purchase Order...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Purchase Order
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Purchase Order Display */}
      {purchaseOrder && (
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button onClick={handlePrint} variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button
              onClick={() => {
                setPurchaseOrder(null);
                setError(null);
              }}
              variant="outline"
            >
              Generate New
            </Button>
          </div>

          {/* Purchase Order Document */}
          <Card>
            <CardContent className="p-8">
              <div ref={printRef} className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold">PURCHASE ORDER</h1>
                  <p className="text-lg text-muted-foreground">
                    #{purchaseOrder.orderNumber}
                  </p>
                </div>

                {/* Company Info */}
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-semibold">
                    {purchaseOrder.billFrom.name}
                  </h2>
                  <p>{purchaseOrder.billFrom.email}</p>
                  {purchaseOrder.billFrom.phone && (
                    <p>{purchaseOrder.billFrom.phone}</p>
                  )}
                  {purchaseOrder.billFrom.address && (
                    <div className="text-sm text-muted-foreground">
                      <p>{purchaseOrder.billFrom.address.street}</p>
                      <p>
                        {purchaseOrder.billFrom.address.city},{" "}
                        {purchaseOrder.billFrom.address.state}{" "}
                        {purchaseOrder.billFrom.address.zipCode}
                      </p>
                      <p>{purchaseOrder.billFrom.address.country}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Billing Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-2">Bill To:</h3>
                    <div className="space-y-1">
                      <p className="font-medium">{purchaseOrder.billTo.name}</p>
                      <p>{purchaseOrder.billTo.email}</p>
                      {purchaseOrder.billTo.phone && (
                        <p>{purchaseOrder.billTo.phone}</p>
                      )}
                      {purchaseOrder.billTo.address && (
                        <div className="text-sm text-muted-foreground">
                          <p>{purchaseOrder.billTo.address.street}</p>
                          <p>
                            {purchaseOrder.billTo.address.city},{" "}
                            {purchaseOrder.billTo.address.state}{" "}
                            {purchaseOrder.billTo.address.zipCode}
                          </p>
                          <p>{purchaseOrder.billTo.address.country}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Order Details:</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Order Date:</span>
                        <span>
                          {format(
                            new Date(purchaseOrder.orderDate),
                            "MMM dd, yyyy"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Due Date:</span>
                        <span>
                          {format(
                            new Date(purchaseOrder.dueDate),
                            "MMM dd, yyyy"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Terms:</span>
                        <span>{purchaseOrder.paymentTerms}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant="outline">{purchaseOrder.status}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Items Table */}
                <div>
                  <h3 className="font-semibold mb-4">Services & Products</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-3 text-left">
                            Description
                          </th>
                          <th className="border border-gray-200 px-4 py-3 text-center">
                            Qty
                          </th>
                          <th className="border border-gray-200 px-4 py-3 text-right">
                            Unit Price
                          </th>
                          <th className="border border-gray-200 px-4 py-3 text-right">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td className="border border-gray-200 px-4 py-3">
                              <div>
                                <div className="font-medium">
                                  {item.description}
                                </div>
                                {item.serviceDate && (
                                  <div className="text-sm text-muted-foreground">
                                    Service Date:{" "}
                                    {format(
                                      new Date(item.serviceDate),
                                      "MMM dd, yyyy"
                                    )}
                                  </div>
                                )}
                                <Badge variant="outline" className="mt-1">
                                  {item.category}
                                </Badge>
                              </div>
                            </td>
                            <td className="border border-gray-200 px-4 py-3 text-center">
                              {item.quantity}
                            </td>
                            <td className="border border-gray-200 px-4 py-3 text-right">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="border border-gray-200 px-4 py-3 text-right font-medium">
                              {formatCurrency(item.totalPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Separator />

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(purchaseOrder.subtotal)}</span>
                    </div>
                    {purchaseOrder.taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span>
                          Tax ({(purchaseOrder.taxRate * 100).toFixed(1)}%):
                        </span>
                        <span>{formatCurrency(purchaseOrder.taxAmount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(purchaseOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {purchaseOrder.notes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Notes:</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {purchaseOrder.notes}
                      </p>
                    </div>
                  </>
                )}

                {/* Footer */}
                <div className="text-center text-sm text-muted-foreground pt-8">
                  <p>Thank you for your business!</p>
                  <p>
                    Generated on {format(new Date(), "PPP")} by{" "}
                    {purchaseOrder.billFrom.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
