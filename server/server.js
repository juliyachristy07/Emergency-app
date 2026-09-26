const express = require("express");
const cors = require("cors");
require("dotenv").config();
const vitalsRoutes = require("./routes/vitalsRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/vitals", vitalsRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Ambulance Emergency System Backend Running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});