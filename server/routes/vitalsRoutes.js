const express = require("express");
const {
    getVitals,
    receiveVitals
} = require("../controllers/vitalsController");

const router = express.Router();

// GET /api/vitals - Retrieve latest patient vitals
router.get("/", getVitals);

// POST /api/vitals - Receive new patient vitals
router.post("/", receiveVitals);

module.exports = router;
