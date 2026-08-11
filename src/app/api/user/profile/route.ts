import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import dbConnect from "@/src/lib/db";
import User from "@/src/models/User";
import { updateProfileSchema } from "@/src/schemas/authSchema";

/**
 * GET /api/user/profile
 * Returns the currently authenticated user's full profile & preferences.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id)
      .select("-password")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Updates the currently authenticated user's profile details & preferences.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fullname, phone, avatar, bio, preferences } = result.data;

    await dbConnect();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          fullname,
          phone: phone || "",
          avatar: avatar || "",
          bio: bio || "",
          ...(preferences ? { preferences } : {}),
        },
      },
      { new: true, runValidators: true }
    )
      .select("-password")
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("PATCH /api/user/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
