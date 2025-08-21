// controllers/selfPickup.controller.js

exports.createSelfPickup = async (req, res) => {
  try {
    const sequelize = req.db;
    const data = await sequelize.models.PickupAddress.create(req.body);
    res.status(201).json({ message: "Self-pickup location added", data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding self-pickup location", error });
  }
};

exports.getAllSelfPickups = async (req, res) => {
  try {
    const sequelize = req.db;
    const data = await sequelize.models.PickupAddress.findAll();
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error fetching self-pickup locations", error });
  }
};
