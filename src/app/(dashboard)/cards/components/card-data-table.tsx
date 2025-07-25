"use client";

import {
  CreditCard,
  MoreHorizontal,
  Eye,
  Snowflake,
  Power,
  PowerOff,
  Ban,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCards, useUpdateCard, useDeleteCard } from "@/hooks/use-cards";
import { CardFilters, CardSummary } from "@/types/card";
import { formatDistanceToNow } from "date-fns";

interface CardDataTableProps {
  filters: CardFilters;
}

export function CardDataTable({ filters }: CardDataTableProps) {
  const { data, isLoading, error } = useCards(filters);
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadge = (card: CardSummary) => {
    if (card.terminated) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Ban className="h-3 w-3" />
          Terminated
        </Badge>
      );
    }
    if (card.frozen) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Snowflake className="h-3 w-3" />
          Frozen
        </Badge>
      );
    }
    if (!card.isActive) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <PowerOff className="h-3 w-3" />
          Inactive
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    );
  };

  const handleFreezeToggle = (card: CardSummary) => {
    updateCard.mutate({
      cardId: card.id,
      data: { frozen: !card.frozen },
    });
  };

  const handleActivateToggle = (card: CardSummary) => {
    updateCard.mutate({
      cardId: card.id,
      data: { isActive: !card.isActive },
    });
  };

  const handleDeactivate = (card: CardSummary) => {
    deleteCard.mutate(card.id);
  };

  const formatUserName = (card: CardSummary) => {
    if (!card.profile) return "Unknown User";
    const name = [card.profile.firstName, card.profile.lastName]
      .filter(Boolean)
      .join(" ");
    return name || card.profile.email || "Unknown User";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Cards...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-muted-foreground">Loading cards...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Failed to load cards. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.cards.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Cards Found</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {filters.search || filters.status
                ? "No cards match your current filters."
                : "No cards have been created yet."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Cards ({data.total})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.cards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs">
                        {card.moonCardId.slice(0, 8)}...
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ID: {card.id.slice(0, 8)}...
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {formatUserName(card)}
                      </span>
                      {card.profile?.email && (
                        <span className="text-xs text-muted-foreground">
                          {card.profile.email}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(card.balance)}
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    {formatCurrency(card.availableBalance)}
                  </TableCell>
                  <TableCell>{getStatusBadge(card)}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {card.displayExpiration}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(card.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>

                        {!card.terminated && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleFreezeToggle(card)}
                              disabled={updateCard.isPending}
                            >
                              {card.frozen ? (
                                <>
                                  <Snowflake className="h-4 w-4 mr-2" />
                                  Unfreeze Card
                                </>
                              ) : (
                                <>
                                  <Snowflake className="h-4 w-4 mr-2" />
                                  Freeze Card
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleActivateToggle(card)}
                              disabled={updateCard.isPending}
                            >
                              {card.isActive ? (
                                <>
                                  <PowerOff className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </>
                        )}

                        {card.isActive && !card.terminated && (
                          <DropdownMenuItem
                            onClick={() => handleDeactivate(card)}
                            disabled={deleteCard.isPending}
                            className="text-destructive"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Permanently Deactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination would go here - simplified for now */}
        {data.total > data.limit && (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {(data.page - 1) * data.limit + 1} to{" "}
              {Math.min(data.page * data.limit, data.total)} of {data.total}{" "}
              cards
            </div>
            {/* Add pagination controls here if needed */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
