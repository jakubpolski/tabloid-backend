import express, {Request, Response} from 'express'
import passport from "passport";
import jwt from 'jsonwebtoken'

import 'dotenv/config'

import connectDB from './config/db';
import cors from 'cors'

const app = express();
const port = process.env.PORT || 9000;

import userRoutes from "./routes/userRoutes"

connectDB();

app.use(cors());
app.use(express.json())
app.use('/user', userRoutes)

app.get("/", (req: Request, res: Response) => {
    res.send("API is working");
})


app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET);
    res.json({ user: req.user, token });
  }
);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

export default app