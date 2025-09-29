import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // In a JWT-based session, the client needs to handle the logout
    // by clearing the session token. This endpoint can be used for
    // server-side cleanup if needed.
    
    return NextResponse.json({ 
      message: "Logout successful",
      redirectTo: "/login"
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
