import jwt from "../../../services/jwt.js";
import store from "../models/store.js";
import Store from "../models/store.js";

export const createStore = async (req, res) => {
  try {
    const sequelize = req.db;
    const Store = sequelize.models.Store;
    const token = jwt.verify(req);
    const createdStoreId = token.id;
    if (token.error)
      return res.status(401).json({ success: false, message: token.error });
    const {
      storeName,
      description,
      phone,
      email,
      street,
      area,
      city,
      state,
      country,
      pincode,
      openTime,
      closeTime,
      imageUrl,
    } = req.body;

    const newStore = await Store.create({
      storeName,
      description,
      phone,
      email,
      street,
      area,
      city,
      state,
      country,
      pincode,
      openTime,
      closeTime,
      imageUrl,
      ownerId: createdStoreId,
    });

    res.status(201).json({ success: true, data: newStore });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllStores = async (req, res) => {
  try {
    const sequelize = req.db;
    const { Op } = sequelize.Sequelize;
    const Store = sequelize.models.Store;

    // Verify token
    const token = jwt.verify(req);
    if (token.error)
      return res.status(401).json({ success: false, message: token.error });

    // Pagination defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    // Search query
    const search = req.query.search || "";

    const where = search
      ? {
          [Op.or]: [
            { storeName: { [Op.iLike]: `%${search}%` } },
            { state: { [Op.iLike]: `%${search}%` } },
            { city: { [Op.iLike]: `%${search}%` } },
            { area: { [Op.iLike]: `%${search}%` } },
            { pincode: { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    // Fetch stores with pagination + search
    const { rows: stores, count } = await Store.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: stores,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStoreById = async (req, res) => {
  try {
    const sequelize = req.db;
    const Store = sequelize.models.Store;
    const token = jwt.verify(req);
    if (token.error)
      return res.status(401).json({ success: false, message: token.error });
    const store = await Store.findByPk(req.params.id);
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "Store not found" });
    res.json({ success: true, data: store });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStore = async (req, res) => {
  try {
    const sequelize = req.db;
    const Store = sequelize.models.Store;
    const token = jwt.verify(req);
    if (token.error)
      return res.status(401).json({ success: false, message: token.error });
    const store = await Store.findByPk(req.params.id);
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "Store not found" });

    await store.update(req.body);
    res.json({ success: true, data: store });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStore = async (req, res) => {
  try {
    const sequelize = req.db;
    const Store = sequelize.models.Store;
    const token = jwt.verify(req);
    if (token.error)
      return res.status(401).json({ success: false, message: token.error });
    const store = await Store.findByPk(req.params.id);
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "Store not found" });

    await store.destroy();
    res.json({ success: true, message: "Store deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
