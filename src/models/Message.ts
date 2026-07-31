import mongoose ,{Document,Schema} from 'mongoose';
import {IUser} from './User'
import { IConversation } from './Conversation';

export interface IMessage extends Document {
  conversation : mongoose.Types.ObjectId | IConversation;
  sender: mongoose.Types.ObjectId | IUser;
  content: string;
  seenBy: mongoose.Types.ObjectId[] | IUser[];
  status: "sent" | "delivered" | "seen";
  createdAt: Date;
  updatedAt: Date;
}
const MessageSchema = new Schema<IMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    seenBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
  },
  { timestamps: true }
);
MessageSchema.index({conversation:1,createdAt:-1});

const Message = (mongoose.models.Message as mongoose.Model<IMessage>) || mongoose.model<IMessage> ('Message',MessageSchema);
export default Message;