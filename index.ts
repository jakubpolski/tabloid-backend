import express, {Request, Response} from 'express'
import { OAuth2Client } from 'google-auth-library';

import 'dotenv/config'

import connectDB from './config/db';
import cors from 'cors'

import oAuthRouter from './routes/oauth';
import userRouter from './routes/user';
import postRouter from './routes/post';

import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';

const app = express();
const port = process.env.PORT || 3000;
const frontendUrl = process.env.FRONTEND_REDIRECT_URL || "http://localhost:5173";
const googleRedirectUrl = process.env.GOOGLE_REDIRECT_URL || "http://localhost:3000/oauth";


connectDB();

const corsOptions = {
  origin: frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

app.use(cors(corsOptions));
app.use(express.json())


app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Tabloid API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

const buildAuthUrl = () => {
    const oAuth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        googleRedirectUrl
    );
    return oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        prompt: 'consent',
    });
};


/**
 * @openapi
 * /login:
 *   get:
 *     summary: Get Google OAuth login URL
 *     description: Returns the Google OAuth authentication URL for user login. After successful authentication, the user will be redirected back with a JWT token in the URL hash.
 *     tags:
 *       - Authentication
 *     security: []
 *     responses:
 *       200:
 *         description: Google OAuth URL returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: Google OAuth authentication URL
 *                   example: https://accounts.google.com/o/oauth2/v2/auth?...
 */
app.get("/login", (_req: Request, res: Response) => {
    res.header("Access-Control-Allow-Origin", frontendUrl);
    res.header("Referer-Policy", "no-referrer-when-downgrade");
    res.json({ url: buildAuthUrl() });
});

/**
 * @openapi
 * /:
 *   post:
 *     summary: Get Google OAuth login URL (POST)
 *     description: Returns the Google OAuth authentication URL for user login via POST. After successful authentication, the user will be redirected back with a JWT token in the URL hash.
 *     tags:
 *       - Authentication
 *     security: []
 *     responses:
 *       200:
 *         description: Google OAuth URL returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: Google OAuth authentication URL
 *                   example: https://accounts.google.com/o/oauth2/v2/auth?...
 */
app.post("/", (req: Request, res: Response) => {
    res.header("Access-Control-Allow-Origin", frontendUrl);
    res.header("Referer-Policy", "no-referrer-when-downgrade");
    res.json({ url: buildAuthUrl() });
})

app.use("/oauth", oAuthRouter);
app.use("/user", userRouter);
app.use("/", postRouter);

/**
 * @openapi
 * /:
 *   get:
 *     summary: API health check
 *     description: Check if the API is working
 *     tags:
 *       - Health
 *     security: []
 *     responses:
 *       200:
 *         description: API is working
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: API is working.
 */
app.get("/", (req: Request, res: Response) => {
    res.send("API is working, documentation available at /api.");
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

export default app