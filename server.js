require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

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

const db = mongoose.connection;
db.once("open", () => console.log("Connected to MongoDB"));
db.on("error", (err) => console.error("MongoDB connection error:", err));

// Parking Schema & Model
const parkingSchema = new mongoose.Schema({
  available: Number,
  occupied: Number,
  non_compliant: Number,
});
const Parking = mongoose.model("Parking", parkingSchema);

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

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const addDataToParking = async ({ available, occupied, non_compliant }) => {
  try {
    const newParking = new Parking({ available, occupied, non_compliant });
    await newParking.save();
  } catch (e) {
    console.log(e);
  }
};
const data = { available: 25, occupied: 40, non_compliant: 35 };
addDataToParking(data);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
