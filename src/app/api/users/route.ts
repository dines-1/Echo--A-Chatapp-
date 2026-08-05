import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import dbConnect from "@/src/lib/db";
import User from "@/src/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Find all users with role 'customer' excluding the current user
    const users = await User.find({
      _id: { $ne: session.user.id },
      role: "customer",
    })
      .select("fullname username email avatar isVerified IsOnline lastseen")
      .lean();

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
