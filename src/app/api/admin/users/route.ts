import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import dbConnect from "@/src/lib/db";
import User from "@/src/models/User";

// GET all users (Admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin authorization required." }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { fullname: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin fetch users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// PATCH update user role or status (Admin only)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin authorization required." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role, isVerified } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await dbConnect();

    const updateData: Record<string, unknown> = {};
    if (role && ["admin", "customer"].includes(role)) {
      updateData.role = role;
    }
    if (typeof isVerified === "boolean") {
      updateData.isVerified = isVerified;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true })
      .select("-password")
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE user account (Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin authorization required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
    }

    await dbConnect();

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
