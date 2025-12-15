import express, { Router } from "express";
import { loginUser } from "../controllers/userController";
import { verifyJwt } from "../middleware/authMiddleware";


const router: Router = express.Router(); 

router.post("/login", verifyJwt, loginUser)

export default router;