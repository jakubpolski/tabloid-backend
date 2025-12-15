import mongoose, { Schema, Document } from 'mongoose';

interface IPost extends Document {
    authorId: mongoose.Types.ObjectId;
    title: string;
    content: string;
    dateAdded: Date;
}


const postSchema: Schema<IPost> = new Schema<IPost>({
    authorId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        description: 'must be an ObjectId and is required',
    },
    title: {
        type: String,
        required: true,
        description: 'must be a string and is required',
    },
    content: {
        type: String,
        required: true,
        description: 'must be a string and is required',
    },
    dateAdded: {
        type: Date,
        default: Date.now,
        required: true,
        description: 'must be a date and is required',
    },
});

const Post = mongoose.model<IPost>('posts', postSchema);

export default Post;