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
    password:{
        type :String,
        required:[true,'Please enter the password'],
        trim:true,
        select :false,
    },
    avatar:{
        type:String,
        default:''
    },
    IsOnline :{
        type:Boolean,
        default : false
    },
    lastseen :{
        type:Date,Default:Date.now
    },
},
    {timestamps:true}
    
);
const User = (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser> ('User',UserSchema);
export default User;