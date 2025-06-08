import express from "express"
import { SignUp, SignOut, SignIn, GetMe, UpdateMe, UpdateUserHospital } from "../controllers/AuthControllers.js"
import { middleware } from "../middleware/middleware.js";
const router = express.Router()

router.post("/signup", SignUp);
router.post("/signin", SignIn);
router.get("/me", middleware, GetMe);
router.patch("/updateMe", middleware, UpdateMe);
router.patch("/updateHospital", middleware, UpdateUserHospital);
router.get("/signout", SignOut);

export default router;