import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import dbConnect from "@/src/lib/db";
import Notification from "@/src/models/Notification";

/**
 * GET /api/notifications
 *
 * Fetch the current user's notifications.
 * Query params:
 *   - unreadOnly=true  → only unread notifications
 *   - page=1           → page number (default 1)
 *   - limit=20         → items per page (default 20)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const skip = (page - 1) * limit;

    await dbConnect();

    const filter: Record<string, unknown> = {
      recipient: session.user.id,
    };
    if (unreadOnly) {
      filter.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate("sender", "fullname username avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return NextResponse.json({
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 *
 * Mark notifications as read.
 * Body:
 *   { notificationIds: string[] }   → mark specific notifications
 *   OR
 *   { markAllRead: true }           → mark ALL as read
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await dbConnect();

    const now = new Date();

    if (body.markAllRead) {
      await Notification.updateMany(
        { recipient: session.user.id, isRead: false },
        { isRead: true, readAt: now }
      );
      return NextResponse.json({ message: "All notifications marked as read" });
    }

    if (body.notificationIds && Array.isArray(body.notificationIds)) {
      await Notification.updateMany(
        {
          _id: { $in: body.notificationIds },
          recipient: session.user.id,
        },
        { isRead: true, readAt: now }
      );
      return NextResponse.json({ message: "Notifications marked as read" });
    }

    return NextResponse.json(
      { error: "Provide notificationIds or markAllRead" },
      { status: 400 }
    );
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
