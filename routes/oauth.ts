import express, { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/user';

const router = express.Router();

const redirectUrl = process.env.GOOGLE_REDIRECT_URL || 'http://localhost:3000/oauth';
const frontendRedirect = process.env.FRONTEND_REDIRECT_URL || 'http://localhost:5173';

/**
 * @openapi
 * /oauth:
 *   get:
 *     summary: Google OAuth callback
 *     description: |
 *       Handles Google OAuth callback, creates/updates user, and redirects to frontend with JWT token in URL hash.
 *       The frontend should extract the token from the URL hash and store it in sessionStorage.
 *       
 *       **Authentication Flow:**
 *       1. User clicks login and is redirected to Google
 *       2. After Google authentication, user is redirected to this endpoint with a code
 *       3. This endpoint exchanges the code for user info and creates a JWT
 *       4. User is redirected to frontend with token: `{frontendUrl}#token={jwt}`
 *       5. Frontend extracts token and stores in sessionStorage
 *       6. Frontend sends token in Authorization header: `Bearer {token}`
 *     tags:
 *       - Authentication
 *     security: []
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Google OAuth authorization code
 *     responses:
 *       302:
 *         description: Redirects to frontend with JWT token in URL hash (#token=...)
 *       400:
 *         description: Missing code or invalid Google profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingCode:
 *                 value:
 *                   message: Missing code
 *               noToken:
 *                 value:
 *                   message: No id_token returned
 *               incompleteProfile:
 *                 value:
 *                   message: Incomplete Google profile missing sub/email/name
 *       500:
 *         description: Login failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const code = req.query.code as string;
        if (!code) return res.status(400).json({ message: 'Missing code' });

        const client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            redirectUrl
        );

        const { tokens } = await client.getToken(code);
        if (!tokens.id_token) return res.status(400).json({ message: 'No id_token returned' });

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload?.sub || !payload.email || !payload.name) {
            return res.status(400).json({ message: 'Incomplete Google profile: missing sub/email/name' });
        }

        // Check if user already exists
        let user = await User.findOne({ googleId: payload.sub });

        if (user) {
            // User exists - update only name, email, picture
            user.name = payload.name;
            user.email = payload.email;
            user.picture = payload.picture || '';
            await user.save();
        } else {
            // New user - create with default role 'user'
            user = await User.create({
                googleId: payload.sub,
                name: payload.name,
                email: payload.email,
                picture: payload.picture || '',
                role: 'user',
            });
        }

        const token = jwt.sign(
            { userId: user.googleId, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        return res.redirect(`${frontendRedirect}#token=${token}`);
    } catch (err) {
        return res.status(500).json({ message: `Login failed ${err}` });
    }
});


export default router;