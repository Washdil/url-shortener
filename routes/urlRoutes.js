const express = require("express");
const router = express.Router();

const {
  createShortUrl,
  getAllUrls,
  redirectUrl,
  getUrlAnalytics,
  deleteShortUrl,
} = require("../controllers/urlController");

router.route("/")
  .post(createShortUrl)
  .get(getAllUrls);

router.get("/analytics/:shortCode", getUrlAnalytics);
router.delete("/:shortCode", deleteShortUrl);

module.exports = router;