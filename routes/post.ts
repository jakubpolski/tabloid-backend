import express, { Request, Response } from 'express';
import Post from '../models/post';
import { authenticate, requireAdmin } from '../middleware/auth';
import User from '../models/user';

const router = express.Router();

router.get('/posts', authenticate, async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const posts = await Post.find()
            .populate('author', 'name picture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        

        const postsWithAuthors = await Promise.all(
            posts.map(async (post) => {
                const author = await User.findOne({ googleId: post.author });
                const postObj = post.toObject();
                return {
                    _id: postObj._id,
                    title: postObj.title,
                    content: postObj.content,
                    createdAt: postObj.createdAt,
                    updatedAt: postObj.updatedAt,
                    author: {
                        googleId: author?.googleId,
                        name: author?.name,
                        picture: author?.picture
                    }
                };
            })
        );

        const total = await Post.countDocuments();

        res.json({ 
            posts: postsWithAuthors, 
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalPosts: total 
        });
    } catch (error) {
        res.status(500).json({ message:`Server error: ${error}` });
    }
});

router.get('/post', authenticate, async (req: Request, res: Response) => {
    try {
        const postId = req.query.id as string;
        
        if (!postId) {
            return res.status(400).json({ message: 'Post ID is required' });
        }

        const post = await Post.findById(postId);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Manually populate author data using googleId
        const author = await User.findOne({ googleId: post.author });
        const postObj = post.toObject();
        const postWithAuthor = {
            _id: postObj._id,
            title: postObj.title,
            content: postObj.content,
            createdAt: postObj.createdAt,
            updatedAt: postObj.updatedAt,
            author: {
                googleId: author?.googleId,
                name: author?.name,
                picture: author?.picture
            }
        };

        res.json({ post: postWithAuthor });
    } catch (error) {
        res.status(500).json({ message:`Server error: ${error}` });
    }
});

router.post('/post', authenticate, async (req: Request, res: Response) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const post = new Post({
            title,
            content,
            author: req.user!.userId,
        });

        await post.save();
        res.status(201).json({ message: 'Post created successfully', post });
    } catch (error) {
        res.status(500).json({ message:`Server error: ${error}` });
    }
});

router.put('/post', authenticate, async (req: Request, res: Response) => {
    try {
        const postId = req.query.id as string;
        const { title, content } = req.body;

        if (!postId) {
            return res.status(400).json({ message: 'Post ID is required' });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== req.user!.userId && req.user!.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to edit this post' });
        }

        if (title) post.title = title;
        if (content) post.content = content;

        await post.save();
        res.json({ message: 'Post updated successfully', post });
    } catch (error) {
        res.status(500).json({ message:`Server error: ${error}` });
    }
});

router.delete('/post', authenticate, async (req: Request, res: Response) => {
    try {
        const postId = req.query.id as string;

        if (!postId) {
            return res.status(400).json({ message: 'Post ID is required' });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== req.user!.userId && req.user!.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        await Post.findByIdAndDelete(postId);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message:`Server error: ${error}` });
    }
});

export default router;
