import jwt from "../../../services/jwt.js";

// Create new measurement
export const createMeasurement = async (req, res) => {
  try {
    const token = jwt.verify(req);
    if (token.error)
      return res.status(401).json({ success: false, message: token.error });

    const userId = token.id;
    const sequelize = req.db;
    const Measurement = sequelize.models.Measurement;
    const {
      gender,
      armpit,
      chest,
      sleeveLength,
      hips,
      thigh,
      ankle,
      shoulder,
      biceps,
      waist,
      outsideLeg,
    } = req.body;

    const measurement = await Measurement.create({
      userId,
      gender,
      armpit,
      chest,
      sleeveLength,
      hips,
      thigh,
      ankle,
      shoulder,
      biceps,
      waist,
      outsideLeg,
    });

    res.status(201).json({ success: true, data: measurement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all measurements (admin purpose)
export const getAllMeasurements = async (req, res) => {
  try {
    const token = jwt.verify(req);
    if (token.error)
      return res.status(401).json({ success: false, message: token.error });
    const sequelize = req.db;
    const Measurement = sequelize.models.Measurement;
    const measurements = await Measurement.findAll();
    res.status(200).json({ success: true, data: measurements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get measurements by userId
export const getMeasurementByUser = async (req, res) => {
  try {
    const token = jwt.verify(req);
    if (token.error)
      return res.status(401).json({ success: false, message: token.error });
    const sequelize = req.db;
    const Measurement = sequelize.models.Measurement;
    const { userId } = req.params;
    const measurement = await Measurement.findOne({ where: { userId } });

    if (!measurement) {
      return res
        .status(404)
        .json({ success: false, message: "Measurement not found" });
    }

    res.status(200).json({ success: true, data: measurement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update measurement by userId
export const updateMeasurement = async (req, res) => {
  try {
    const token = jwt.verify(req);
    console.log(token);
    if (token.error)
      return res.status(401).json({ success: false, message: token.error });
    const sequelize = req.db;
    const Measurement = sequelize.models.Measurement;
    const { userId } = req.params;
    const {
      gender,
      armpit,
      chest,
      sleeveLength,
      hips,
      thigh,
      ankle,
      shoulder,
      biceps,
      waist,
      outsideLeg,
    } = req.body;

    const measurement = await Measurement.findOne({ where: { userId } });
    if (!measurement) {
      return res
        .status(404)
        .json({ success: false, message: "Measurement not found" });
    }

    await measurement.update(
      {
        gender,
        armpit,
        chest,
        sleeveLength,
        hips,
        thigh,
        ankle,
        shoulder,
        biceps,
        waist,
        outsideLeg,
      },
      {
        returning: true,
      }
    );

    res.status(200).json({ success: true, data: measurement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
