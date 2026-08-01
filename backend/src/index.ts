import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config";
import authRoutes from "./routes/auth";
import groupRoutes from "./routes/groups";
import peopleRoutes from "./routes/people";
import billRoutes from "./routes/bills";

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "expense-splitter-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/groups/:groupId/people", peopleRoutes);
app.use("/api/groups/:groupId/bills", billRoutes);

// Fallback error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(config.port, () => {
  console.log(`Expense Splitter API listening on port ${config.port} (${config.nodeEnv})`);
});
