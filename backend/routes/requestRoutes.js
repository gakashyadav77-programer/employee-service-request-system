const express = require("express");
const {
  createRequest,
  getMyRequests,
} = require("../controllers/requestController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, createRequest);

router.get("/my", authenticateToken, getMyRequests);

module.exports = router;