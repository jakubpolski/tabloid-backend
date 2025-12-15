import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthRequest extends Request {
    payload: any;
}

export const verifyJwt = (req: AuthRequest, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;

    if (!auth) {
        return res.status(401).json({ message: "Missing Authorization header" });
    }

    const token = auth.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Invalid Authorization header" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET)
        req.payload = payload
        next()
    } catch (err) {
        return res.status(401).json({ message: "Invalid token"})
    }
}