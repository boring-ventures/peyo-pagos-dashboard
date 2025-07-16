import type { UserRole, UserStatus } from "@prisma/client";

export interface Profile {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  email?: string;
  firstName?: string;
  lastName?: string;
  status: UserStatus;
  role: UserRole;
}
