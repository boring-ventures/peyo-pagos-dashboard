import { Card as PrismaCard } from "@prisma/client";

// PayWithMoon API Response Types
export interface PayWithMoonCardResponse {
  card: {
    id: string;
    balance: number;
    available_balance: number;
    expiration: string;
    display_expiration: string;
    terminated: boolean;
    card_product_id: string;
    pan: string;
    cvv: string;
    support_token: string;
    frozen: boolean;
  };
}

// PayWithMoon API Request Types
export interface CreateCardRequest {
  end_customer_id: string;
  amount: number;
  card_type: "VIRTUAL";
  card_currency: "USD";
}

// Database Types
export type Card = PrismaCard;

export interface CardWithProfile extends Card {
  profile: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}

// Frontend Display Types
export interface CardSummary {
  id: string;
  moonCardId: string;
  balance: number;
  availableBalance: number;
  displayExpiration: string;
  terminated: boolean;
  frozen: boolean;
  isActive: boolean;
  createdAt: Date;
  profile?: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}

// API Response Types
export interface CardsStatsResponse {
  totalCards: number;
  activeCards: number;
  terminatedCards: number;
  frozenCards: number;
  totalBalance: number;
  totalAvailableBalance: number;
}

export interface CardsResponse {
  cards: CardSummary[];
  total: number;
  page: number;
  limit: number;
}

// Card Status Types
export type CardStatus = "active" | "terminated" | "frozen" | "inactive";

// Card Filters
export interface CardFilters {
  status?: CardStatus;
  search?: string;
  page?: number;
  limit?: number;
}
