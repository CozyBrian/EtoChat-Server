import express, { Request, Response } from "express";
import cors from "cors";
const nanoid = require("nanoid");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

app.get("/", (req: Request, res: Response) => {
  const id = nanoid();
  res.redirect(`/${id}`);
});

export default app;
