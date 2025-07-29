"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCostEntries } from "@/hooks/use-cost-entries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Receipt,
  Wallet,
  Users,
  AlertTriangle,
  Filter,
} from "lucide-react";
import type { CostEntry, AnalyticsDateRange } from "@/types/analytics";

interface CostEntriesTableProps {
  dateRange?: AnalyticsDateRange;
}

export function CostEntriesTable({ dateRange }: CostEntriesTableProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<"kyc" | "wallet" | "all">("all");
  const limit = 25;

  const { data, isLoading, error } = useCostEntries({
    ...dateRange,
    page,
    limit,
    type: typeFilter === "all" ? undefined : typeFilter,
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getTypeIcon = (type: CostEntry["type"]) => {
    switch (type) {
      case "kyc":
        return <Users className="h-4 w-4 text-blue-600" />;
      case "wallet":
        return <Wallet className="h-4 w-4 text-purple-600" />;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: CostEntry["type"]) => {
    switch (type) {
      case "kyc":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            KYC
          </Badge>
        );
      case "wallet":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            Wallet
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleViewDetails = (entryId: string) => {
    router.push(`/analytics/costs/${entryId}`);
  };

  const handlePreviousPage = () => {
    if (data?.pagination.hasPreviousPage) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (data?.pagination.hasNextPage) {
      setPage(page + 1);
    }
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value as "kyc" | "wallet" | "all");
    setPage(1); // Reset to first page when changing filter
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Individual Cost Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load cost entries: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Individual Cost Entries
            </CardTitle>
            <CardDescription>
              Detailed breakdown of all platform costs with individual bills
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="kyc">KYC Only</SelectItem>
                <SelectItem value="wallet">Wallets Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.costEntries.length ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No cost entries found</p>
            <p className="text-sm text-muted-foreground">
              Cost entries will appear as KYCs are processed and wallets are created
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.costEntries.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(entry.type)}
                        {getTypeBadge(entry.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{entry.userName || "Unknown"}</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.userEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium">{entry.description}</div>
                        {entry.metadata.kycStatus && (
                          <div className="text-sm text-muted-foreground">
                            Status: {entry.metadata.kycStatus.replace(/_/g, " ")}
                          </div>
                        )}
                        {entry.metadata.walletChain && (
                          <div className="text-sm text-muted-foreground">
                            Chain: {entry.metadata.walletChain}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono font-semibold text-green-600">
                        {formatCurrency(entry.amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(entry.createdAt)}</div>
                    </TableCell>
                    <TableCell>
                      {entry.metadata.kycStatus && (
                        <Badge
                          variant="outline"
                          className={
                            entry.metadata.kycStatus === "active"
                              ? "bg-green-50 text-green-700"
                              : entry.metadata.kycStatus === "rejected"
                              ? "bg-red-50 text-red-700"
                              : "bg-yellow-50 text-yellow-700"
                          }
                        >
                          {entry.metadata.kycStatus.replace(/_/g, " ")}
                        </Badge>
                      )}
                      {entry.type === "wallet" && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(entry.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Bill
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, data.pagination.totalCount)} of{" "}
                {data.pagination.totalCount} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={!data.pagination.hasPreviousPage}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {data.pagination.currentPage} of{" "}
                  {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!data.pagination.hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}