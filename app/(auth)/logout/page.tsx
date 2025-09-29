"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically sign out when the page loads
    const handleLogout = async () => {
      try {
        await signOut({ 
          redirect: false,
          callbackUrl: "/login"
        });
        // Redirect to login page after successful logout
        router.push("/login");
      } catch (error) {
        console.error("Logout error:", error);
        // Even if there's an error, redirect to login
        router.push("/login");
      }
    };

    handleLogout();
  }, [router]);

  const handleManualLogout = async () => {
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: "/login"
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Signing out...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            You are being signed out. Please wait a moment.
          </p>
          <Button 
            onClick={handleManualLogout}
            variant="outline" 
            className="w-full"
          >
            Sign out manually
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
