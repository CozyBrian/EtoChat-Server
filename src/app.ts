import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";

const app = express();


app.use(express.static(path.join(__dirname, "..", "public")));

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);
  
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "..", "index.html"));
});

app.use(express.static("public"));
  
export default app;
