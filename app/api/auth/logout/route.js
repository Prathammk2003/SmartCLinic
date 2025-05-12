import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    console.log("Logging user out...");
    
    // Clear the token cookie
    const cookieStore = await cookies();
    cookieStore.delete("token");
    
    console.log("Token cookie deleted");
    
    return NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    
    return NextResponse.json(
      { success: false, message: "Failed to logout", error: error.message },
      { status: 500 }
    );
  }
} 