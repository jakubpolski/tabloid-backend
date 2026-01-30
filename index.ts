import express, {Request, Response} from 'express'
import cookieParser from 'cookie-parser'
import { OAuth2Client } from 'google-auth-library';

import 'dotenv/config'

import connectDB from './config/db';
import cors from 'cors'

import oAuthRouter from './routes/oauth';
import userRouter from './routes/user';
import postRouter from './routes/post';

const app = express();
const port = process.env.PORT || 3000;
const frontendUrl = process.env.FRONTEND_REDIRECT_URL || "http://localhost:5173";
const googleRedirectUrl = process.env.GOOGLE_REDIRECT_URL || "http://localhost:3000/oauth";


connectDB();


const corsOptions = {
  origin: frontendUrl,
  credentials: true,                   // Access-Control-Allow-Credentials: true
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json())

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

app.get("/login", (_req: Request, res: Response) => {
    res.header("Access-Control-Allow-Origin", frontendUrl);
    res.header("Referer-Policy", "no-referrer-when-downgrade");
    res.json({ url: buildAuthUrl() });
});

app.post("/", (req: Request, res: Response) => {
    res.header("Access-Control-Allow-Origin", frontendUrl);
    res.header("Referer-Policy", "no-referrer-when-downgrade");
    res.json({ url: buildAuthUrl() });
})

app.use("/oauth", oAuthRouter);
app.use("/user", userRouter);
app.use("/", postRouter);

app.get("/", (req: Request, res: Response) => {
    res.send("API is working.");
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

export default app