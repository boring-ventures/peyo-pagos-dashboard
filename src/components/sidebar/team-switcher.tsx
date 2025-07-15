import * as React from "react";
import Image from "next/image";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="pointer-events-none">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
            <Image
              src="/assets/logo.png"
              alt="PEYO"
              width={32}
              height={32}
              className="rounded-md"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate ">
              PEYO Pagos
            </span>
            <span className="truncate text-xs text-muted-foreground"></span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
