import express from "express";
import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const onlineUsers = new Map<string, Set<string>>();

app.prepare().then(async () => {
  const expressApp = express();
  const httpServer = createServer(expressApp);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SOCKET_URL || `http://${hostname}:${port}`,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  (globalThis as any).__socketIO = io;
  (globalThis as any).__onlineUsers = onlineUsers;

  io.on("connection", (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    socket.on("user:online", (userId: string) => {
      if (!userId) return;

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId)!.add(socket.id);

      socket.join(`user:${userId}`);

      (socket as any).userId = userId;

      socket.broadcast.emit("user:status", { userId, isOnline: true });

      console.log(` User online: ${userId} (${onlineUsers.get(userId)!.size} connections)`);
    });

    socket.on(
      "message:send",
      async (data: {
        conversationId: string;
        senderId: string;
        senderName: string;
        content: string;
      }) => {
        try {
          const Message = (await import("./src/models/Message")).default;
          const Conversation = (await import("./src/models/Conversation"))
            .default;
          const Notification = (await import("./src/models/Notification"))
            .default;

          const dbConnect = (await import("./src/lib/db")).default;
          await dbConnect();

          const message = await Message.create({
            conversation: data.conversationId,
            sender: data.senderId,
            content: data.content,
          });

          await Conversation.findByIdAndUpdate(data.conversationId, {
            lastMessage: message._id,
          });

          const conversation = await Conversation.findById(
            data.conversationId
          ).lean();
          if (!conversation) return;

          const participants = (conversation.participants as any[]).map(
            (p: any) => p.toString()
          );

          const populatedMessage = await Message.findById(message._id)
            .populate("sender", "fullname username avatar")
            .lean();

          for (const participantId of participants) {
            io.to(`user:${participantId}`).emit("message:new", {
              conversationId: data.conversationId,
              message: populatedMessage,
            });

            if (participantId !== data.senderId) {
              const notification = await Notification.create({
                recipient: participantId,
                sender: data.senderId,
                type: "new_message",
                title: `New message from ${data.senderName}`,
                body:
                  data.content.length > 100
                    ? data.content.substring(0, 100) + "…"
                    : data.content,
                reference: message._id,
                referenceModel: "Message",
              });

              const populatedNotification = await Notification.findById(
                notification._id
              )
                .populate("sender", "fullname username avatar")
                .lean();

              io.to(`user:${participantId}`).emit(
                "notification:new",
                populatedNotification
              );
            }
          }
        } catch (error) {
          console.error("message:send error:", error);
          socket.emit("message:error", {
            error: "Failed to send message",
          });
        }
      }
    );

    socket.on(
      "message:seen",
      async (data: { conversationId: string; userId: string }) => {
        try {
          const Message = (await import("./src/models/Message")).default;
          const dbConnect = (await import("./src/lib/db")).default;
          await dbConnect();

          await Message.updateMany(
            {
              conversation: data.conversationId,
              sender: { $ne: data.userId },
              seenBy: { $nin: [data.userId] },
            },
            {
              $addToSet: { seenBy: data.userId },
              $set: { status: "seen" },
            }
          );

          const Conversation = (
            await import("./src/models/Conversation")
          ).default;
          const conversation = await Conversation.findById(
            data.conversationId
          ).lean();
          if (!conversation) return;

          const participants = (conversation.participants as any[]).map(
            (p: any) => p.toString()
          );

          for (const participantId of participants) {
            if (participantId !== data.userId) {
              io.to(`user:${participantId}`).emit("message:seen", {
                conversationId: data.conversationId,
                seenBy: data.userId,
              });
            }
          }
        } catch (error) {
          console.error("message:seen error:", error);
        }
      }
    );

    socket.on(
      "typing:start",
      (data: {
        conversationId: string;
        userId: string;
        username: string;
      }) => {
        socket.broadcast.emit("typing:start", data);
      }
    );

    socket.on(
      "typing:stop",
      (data: { conversationId: string; userId: string }) => {
        socket.broadcast.emit("typing:stop", data);
      }
    );

    socket.on(
      "notification:read",
      async (data: { notificationId: string; userId: string }) => {
        try {
          const Notification = (
            await import("./src/models/Notification")
          ).default;
          const dbConnect = (await import("./src/lib/db")).default;
          await dbConnect();

          await Notification.findOneAndUpdate(
            { _id: data.notificationId, recipient: data.userId },
            { isRead: true, readAt: new Date() }
          );
        } catch (error) {
          console.error("notification:read error:", error);
        }
      }
    );

    socket.on("disconnect", () => {
      const userId = (socket as any).userId as string | undefined;
      if (userId) {
        const sockets = onlineUsers.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlineUsers.delete(userId);
            import("./src/models/User").then(({ default: User }) =>
              import("./src/lib/db").then(({ default: dbConnect }) =>
                dbConnect().then(() =>
                  User.findByIdAndUpdate(userId, {
                    IsOnline: false,
                    lastseen: new Date(),
                  }).catch(console.error)
                )
              )
            );
            socket.broadcast.emit("user:status", {
              userId,
              isOnline: false,
            });
            console.log(`👤 User offline: ${userId}`);
          }
        }
      }
      console.log(`⚡ Socket disconnected: ${socket.id}`);
    });
  });

  expressApp.use((req: any, res: any) => {
    return handle(req, res);
  });

  httpServer.listen(port, () => {
    console.log(`\n🚀 Server ready on http://${hostname}:${port}\n`);
  });
});
