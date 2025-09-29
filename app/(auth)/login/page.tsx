"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const search = useSearchParams();
  const router = useRouter();

  const callbackUrl = search.get("callbackUrl");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const p = signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    toast.promise(p, { loading: "Signing in…", success: "Welcome back!", error: "Invalid credentials" });
    const res = await p;
    setLoading(false);

    if (res?.ok) router.push(callbackUrl || "/dashboard");
    else toast.error(res?.error || "Sign-in failed");
  };


  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-md rounded-2xl">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your admin or staff account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Need an account? Ask an admin to invite you.
          </div>
          <div className="mt-2 text-center">
            <Link className="text-sm underline" href="/">Back to site</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
