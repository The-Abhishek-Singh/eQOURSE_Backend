import { Router } from "express";
import {
  createRequest,
  getAllRequests,
} from "../controllers/request.controller.js";

const router = Router();

router.post("/", createRequest);
router.get("/", getAllRequests);

export default router;
