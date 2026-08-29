import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ankiRouter from "./anki";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/anki", ankiRouter);

export default router;
