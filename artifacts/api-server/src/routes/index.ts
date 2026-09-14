import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ankiRouter from "./anki";
import vaultRouter from "./vault";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/anki", ankiRouter);
router.use("/vault", vaultRouter);

export default router;
