import mongoose, { Document, Schema, Types } from "mongoose";
import { IUser } from "./User";

export type NotificationType =
  | "new_message"
  | "group_invite"
  | "role_change"
  | "system";

export interface INotification extends Document {
  recipient: Types.ObjectId | IUser;
  sender: Types.ObjectId | IUser | null;
  type: NotificationType;
  title: string;
  body: string;
  reference: Types.ObjectId | null;
  referenceModel: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: ["new_message", "group_invite", "role_change", "system"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    reference: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    referenceModel: {
      type: String,
      enum: ["Message", "Conversation", "User", null],
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Fast lookup: unread notifications for a user, sorted by newest
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification =
  (mongoose.models.Notification as mongoose.Model<INotification>) ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
