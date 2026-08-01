import mongoose,{Document,Schema} from "mongoose" ;

type UserRole = 'admin' | 'customer' ;

export interface IUser extends Document{
    fullname : string;
    username : string;
    email:string;
    phone:string;
    password:string;
    avatar:string;
    role : UserRole;
    IsOnline : boolean;
    lastseen: Date;
    isVerified:boolean;
    createdaAt : Date;
    updatedAt: Date;
}

const UserSchema = new Schema <IUser>(
{
     fullname:{
        type: String,
        required:[true,'Please enter the Full name'],
        trim : true,
     },
    username:{
        type: String,
        required:[true,'Please enter the username'],
        unique : true,
        trim : true,
        minlength: 3,
        maxlength : 12
    },
    email: {
        type: String,
        required:[true,'Please enter the email'],
        unique : true,
        trim : true,
        match: [ /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,"Please use a valid email"],
        lowercase :true
    },
    phone : {
        type:String,
        trim:true,
        match:[/^(\+\d{1,4})?\d{7,15}$/,'Please enter a valid number']
    },
    password:{
        type :String,
        required:[true,'Please enter the password'],
        trim:true,
        match: [/^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/,"Password must be at least 8 characters and contain at least one number and one special character."],
        select :false,
    },
    avatar:{
        type:String,
        default:''
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    IsOnline :{
        type:Boolean,
        default : false
    },
    role: {
  type: String,
  enum: ["admin", "customer"],
  default: "customer",
},
lastseen: {
  type: Date,
  default: Date.now,   
},
},
    {timestamps:true}
    
);
const User = (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser> ('User',UserSchema);
export default User;