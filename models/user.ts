import mongoose, { Schema, Document } from 'mongoose';

interface IUser extends Document {
    googleId: string;
    name: string;
    email: string;
    picture: string;
    role: 'user' | 'admin';
}

const userSchema: Schema<IUser> = new Schema<IUser>({
    googleId: {
        type: String,
        required: true,
        unique: true,
        description: 'Google ID used as reference key',
    },
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
    picture: {
        type: String,
        required: false,
        description: 'must be a string',
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