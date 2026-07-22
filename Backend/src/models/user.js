const mongoose = require('mongoose');
const {Schema} = mongoose;

const userSchema = new Schema({
    // treated as username
    firstName:{
        type:String,
        required:true,
        minLength:3,
        maxLength:20
    },
    // full name
    lastName:{
        type:String,
        minLength:3,
        maxLength:20
    },
    emailId:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        immutable:true
    },
    age:{
        type:Number,
        min:6,
        max:80
    },
    role:{
        type:String,
        enum:['user','admin'],
        default:'user'
    },
    problemSolved:{
        type:[{
            type:Schema.Types.ObjectId,
            ref:'problem'
        }]
    },
    password:{
        type:String,
        required:true
    },
    //added these feature
    summary:{
        type:String
    },
    avatarUrl:{
        type:String,
        default:''
    },
    isVerified:{
        type:Boolean,
        default:false
    }

},{
    timestamps:true
});

// Deduplicate problemSolved array before saving
userSchema.pre('save', function(){
    if(this.isModified('problemSolved')){
        const seen = new Set();
        this.problemSolved = this.problemSolved.filter(id => {
            const str = id.toString();
            if(seen.has(str)) return false;
            seen.add(str);
            return true;
        });
    }
});

//this will always run after this await User.findByIdAndDelete(userId);
userSchema.post('findOneAndDelete',async function(userInfo){
    if(userInfo){
        await mongoose.model('submission').deleteMany({userId: userInfo._id});
    }
});


const User = mongoose.model("user",userSchema);

module.exports = User;