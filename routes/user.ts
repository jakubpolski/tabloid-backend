import express, { Request, Response } from 'express';
import User from '../models/user';
import Post from '../models/post';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/me', authenticate, async (req: Request, res: Response) => {
    try {
        const googleId = req.user?.userId as string;
        
        const user = await User.findOne({ googleId });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ 
            googleId: user.googleId,
            name: user.name, 
            email: user.email,
            picture: user.picture,
            role: user.role 
        });
    } catch (error) {
        res.status(500).json({ message:`Server error: ${error}` });
    }
});

router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.query.id as string;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await User.findOne({ googleId: userId });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const posts = await Post.find({ author: userId }).select('title createdAt');

        return res.json({ 
            user,
            posts
        });
    } catch (error) {
        res.status(500).json({ message:`Server error: ${error}` });
    }
});

router.delete('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const userId = req.query.id as string;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        await Post.deleteMany({ author: userId });
        const user = await User.findOneAndDelete({ googleId: userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User and all posts deleted successfully' });
    } catch (error) {
        res.status(500).json({ message:`Server error: ${error}` });
    }
});

export default router;
