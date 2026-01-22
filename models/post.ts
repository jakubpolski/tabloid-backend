import mongoose, { Schema, Document } from 'mongoose';

interface IPost extends Document {
    title: string;
    content: string;
    author: string;
    createdAt: Date;
    updatedAt: Date;
}

const postSchema: Schema<IPost> = new Schema<IPost>({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        ref: 'users',
        required: true,
    },
}, {
    timestamps: true,
});

const Post = mongoose.model<IPost>('posts', postSchema);

export default Post;