"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserProfileProps {
  showRole?: boolean;
  className?: string;
}

export function UserProfile({ showRole = true, className }: UserProfileProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initials = user.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src="/avatars/admin.png" alt={user.name || "User"} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{user.name || "User"}</span>
        <span className="text-xs text-muted-foreground">{user.email}</span>
        {showRole && (user as any).role && (
          <Badge variant="secondary" className="w-fit text-xs">
            {(user as any).role}
          </Badge>
        )}
      </div>
    </div>
  );
}
