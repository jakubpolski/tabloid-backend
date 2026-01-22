import express, { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/user';

const router = express.Router();

const redirectUrl = process.env.GOOGLE_REDIRECT_URL || 'http://localhost:3000/oauth';
const frontendRedirect = process.env.FRONTEND_REDIRECT_URL || 'http://localhost:5173';

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

        const user = await User.findOneAndUpdate(
            { googleId: payload.sub },
            {
                name: payload.name,
                email: payload.email,
                picture: payload.picture || '',
                role: 'user',
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        const token = jwt.sign(
            { userId: user._id.toString(), email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.redirect(frontendRedirect);
    } catch {
        return res.status(500).json({ message: 'Login failed' });
    }
});

export default router;