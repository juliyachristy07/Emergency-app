// In-memory store for latest vitals (sample/simulated baseline)
let currentVitals = {
    patientId: "P001",
    heartRate: 112,
    spo2: 93,
    timestamp: new Date().toISOString()
};

/**
 * GET /api/vitals
 * Retrieves the latest recorded patient vitals
 */
const getVitals = (req, res) => {
    try {
        res.status(200).json(currentVitals);
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving vitals data",
            error: error.message
        });
    }
};

/**
 * POST /api/vitals
 * Receives and updates patient vitals data
 */
const receiveVitals = (req, res) => {
    try {
        const { patientId, heartRate, spo2 } = req.body;

        if (!patientId || heartRate === undefined || spo2 === undefined) {
            return res.status(400).json({
                message: "Patient ID, heart rate and SpO2 are required"
            });
        }

        const parsedHeartRate = Number(heartRate);
        const parsedSpo2 = Number(spo2);

        if (isNaN(parsedHeartRate) || isNaN(parsedSpo2)) {
            return res.status(400).json({
                message: "Heart rate and SpO2 must be valid numbers"
            });
        }

        currentVitals = {
            patientId: String(patientId),
            heartRate: parsedHeartRate,
            spo2: parsedSpo2,
            timestamp: new Date().toISOString()
        };

        res.status(200).json({
            message: "Vitals received successfully",
            data: currentVitals
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating vitals data",
            error: error.message
        });
    }
};

module.exports = {
    getVitals,
    receiveVitals
};