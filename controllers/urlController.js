const { URL } = require("node:url");
const Url = require("../models/Url");
const asyncHandler = require("../middleware/asyncHandler");

const validateOriginalUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    const parsedUrl = new URL(value.trim());

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return null;
    }

    return parsedUrl.href;
  } catch {
    return null;
  }
};

// 1. Create a short URL
const createShortUrl = asyncHandler(async (req, res) => {
  const originalUrl = validateOriginalUrl(req.body.originalUrl);

  if (!originalUrl) {
    return res.status(400).json({
      success: false,
      message: "Provide a valid HTTP or HTTPS URL",
    });
  }

  const { nanoid } = await import("nanoid");

  let savedUrl;

  for (let attempt = 0; attempt < 3; attempt++) {
    const shortCode = nanoid(8);

    try {
      savedUrl = await Url.create({
        originalUrl,
        shortCode,
      });

      break;
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }
    }
  }

  if (!savedUrl) {
    return res.status(503).json({
      success: false,
      message: "Could not generate a unique short code. Try again.",
    });
  }

  const shortUrl = `${process.env.BASE_URL}/${savedUrl.shortCode}`;

  res.status(201).json({
    success: true,
    message: "Short URL created successfully",
    data: {
      originalUrl: savedUrl.originalUrl,
      shortCode: savedUrl.shortCode,
      shortUrl,
      createdAt: savedUrl.createdAt,
    },
  });
});

// 2. Get all shortened URLs
const getAllUrls = asyncHandler(async (req, res) => {
  const urls = await Url.find()
    .sort({ createdAt: -1 })
    .select("-visitHistory");

  res.status(200).json({
    success: true,
    results: urls.length,
    data: urls,
  });
});

// 3. Redirect to the original URL and record a visit
const redirectUrl = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;

  const url = await Url.findOneAndUpdate(
    { shortCode },
    {
      $push: {
        visitHistory: {
          timestamp: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!url) {
    return res.status(404).json({
      success: false,
      message: "Short URL not found",
    });
  }

  return res.redirect(302, url.originalUrl);
});

// 4. Get analytics for a short URL
const getUrlAnalytics = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;

  const url = await Url.findOne({ shortCode });

  if (!url) {
    return res.status(404).json({
      success: false,
      message: "Short URL not found",
    });
  }

  res.status(200).json({
    success: true,
    data: {
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
      totalVisits: url.visitHistory.length,
      visitHistory: url.visitHistory,
      createdAt: url.createdAt,
    },
  });
});

// 5. Delete a shortened URL
const deleteShortUrl = asyncHandler(async (req, res) => {
  const { shortCode } = req.params;

  const url = await Url.findOneAndDelete({ shortCode });

  if (!url) {
    return res.status(404).json({
      success: false,
      message: "Short URL not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Short URL deleted successfully",
  });
});

module.exports = {
  createShortUrl,
  getAllUrls,
  redirectUrl,
  getUrlAnalytics,
  deleteShortUrl,
};