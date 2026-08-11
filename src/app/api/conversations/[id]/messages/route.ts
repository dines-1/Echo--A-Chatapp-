import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import dbConnect from "@/src/lib/db";
import Message from "@/src/models/Message";
import Conversation from "@/src/models/Conversation";

/**
 * GET /api/conversations/[id]/messages
 *
 * Fetch messages for a conversation (paginated, cursor-based).
 * Query params:
 *   - before=<messageId>   → fetch messages older than this ID (cursor)
 *   - limit=30             → items per page (default 30, max 50)
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await context.params;

    await dbConnect();

    // Verify user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: session.user.id,
    }).lean();

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const before = searchParams.get("before");
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "30", 10))
    );

    const filter: Record<string, unknown> = {
      conversation: conversationId,
    };

    if (before) {
      filter._id = { $lt: before };
    }

    const messages = await Message.find(filter)
      .populate("sender", "fullname username avatar")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Reverse so oldest is first (chronological order)
    messages.reverse();

    const hasMore = messages.length === limit;

    return NextResponse.json({ messages, hasMore });
  } catch (error) {
    console.error("GET /api/conversations/[id]/messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
