import express, { Request, Response } from 'express';
import User from '../models/user';
import Post from '../models/post';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * @openapi
 * /user/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile information. Requires JWT token in Authorization header.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               noToken:
 *                 value:
 *                   message: Authentication required
 *               invalidToken:
 *                 value:
 *                   message: Invalid token
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @openapi
 * /user:
 *   get:
 *     summary: Get user by ID
 *     description: Returns a user's public profile and their posts. Requires authentication.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User's Google ID
 *         example: '1234567890'
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: John Doe
 *                 picture:
 *                   type: string
 *                   example: https://example.com/avatar.jpg
 *                 role:
 *                   type: string
 *                   example: user
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: My Post Title
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: '2026-01-31T10:30:00Z'
 *       400:
 *         description: User ID is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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


/**
 * @openapi
 * /user:
 *   delete:
 *     summary: Delete user (Admin only)
 *     description: Deletes a user and all their posts. Requires admin role and JWT token in Authorization header.
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User's Google ID to delete
 *         example: '1234567890'
 *     responses:
 *       200:
 *         description: User and all posts deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User and all posts deleted successfully
 *       400:
 *         description: User ID is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Admin access required
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
