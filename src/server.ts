import express from "express";
import cors from "cors";
import compression from "compression";
import { getClicks, incrementClicks } from "./sqlite";
import { buildResponse } from "./utils";

const port = process.argv.includes("--debug") ? 3001 : 8080;
const app = express();

// const upload = multer();
app
  .use(compression())
  .use(
    express.json({
      limit: "100mb",
    })
  )
  .use(
    express.urlencoded({
      extended: true,
      limit: "100mb",
      parameterLimit: 100000,
    })
  )
  .use(cors());
app.use(express.static("public"));

app.get("/", (_req, res) => {
  res.send("Yo");
});

app.post("/clicks/:id", async (req, res) => {
  try {
    incrementClicks(req.params.id);

    res.send(buildResponse("success"));
  } catch (error: any) {
    res.send(buildResponse(error.message, true));
  }
});

app.post("/clicks/:id/:delta", async (req, res) => {
  try {
    incrementClicks(req.params.id, parseInt(req.params.delta, 10));

    res.send(buildResponse("success"));
  } catch (error: any) {
    res.send(buildResponse(error.message, true));
  }
});

app.get("/clicks", (_req, res) => {
  try {
    res.send(buildResponse(getClicks()));
  } catch (error: any) {
    res.send(buildResponse(error.message, true));
  }
});

app.listen(port, () => {
  console.info("Clicks Server listening on port", port);
});
