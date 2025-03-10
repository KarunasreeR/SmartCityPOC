require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");

const app = express();
app.use(express.json());
const MongoDbUserName = encodeURIComponent(process.env.MongoDbUserName);
const MongoDbPassword = encodeURIComponent(process.env.MongoDbPassword);
const databaseName = encodeURIComponent(process.env.databaseName);
const MONGODB_URI = `mongodb+srv://${MongoDbUserName}:${MongoDbPassword}@smartcity.sjyjw.mongodb.net/${databaseName}?retryWrites=true&w=majority&appName=SmartCity`;
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Parking Schema & Model
const parkingSchema = new mongoose.Schema({
  available: Number,
  occupied: Number,
  non_compliant: Number,
});
const Parking = mongoose.model("Parking", parkingSchema);

// ThingsBoard Configuration
const THINGSBOARD_URL = "http://thingsboard.cloud";
const ACCESS_TOKEN = "T5nzLuX8mg0tKx5zBg8P";

const sendToThingsBoard = async (data) => {
  try {
    await axios.post(
      `${THINGSBOARD_URL}/api/v1/${ACCESS_TOKEN}/telemetry`,
      data
    );
    console.log("Data sent to ThingsBoard:", data);
  } catch (error) {
    console.error("Error sending data to ThingsBoard:", error.message);
  }
};

const addDataToParking = async () => {
  const data = {
    available: Math.floor(Math.random() * 100) + 1,
    occupied: Math.floor(Math.random() * 100) + 1,
    non_compliant: Math.floor(Math.random() * 100) + 1,
  };
  try {
    const newParking = new Parking(data);
    await newParking.save();
  } catch (e) {
    console.log(e);
  }
};

// GET: Fetch parking availability percentages
app.get("/parking", async (req, res) => {
  try {
    const parkingData = await Parking.findOne().sort({ _id: -1 }); // Fetch latest entry
    if (!parkingData) return res.status(404).json({ message: "No data found" });

    const total =
      parkingData.available + parkingData.occupied + parkingData.non_compliant;
    const response = {
      available: ((parkingData.available / total) * 100).toFixed(2),
      occupied: ((parkingData.occupied / total) * 100).toFixed(2),
      non_compliant: ((parkingData.non_compliant / total) * 100).toFixed(2),
    };
    addDataToParking();
    sendToThingsBoard(response);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
