import express from "express";

import { matchRouter } from "./routes/matches.js";

const PORT = Number(process.env.PORT || 8000);

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from Express server!");
});

// app.use(securityMiddleware());

app.use("/matches", matchRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://:${PORT}`);
});
