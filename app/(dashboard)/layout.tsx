// app/(dashboard)/layout.tsx
"use client";
import React from "react";

// Server wrapper keeps RSC benefits while loading a client shell for interactivity
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}

/* =====================================================================================
   ClientShell: Sidebar + Header + Footer
   - Responsive sidebar (collapsible on desktop, sheet on mobile)
   - Header with search, actions, and user menu
   - Sticky footer
===================================================================================== */


import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Palette,
  Ruler,
  PanelsTopLeft,
  Boxes,
  Truck,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils"; // if you don’t have this helper, see inline fallback below
import {
  Button
} from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[]; 
  permission?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
  { label: "Products", href: "/products", icon: Package, permission: "products.manage" },
  { label: "Orders", href: "/orders", icon: ShoppingCart, permission: "orders.view" },
  { label: "Materials", href: "/materials", icon: Palette, permission: "products.manage" },
  { label: "Styles", href: "/styles", icon: Sparkles, permission: "products.manage" },
  { label: "Soles", href: "/soles", icon: Layers, permission: "products.manage" },
  { label: "Sizes", href: "/sizes", icon: Ruler, permission: "products.manage" },
  { label: "Panels", href: "/panels", icon: PanelsTopLeft, permission: "products.manage" },
  { label: "Customers", href: "/customers", icon: Users, permission: "customers.manage" },
  { 
    label: "Settings", 
    href: "/settings", 
    icon: Settings,
    roles: ["ADMIN"],
    permission: "settings.manage"
  },
  {
    label: "Users",
    href: "/settings/users",
    icon: Users,
    roles: ["ADMIN"],
    permission: "users.manage"
  },
  {
    label: "Roles",
    href: "/settings/roles",
    icon: ShieldCheck,
    roles: ["ADMIN"],
    permission: "users.manage"
  }
];

function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "USER";
  const userPermissions = (session?.user as any)?.permissions || [];

  const allowedNavItems = useMemo(() => {
    return NAV_ITEMS.filter(item => {
      // Admin always has access
      if (userRole === "ADMIN") return true;

      // Check permission first
      if (item.permission && userPermissions.includes(item.permission)) {
          return true;
      }

      // Fallback to role check
      if (item.roles && item.roles.includes(userRole)) {
          return true;
      }

      // If no permission/roles required, allow all
      if (!item.permission && !item.roles) return true;

      return false;
    });
  }, [userRole, userPermissions]);

  const isActive = (href: string) => pathname === href;

  const sidebarWidth = collapsed ? 72 : 272; // px

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-dvh w-full bg-background text-foreground">
        <div className="flex min-h-dvh">
          {/* Desktop Sidebar */}
          <aside
            className="hidden border-r lg:flex lg:flex-col lg:shrink-0 bg-card"
            style={{ width: sidebarWidth }}
          >
            <div className="flex h-16 items-center justify-between px-4">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-primary/10 grid place-items-center">
                  <LayoutDashboard className="size-4 text-primary" />
                </div>
                {!collapsed && (
                  <span className="text-base font-semibold tracking-tight">
                    Admin
                  </span>
                )}
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex"
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
              </Button>
            </div>
            <Separator />
            <ScrollArea className="flex-1">
              <nav className="py-3">
                <ul className="grid gap-1 px-2">
                  {allowedNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        {collapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={item.href}
                                className={cn(
                                  "group inline-flex size-10 items-center justify-center rounded-xl transition-colors",
                                  active
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted"
                                )}
                              >
                                <Icon className="size-5" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="px-2 py-1 text-xs">
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Link
                            href={item.href}
                            className={cn(
                              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                              active
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            )}
                          >
                            <Icon className={cn("size-5", active ? "opacity-100" : "opacity-80")} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </ScrollArea>
            <Separator />

          </aside>

          {/* Mobile Sidebar (Sheet) */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="px-4 py-4">
                <SheetTitle className="flex items-center gap-2">
                  <div className="size-8 rounded-xl bg-primary/10 grid place-items-center">
                    <LayoutDashboard className="size-4 text-primary" />
                  </div>
                  Admin
                </SheetTitle>
              </SheetHeader>
              <Separator />
              <ScrollArea className="h-[calc(100dvh-4rem)]">
                <nav className="py-3">
                  <ul className="grid gap-1 px-2">
                    {allowedNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                              active
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            )}
                          >
                            <Icon className={cn("size-5", active ? "opacity-100" : "opacity-80")} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </ScrollArea>
            </SheetContent>

            {/* Main content column */}
            <div className="flex min-w-0 flex-1 flex-col">
              {/* Header */}
              <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background px-4">
                <div className="flex items-center gap-2 lg:hidden">
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Open navigation">
                      <Menu className="size-5" />
                    </Button>
                  </SheetTrigger>
                </div>

                {/* Search */}
                <div className="ml-0 flex-1 lg:ml-2">
                  <div className="relative max-w-xl">
                    <Input
                      placeholder="Search orders, products, customers..."
                      className="pl-3"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Theme toggle – replace with your own if you use a ThemeProvider */}
                  <ThemeToggle />

                  {/* User menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Avatar className="size-8">
                          <AvatarImage src="/avatars/admin.png" alt={session?.user?.name || "User"} />
                          <AvatarFallback>
                            {session?.user?.name ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {session?.user?.name || "User"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {session?.user?.email || "user@example.com"}
                          </span>
                          {session?.user?.role && (
                            <span className="text-xs text-muted-foreground">
                              Role: {(session.user as any).role}
                            </span>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/settings">Settings</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="cursor-pointer"
                      >
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </header>

              {/* Content */}
              <main className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-[1400px] px-4 py-6">
                  {children}
                </div>
              </main>

              {/* Footer */}
              <footer className="border-t bg-background">
                <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-4 text-xs text-muted-foreground">
                  <span suppressHydrationWarning>© {new Date().getFullYear()} Italian Shoes — Admin</span>
                  <span>
                    <Link href="/health" className="hover:underline">
                      System Health
                    </Link>{" "}
                    ·{" "}
                    <Link href="/logs" className="hover:underline">
                      Logs
                    </Link>
                  </span>
                </div>
              </footer>
            </div>
          </Sheet>
        </div>
      </div>
    </TooltipProvider>
  );
}

/* =====================================================================================
   Mini Theme Toggle (no dependency on external provider)
   - If you already use next-themes / ThemeProvider, replace this with your component.
===================================================================================== */
function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const [isDark, setIsDark] = useState<boolean>(false);

  React.useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Flip the 'dark' class on <html>
  const toggle = () => {
    const el = document.documentElement;
    const next = !isDark;
    el.classList.toggle("dark", next);
    setIsDark(next);
    // optional: persist to localStorage
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch { }
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="h-8 opacity-0">
        Theme
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} className="h-8">
      {isDark ? "Light" : "Dark"}
    </Button>
  );
}

/* =====================================================================================
   Fallback `cn` helper (remove if you already have one in "@/lib/utils")
===================================================================================== */
// If "@/lib/utils" doesn't export `cn`, uncomment this and delete the import.
// function cn(...classes: (string | false | null | undefined)[]) {
//   return classes.filter(Boolean).join(" ");
// }
