const { errorResponse } = require("../../../services/errorResponse");
const tenantMetric = require("../../../services/tenantMetric");

exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const getGlobalBrand = await sequelize.models.Global_brand.findAll();

    if (getGlobalBrand.length !== 0) {
      const updateGlobalBrand = await sequelize.models.Global_brand.update(req.body, {
        where: { id: getGlobalBrand[0].id },
        returning: true,
      });

      return res.status(200).send({
        message: "Global brand updated",
        data: updateGlobalBrand[1][0],
      });
    } else {
      const globalBrand = await sequelize.models.Global_brand.create(req.body);

      return res.status(201).send({
        message: "Global brand created successfully",
        data: globalBrand,
      });
    }
  } catch (error) {
    console.log(error);
    return errorResponse(res, {
      status: 500,
      message: "Internal server Error",
      details: error.message,
    });
  }
};

exports.find = async (req, res) => {
  try {
    const sequelize = req.db;

    const globalBrand = await sequelize.models.Global_brand.findOne({ include: ["logo_dark", "logo_light", "favicon"] });

    if (!globalBrand) {
      return res.status(404).send({ error: "Global brand not found" });
    }
    
    tenantMetric({ subdomain: req.subdomain, field_name: "total_site_visits" })

    return res.status(200).send({ data: globalBrand });
  } catch (error) {
    console.log(error);
    return errorResponse(res, {
      status: 500,
      message: "Internal server Error",
      details: error.message,
    });
  }
};
