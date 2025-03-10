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

// 🔥 Watch the Parking Collection for Changes
const watchParkingChanges = async () => {
  const changeStream = Parking.watch();

  changeStream.on("change", async (change) => {
    console.log("Database Change Detected:");

    // 🚀 Trigger your job based on change type
    // if (change.operationType === "insert") {
    //   console.log("New Parking Data Added:", change.fullDocument);
    // } else if (change.operationType === "update") {
    //   console.log("Parking Data Updated:", change.updateDescription);
    // } else if (change.operationType === "delete") {
    //   console.log("Parking Data Deleted");
    // }
    await sendToThingsBoard(await getLatestParkingData());
  });
};

const getLatestParkingData = async () => {
  try {
    const parkingData = await Parking.findOne().sort({ _id: -1 }); // Fetch latest entry
    if (!parkingData) return {};
    const result = {
      available: parkingData.available,
      occupied: parkingData.occupied,
      non_compliant: parkingData.non_compliant,
    };
    return result;
  } catch (err) {
    console.log(`Error while getting parking data: ${e.message}`);
  }
};

app.get("/parking-update", async (req, res) => {
  try {
    const available = Math.floor(Math.random() * 100);
    const occupied = Math.floor(Math.random() * (100 - available));
    const non_compliant = 100 - (available + occupied);
    const data = { available, occupied, non_compliant };
    const newParking = new Parking(data);
    await newParking.save();
    res.json({
      message: "Parking percentages added successfully",
      data: newParking,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Watching
watchParkingChanges();

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
