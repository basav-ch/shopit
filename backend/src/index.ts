import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { clerkMiddleware } from "@clerk/express";
import { clerkWebhookHandler } from "./webhooks/clerk";
import { getEnv } from "./lib/env";

const env = getEnv();
const app = express();

const rawJson = express.raw({ type: "application/json", limit: "1mb" });

// It is important that you don't pass the webhook event data, it should be in the raw format
app.post("/webhooks/clerk", rawJson, (req, res) => {
  void clerkWebhookHandler(req, res);
});

app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});


app.use(express.json());
app.use(cors());


const publicDir = path.join(process.cwd(),"public")

const indexPath = path.join(publicDir, "index.html");

console.log("index.html exists:", fs.existsSync(indexPath));

if (fs.existsSync(indexPath)) {
  console.log(
    "index.html content:",
    fs.readFileSync(indexPath, "utf8")
  );
}

console.log("Current directory:", process.cwd());
console.log("Public directory:", publicDir);
console.log("Public exists:", fs.existsSync(publicDir));

if(fs.existsSync(publicDir)){

  app.get("/", (_req, res) => {
    console.log("SERVING INDEX.HTML");
    res.sendFile(path.join(publicDir, "index.html"));
  });

  app.use(express.static(publicDir))

  console.log("Public files:", fs.readdirSync(publicDir));
  console.log(
    "index.html exists:",
    fs.existsSync(path.join(publicDir, "index.html"))
  );

  app.get("/{*any}", (req,res,next)=>{
    if(req.method !== "GET" && req.method !== "HEAD"){
      next();
      return;
    }

    if(req.path.startsWith("/api") || req.path.startsWith("/webhooks")){
      next();
      return;
    }

    res.sendFile(path.join(publicDir, "index.html"), (err)=>next(err));
  })
}

app.use(clerkMiddleware);

console.log("process.env.PORT =", process.env.PORT);
console.log("env.PORT =", env.PORT);


app.listen(env.PORT,'0.0.0.0', () => console.log("listening on port: ",env.PORT));
