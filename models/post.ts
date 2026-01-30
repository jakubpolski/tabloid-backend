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
        description: "Must be a string and is required"
    },
    content: {
        type: String,
        required: true,
        description: "Must be a string and is required"
    },
    author: {
        type: String,
        required: true,
        description: "References to a Google ID"
    },
}, {
    autoCreate: true,
    autoIndex: true,
    timestamps: true,
});

const Post = mongoose.model<IPost>('posts', postSchema);

export default Post;