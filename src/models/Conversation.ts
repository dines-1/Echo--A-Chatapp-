import mongoose ,{Types,Document,Schema} from 'mongoose';
import {IUser} from './User'
import {IMessage} from './Message'



export interface IConversation extends Document {
  isGroup: boolean;
  groupName: string | null;
  participants: Types.ObjectId[] | IUser[];
  admin: Types.ObjectId | IUser | null;
  lastMessage: Types.ObjectId | IMessage | null;
  createdAt: Date;
  updatedAt: Date;
}
const ConversationSchema = new Schema <IConversation>(
    {
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      default: null,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

const Conversation = (mongoose.models.Converstion as mongoose.Model<IConversation>) || mongoose.model<IConversation> ('Conversation',ConversationSchema);
export default Conversation;