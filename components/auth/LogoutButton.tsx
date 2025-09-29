"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
  callbackUrl?: string;
}

export function LogoutButton({ 
  variant = "ghost", 
  size = "default", 
  className,
  children,
  callbackUrl = "/login"
}: LogoutButtonProps) {
  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
    >
      {children || (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </>
      )}
    </Button>
  );
}
