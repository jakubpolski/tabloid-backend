import { Request, Response } from "express"
import jwt from "jsonwebtoken"
import { AuthRequest } from "../middleware/authMiddleware"

const JWT_SECRET = process.env.JWT_SECRET!

export const loginUser = async (req: AuthRequest,  res: Response) => {
    const payload = req.payload;

    return res.json({
        message: "Login successful",
        payload: payload
    })
}