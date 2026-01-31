import express, { Request, Response } from 'express';
import Post from '../models/post';
import { authenticate, requireAdmin } from '../middleware/auth';
import User from '../models/user';

const router = express.Router();

/**
 * @openapi
 * /posts:
 *   get:
 *     summary: Get paginated posts
 *     description: Returns a paginated list of posts with author information. Requires JWT token in Authorization header.
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 totalPosts:
 *                   type: integer
 *                   example: 42
 *       401:
 *         description: Authentication required or invalid token
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
                    author
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


/**
 * @openapi
 * /post:
 *   get:
 *     summary: Get a single post by ID
 *     description: Returns detailed information about a specific post. Requires JWT token in Authorization header.
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID (MongoDB ObjectId)
 *         example: '507f1f77bcf86cd799439011'
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Post ID is required
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
 *         description: Post not found
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
            author
        };

        res.json({ post: postWithAuthor });
    } catch (error) {
        res.status(500).json({ message:`Server error: ${error}` });
    }
});

/**
 * @openapi
 * /post:
 *   post:
 *     summary: Create a new post
 *     description: Creates a new post with title and content. Requires JWT token in Authorization header. The author is automatically set from the authenticated user.
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Post title
 *                 example: My New Post
 *               content:
 *                 type: string
 *                 description: Post content
 *                 example: This is the content of my new post...
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post created successfully
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Title and content are required
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @openapi
 * /post:
 *   put:
 *     summary: Update a post
 *     description: Updates an existing post's title and/or content. Only the post author or admin can update. Requires JWT token in Authorization header.
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID to update (MongoDB ObjectId)
 *         example: '507f1f77bcf86cd799439011'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: New post title (optional)
 *                 example: Updated Post Title
 *               content:
 *                 type: string
 *                 description: New post content (optional)
 *                 example: This is the updated content...
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post updated successfully
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Post ID is required
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
 *         description: Not authorized to edit this post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Post not found
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

/**
 * @openapi
 * /post:
 *   delete:
 *     summary: Delete a post
 *     description: Deletes a post. Only the post author or admin can delete. Requires JWT token in Authorization header.
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID to delete (MongoDB ObjectId)
 *         example: '507f1f77bcf86cd799439011'
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post deleted successfully
 *       400:
 *         description: Post ID is required
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
 *         description: Not authorized to delete this post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Post not found
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
