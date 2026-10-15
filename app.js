const express = require("express");

const urlRoutes = require("./routes/urlRoutes");
const redirectUrl = require("./controllers/urlController").redirectUrl;

const notFound = require("./middleware/notFound");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "URL Shortener API is running",
  });
});

app.use("/api/urls", urlRoutes);

app.get("/:shortCode", redirectUrl);

app.use(notFound);
app.use(errorMiddleware);

module.exports = app;