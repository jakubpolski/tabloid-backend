import mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
    name: string;
    email: string;
    googleId: string;
    picture: string;
    role: 'user' | 'admin';
}


const userSchema: Schema<IUser> = new Schema<IUser>({
    name: {
        type: String,
        required: true,
        description: 'must be a string and is required',
    },
    email: {
        type: String,
        required: true,
        description: 'must be a string and is required',
    },
    googleId: {
        type: String,
        required: true,
        description: 'must be a string and is required',
    },
    picture: {
        type: String,
        required: true,
        description: 'must be a string and is required',
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        required: true,
        default: 'user',
        description: 'must be a string of \'user\' or \'admin\' and is required',
    },
});

const User = mongoose.model<IUser>('users', userSchema);

export default User;