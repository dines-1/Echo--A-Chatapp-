import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import dbConnect from "@/src/lib/db";
import Conversation from "@/src/models/Conversation";
import Notification from "@/src/models/Notification";

/**
 * GET /api/conversations
 *
 * Fetch all conversations the current user participates in,
 * sorted by most recently updated (latest message first).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const conversations = await Conversation.find({
      participants: session.user.id,
    })
      .populate("participants", "fullname username avatar IsOnline lastseen")
      .populate("admin", "fullname username")
      .populate({
        path: "lastMessage",
        select: "content sender status createdAt",
        populate: { path: "sender", select: "username" },
      })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("GET /api/conversations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations
 *
 * Create a new conversation.
 *
 * Body for 1-on-1:
 *   { participantId: string }
 *
 * Body for group:
 *   { participantIds: string[], groupName: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await dbConnect();

    const currentUserId = session.user.id;

    // ── 1-on-1 conversation ──────────────────────────────────────────
    if (body.participantId) {
      const partnerId = body.participantId;

      if (partnerId === currentUserId) {
        return NextResponse.json(
          { error: "Cannot create a conversation with yourself" },
          { status: 400 }
        );
      }

      // Check if a 1-on-1 conversation already exists
      const existing = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [currentUserId, partnerId], $size: 2 },
      })
        .populate("participants", "fullname username avatar IsOnline lastseen")
        .populate({
          path: "lastMessage",
          select: "content sender status createdAt",
          populate: { path: "sender", select: "username" },
        })
        .lean();

      if (existing) {
        return NextResponse.json({ conversation: existing, isNew: false });
      }

      const conversation = await Conversation.create({
        isGroup: false,
        participants: [currentUserId, partnerId],
      });

      const populated = await Conversation.findById(conversation._id)
        .populate("participants", "fullname username avatar IsOnline lastseen")
        .lean();

      // Notify the other user via Socket.IO if available
      const io = (globalThis as any).__socketIO;
      if (io) {
        io.to(`user:${partnerId}`).emit("conversation:created", populated);
      }

      return NextResponse.json(
        { conversation: populated, isNew: true },
        { status: 201 }
      );
    }

    // ── Group conversation ───────────────────────────────────────────
    if (body.participantIds && Array.isArray(body.participantIds)) {
      const participantIds = [
        ...new Set([currentUserId, ...body.participantIds]),
      ];

      if (participantIds.length < 3) {
        return NextResponse.json(
          { error: "A group needs at least 3 participants" },
          { status: 400 }
        );
      }

      const conversation = await Conversation.create({
        isGroup: true,
        groupName: body.groupName || "New Group",
        participants: participantIds,
        admin: currentUserId,
      });

      const populated = await Conversation.findById(conversation._id)
        .populate("participants", "fullname username avatar IsOnline lastseen")
        .populate("admin", "fullname username")
        .lean();

      // Notify participants and create group_invite notifications
      const io = (globalThis as any).__socketIO;
      for (const pid of participantIds) {
        if (pid !== currentUserId) {
          if (io) {
            io.to(`user:${pid}`).emit("conversation:created", populated);
          }

          // Create group invite notification
          const notification = await Notification.create({
            recipient: pid,
            sender: currentUserId,
            type: "group_invite",
            title: `You were added to "${body.groupName || "New Group"}"`,
            body: `${session.user.username} added you to a group conversation.`,
            reference: conversation._id,
            referenceModel: "Conversation",
          });

          if (io) {
            const populatedNotif = await Notification.findById(
              notification._id
            )
              .populate("sender", "fullname username avatar")
              .lean();
            io.to(`user:${pid}`).emit("notification:new", populatedNotif);
          }
        }
      }

      return NextResponse.json(
        { conversation: populated, isNew: true },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: "Provide participantId or participantIds" },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST /api/conversations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
