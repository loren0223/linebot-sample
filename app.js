"use strict";

const fs = require("fs");
const path = require("path");
const line = require("@line/bot-sdk");
const express = require("express");
const lineRouter = require("./routes/line");

// create Express app
const app = express();

// mount linebot middleware
app.use("/line/callback", lineRouter);

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
