import express from "express"
import { SignUp,SignOut,SignIn,GetMe,UpdateMe } from "../controllers/AuthControllers.js"
import { middleware } from "../middleware/middleware.js";
const router=express.Router()

router.post("/signup",SignUp);
router.post("/signin",SignIn);
router.get("/me",middleware,GetMe);
router.patch("/updateMe",UpdateMe);
router.get("/signout",SignOut);

export default router;