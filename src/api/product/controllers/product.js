const { getPagination, getMeta } = require("../../../services/pagination");
const { errorResponse } = require("../../../services/errorResponse");
const { Op, literal, or, where, json } = require("sequelize");
const bulkTag = require("../services/blukTag");
const priceFilter = require("../services/priceFilter");
const productMetrics = require("../../../services/productMetrics");
const orderBy = require("../../../services/orderBy");
const tenantMetric = require("../../../services/tenantMetric");
const { tenant_metric_fields } = require("../../../constants/tenant_metric");
const { product_metric_field } = require("../../../constants/productMetric");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const pdfGenerator = require("../services/pdfGenerator");
const excelExport = require("../../../services/excelExport");
const shopify = require("../services/shopify");
const importProduct = require("../services/importProduct");

const importProductsFromExcel = require("../services/importProductsFromExcel");

const { IntraktNotify } = require("../../../services/notification");

const handlebars = require("handlebars");

exports.create = async (req, res) => {
  //console.log("Inside Product create");
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const body = req.body;
    const variants = body.variants;
    const product = await sequelize.models.Product.create(
      // {
      //   name: body.name,
      //   description: body.description,
      //   CategoryId: body.CategoryId || null,
      //   SubCategoryId: body.SubCategoryId || null,
      //   CollectionId: body.CollectionId || null,
      //   CollectionStaticId: body.CollectionStaticId || null,
      //   ThumbnailId: body.ThumbnailId || null,
      //   shipping_value: body.shipping_value,
      //   shipping_value_type: body.shipping_value_type,
      //   rating: body.rating,
      //   yt_video_link: body.yt_video_link
      // },
      req.body,
      { transaction: t }
    );
    let variantArray = [];
    for (const variant of variants) {
      variantArray.push({
        name: variant.name,
        price: variant.price,
        strike_price: variant.strike_price,
        quantity: variant.quantity,
        booking_price: variant.booking_price,
        ProductId: product.id,
        from: variant.from,
        to: variant.to,
        ThumbnailId: variant.ThumbnailId,
        // gallery: [2, 3]
      });
    }

    if (body.CollectionId) {
      const productCollection = await sequelize.models.CollectionProduct.create(
        { ProductId: product.id, CollectionId: body.CollectionId },
        { transaction: t }
      );
    }
    const product_metric = await sequelize.models.Product_metric.create(
      { ProductId: product.id },
      { transaction: t }
    );

    const createdVariants = await sequelize.models.Variant.bulkCreate(
      variantArray,
      { transaction: t }
    );
    let product_gallery_body = [];
    let variant_gallery_body = [];
    // product gellery
    if (body.gallery.length) {
      const obj = body.gallery.flatMap((item) => {
        return { MediaId: item, ProductId: product.id };
      });
      product_gallery_body.push(...obj);
    }

    // variant gellery
    for (const [i, variant] of createdVariants.entries()) {
      if (variants[i].gallery && variants[i].gallery.length) {
        let obj = variants[i].gallery.flatMap((item) => {
          return { MediaId: item, VariantId: variant.id };
        });
        variant_gallery_body.push(...obj);
      }
    }

    await sequelize.models.Product_gallery.bulkCreate(product_gallery_body, {
      transaction: t,
    });
    await sequelize.models.Variant_gallery.bulkCreate(variant_gallery_body, {
      transaction: t,
    });

    let bulk_pricings = [];
    //create bulkVariant
    for (const [i, it] of body.variants.entries()) {
      if (it.bulk_pricing) {
        let obj = it.bulk_pricing.map((bp) => {
          return {
            from: bp.from,
            to: bp.to,
            price: bp.price,
            premiumPrice: bp.premiumPrice,
            VariantId: createdVariants[i].id,
          };
        });

        bulk_pricings.push(...obj);
      }
    }

    const create_bulk_pricing = await sequelize.models.Bulk_pricing.bulkCreate(
      bulk_pricings,
      { transaction: t }
    );

    const tags = body.tags;
    let createdTags;
    if (tags && tags.length > 0) {
      createdTags = await bulkTag({
        sequelize,
        tags,
        ProductId: product.id,
        transaction: t,
      });
    }
    if (body.reviews && body.reviews.length) {
      const reviewArray = body.reviews.map((item) => {
        return {
          ...item,
          ProductId: product.id,
        };
      });
      const product_review = await sequelize.models.Product_review.bulkCreate(
        reviewArray,
        { transaction: t }
      );
    }
    await t.commit();
    const productThumbnail = await sequelize.models.Media.findByPk(
      body.thumbnail
    );
    tenantMetric({
      subdomain: req.subdomain,
      field_name: tenant_metric_fields.total_products,
    });

    const users = await sequelize.models.Store_user.findAll({
      attributes: ["phone"],
      include: [
        {
          model: sequelize.models.Role,
          as: "role",
          where: { name: "Consumer" },
          attributes: [],
        },
      ],
    });
    const phoneNumbers = JSON.parse(JSON.stringify(users)).map(
      (item) => item.phone
    );
    const data = {
      containsImage: true,
      body: [body.name, "1299"],
      hasButton: false,
      phoneNumber: phoneNumbers,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZHVjdHxlbnwwfHwwfHx8MA%3D%3D",
    };
    IntraktNotify(data, sequelize, "PRODUCT");

    return res.status(200).send({
      message: "Product and variants created successfully!",
      data: { product, variants: createdVariants },
    });
  } catch (error) {
    console.log(error);
    await t.rollback();
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server Error",
        details: error.message,
      })
    );
  }
};

exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const category = req.query.category;
    const minPrice = (query.price && parseFloat(query.price.min)) || 0;
    const maxPrice =
      (query.price && parseFloat(query.price.max)) || Number.MAX_SAFE_INTEGER;

    let whereClauseProduct = { is_active: true };
    let whereClauseVariant = {};
    if (
      query.hasOwnProperty("status") &&
      ["true", "false"].includes(query.status)
    ) {
      whereClauseProduct.is_active = query.status === "true" ? true : false;
    }

    if (query.hasOwnProperty("status") && ["all"].includes(query.status)) {
      whereClauseProduct = {};
    }

    if (
      query.hasOwnProperty("status") &&
      ["out-of-stock"].includes(query.status)
    ) {
      whereClauseVariant.quantity = 0;
    }

    const pagination = await getPagination(query.pagination);
    const order = priceFilter(query, sequelize);

    const products = await sequelize.models.Product.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: order,
      distinct: true,
      include: [
        {
          model: sequelize.models.Variant,
          as: "variants",
          where: {
            ...whereClauseVariant,
            ...(query.price && {
              price: {
                [Op.between]: [minPrice, maxPrice],
              },
            }),
          },
          include: ["gallery", "thumbnail", "bulk_pricings"],
        },
        "tags",
        "gallery",
        "thumbnail",
        "sub_category",
        "category",
        "collections",
        "product_metrics",
        // {
        //   model: sequelize.models.Product_review, as: "product_reviews",
        //   attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'average_rating']],
        // }
      ],
      where: {
        ...whereClauseProduct,
        ...(category ? { CategoryId: { [Op.in]: JSON.parse(category) } } : {}),
      },
      attributes: {
        include: [
          [
            sequelize.literal(
              '(SELECT ROUND(AVG("rating"), 2) FROM "Product_reviews" WHERE "Product_reviews"."ProductId" = "Product"."id")'
            ),
            "ratings",
          ],
        ],
      },
    });

    const meta = await getMeta(pagination, products.count);
    return res.status(200).send({ data: products.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server Error",
        details: error.message,
      })
    );
  }
};

exports.findOne = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const { id } = req.params;
    let product = await sequelize.models.Product.findOne({
      where: {
        id: id,
        is_active: true,
      },
      include: [
        {
          model: sequelize.models.Variant,
          as: "variants",
          include: ["thumbnail", "gallery", "bulk_pricings"],
        },
        {
          model: sequelize.models.Category,
          as: "category",
        },
        "thumbnail",
        "tags",
        "gallery",
        "sub_category",
        // {
        //   model: sequelize.models.Coupon,
        //   as: "product_coupons",
        //   through: { attributes: [] }
        // },
        {
          model: sequelize.models.Collection,
          as: "collections",
          through: { attributes: [] },
          include: [
            {
              model: sequelize.models.Coupon,
              as: "coupons",
              //  through: { attributes: [] }
            },
          ],
        },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(
              '(SELECT ROUND(AVG("rating"), 2) FROM "Product_reviews" WHERE "Product_reviews"."ProductId" = "Product"."id")'
            ),
            "ratings",
          ],
        ],
      },
    });

    if (!product) {
      return res.status(404).send(
        errorResponse({
          status: 404,
          message: "Product not found!",
          details: "product id seems to be invalid",
        })
      );
    }

    const coupons = product.collections.flatMap((item) => {
      return item.coupons.flatMap((item) => item);
    });

    const randomProducts = await sequelize.models.Product.findAll({
      where: {
        id: {
          [Op.ne]: id,
        },
        is_active: true,
        ...(product.dataValues.CategoryId
          ? {
              CategoryId: product.dataValues.CategoryId,
            }
          : {}),
      },

      order: sequelize.literal("RANDOM()"),
      limit: 6,
      attributes: {
        include: [
          [
            sequelize.literal(
              '(SELECT ROUND(AVG("rating"), 2) FROM "Product_reviews" WHERE "Product_reviews"."ProductId" = "Product"."id")'
            ),
            "rating",
          ],
        ],
      },
      include: [
        {
          model: sequelize.models.Variant,
          as: "variants",
          include: ["thumbnail", "gallery", "bulk_pricings"],
        },
        {
          model: sequelize.models.Media,
          as: "thumbnail",
        },
        {
          model: sequelize.models.Category,
          as: "category",
        },
        "tags",
        "gallery",
      ],
    });

    await productMetrics({
      sequelize,
      product_id: [product.id],
      field_name: product_metric_field.view_count,
      transaction: t,
    });
    await t.commit();
    return res.status(200).send({
      data: { product: { ...product.dataValues, coupons }, randomProducts },
    });
  } catch (error) {
    console.log(error);
    await t.rollback();
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.update = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const body = req.body;
    const getProduct = await sequelize.models.Product.findByPk(id);
    if (!getProduct) {
      return res.status(404).send(
        errorResponse({
          status: 404,
          message: "Product ID seems to be invalid!",
          details: "Requested Product Id Does not exists",
        })
      );
    }
    const [rows, [product]] = await sequelize.models.Product.update(req.body, {
      where: { id },
      returning: true,
      transaction: t,
    });

    if (body.gallery && body.gallery.length) {
      const productMedia = await sequelize.models.Product_gallery.findAll({
        where: { ProductId: id },
      });

      const oldArray = productMedia.map((entry) => entry.dataValues.MediaId);
      const newArray = req.body.gallery;

      let newElements = [];
      let removedElements = [];

      for (let i = 0; i < newArray.length; i++) {
        if (!oldArray.includes(newArray[i])) {
          newElements.push(newArray[i]);
        }
      }

      for (let i = 0; i < oldArray.length; i++) {
        if (!newArray.includes(oldArray[i])) {
          removedElements.push(oldArray[i]);
        }
      }
      const addArray = newElements.map((item) => ({
        ProductId: id,
        MediaId: item,
      }));

      const destroyproductMedia =
        await sequelize.models.Product_gallery.destroy(
          {
            where: { MediaId: removedElements },
          },
          { transaction: t }
        );

      await sequelize.models.Product_gallery.bulkCreate(addArray, {
        transaction: t,
      });
    }

    if (body.CollectionId) {
      const productCollection =
        await sequelize.models.CollectionProduct.findOrCreate({
          where: { ProductId: product.id, CollectionId: body.CollectionId },
          transaction: t,
        });
    }

    await t.commit();
    return res.status(200).send({
      message: "product updated successfully!",
      data: product,
    });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const getProduct = await sequelize.models.Product.findByPk(id);
    if (!getProduct) {
      return res.status(400).send(
        errorResponse({
          status: 400,
          message: "Product ID seems to be invalid!",
          details: "Requested Product Id Does not exists",
        })
      );
    }
    const product = await sequelize.models.Product.update(
      { is_active: false },
      { where: { id } }
    );
    const variants = await sequelize.models.Variant.update(
      { is_active: false },
      { where: { ProductId: id } }
    );
    return res.status(200).send({ message: "product deleted successfully!" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.search = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const qs = query.qs.trim();
    const pagination = await getPagination(query.pagination);
    const tags = query?.tags?.toLowerCase().split("_");
    const order = orderBy(req.query);
    const products = await sequelize.models.Product.findAndCountAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${qs}%` } },
          { description: { [Op.iLike]: `%${qs}%` } },
          literal(
            `EXISTS (SELECT * FROM "Variants" AS "variants" WHERE "Product"."id" = "variants"."ProductId" AND "variants"."name" ILIKE '%${qs}%')`
          ),
        ],
        is_active: true,
      },
      order: order,
      offset: pagination.offset,
      limit: pagination.limit,
      distinct: true,
      include: [
        {
          model: sequelize.models.Variant,
          as: "variants",
          include: ["thumbnail", "gallery", "bulk_pricings"],
        },
        {
          model: sequelize.models.Category,
          as: "category",
        },
        "thumbnail",
        {
          model: sequelize.models.Tag,
          as: "tags",
          ...(query.tags && {
            where: {
              name: {
                [Op.iLike]: { [Op.any]: tags.map((item) => `%${item}%`) },
              },
            },
          }),
        },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(
              '(SELECT ROUND(AVG("rating"), 2) FROM "Product_reviews" WHERE "Product_reviews"."ProductId" = "Product"."id")'
            ),
            "rating",
          ],
        ],
      },
    });
    const meta = await getMeta(pagination, products.count);
    return res.status(200).send({ data: products.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server Error",
        details: error.message,
      })
    );
  }
};

exports.findByPrice = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(query.pagination);
    const order = orderBy(query);
    const price = query.price;
    const products = await sequelize.models.Product.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: [order],
      distinct: true,
      include: [
        {
          model: sequelize.models.Variant,
          as: "variants",
          include: ["thumbnail", "gallery", "bulk_pricings"],
          where: {
            [Op.and]: [
              {
                price: {
                  [Op.gte]: price.min,
                },
              },
              {
                price: {
                  [Op.lte]: price.max,
                },
              },
            ],
          },
        },
        {
          model: sequelize.models.Media,
          as: "thumbnail",
        },
        {
          model: sequelize.models.Category,
          as: "category",
        },
        "tags",
        "gallery",
      ],
      where: {
        is_active: true,
      },
      attributes: {
        include: [
          [
            sequelize.literal(
              '(SELECT ROUND(AVG("rating"), 2) FROM "Product_reviews" WHERE "Product_reviews"."ProductId" = "Product"."id")'
            ),
            "rating",
          ],
        ],
      },
    });
    const meta = await getMeta(pagination, products.count);
    return res.status(200).send({ data: products.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server Error",
        details: error.message,
      })
    );
  }
};

exports.findNRandom = async (req, res) => {
  try {
    const sequelize = req.db;
    const n = req.params.n;

    const products = await sequelize.models.Product.findAll({
      order: sequelize.literal("RANDOM()"),
      limit: n,
      attributes: {
        include: [
          [
            sequelize.literal(
              '(SELECT ROUND(AVG("rating"), 2) FROM "Product_reviews" WHERE "Product_reviews"."ProductId" = "Product"."id")'
            ),
            "rating",
          ],
        ],
      },
      include: [
        {
          model: sequelize.models.Variant,
          as: "variants",
          include: ["thumbnail", "gallery", "bulk_pricings"],
          where: {
            ...(req.query.price
              ? {
                  [Op.and]: [
                    {
                      price: {
                        [Op.gte]: price.min,
                      },
                    },
                    {
                      price: {
                        [Op.lte]: price.max,
                      },
                    },
                  ],
                }
              : null),
          },
        },
        {
          model: sequelize.models.Media,
          as: "thumbnail",
        },
        {
          model: sequelize.models.Category,
          as: "category",
        },
        "tags",
        "gallery",
      ],
      where: {
        is_active: true,
      },
    });

    return res.status(200).send({ data: products });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server Error",
        details: error.message,
      })
    );
  }
};

exports.findNRandomInCategory = async (req, res) => {
  try {
    const sequelize = req.db;
    const n = req.params.n;
    const category_id = req.params.id;
    const price = req.query.price;
    const products = await sequelize.models.Product.findAll({
      where: {
        CategoryId: category_id,
        is_active: true,
      },
      attributes: {
        include: [
          [
            sequelize.literal(
              '(SELECT ROUND(AVG("rating"), 2) FROM "Product_reviews" WHERE "Product_reviews"."ProductId" = "Product"."id")'
            ),
            "rating",
          ],
        ],
      },
      order: sequelize.literal("RANDOM()"),
      limit: n,
      include: [
        {
          model: sequelize.models.Variant,
          as: "variants",
          include: ["thumbnail", "gallery", "bulk_pricings"],
          where: {
            ...(query.price
              ? {
                  [Op.and]: [
                    {
                      price: {
                        [Op.gte]: price.min,
                      },
                    },
                    {
                      price: {
                        [Op.lte]: price.max,
                      },
                    },
                  ],
                }
              : null),
          },
        },
        {
          model: sequelize.models.Media,
          as: "thumbnail",
        },
        {
          model: sequelize.models.Category,
          as: "category",
        },
        "tags",
        "gallery",
      ],
    });

    return res.status(200).send({ data: products });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server Error",
        details: error.message,
      })
    );
  }
};

exports.catalouge = async (req, res) => {
  try {
    //console.log("entered in Puppeteer");

    const id = req.params.id;
    const sequelize = req.db;
    const products = await sequelize.models.Product.findAll({
      where: { id: id },
      include: ["thumbnail", "variants"],
    });

    const pdfpath = await pdfGenerator(
      JSON.parse(JSON.stringify(products)).map((item) => {
        item.thumbnail.url = `http://${"lavisha"}.api.mtl.hangs.in/${
          item.thumbnail.url
        }`;
        //console.log(item.thumbnail.url)
        return item.dataValues;
      })
    );

    const url = `https://${req.subdomain}.store.api.mtl.hangs.in/catalouge/${products}`;
    // const url = `https://192.168.3.82.store.api.mtl.hangs.in/catalouge/${products}`;
    const outputfile = path.join(
      process.cwd(),
      "public",
      "uploads",
      "example.pdf"
    );

    // Launch the browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" }); // or "domcontentloaded"
    await page.setViewport({ width: 1080, height: 1024 });

    // Generate a PDF with background and save to public/uploads directory
    const pdf = await page.pdf({
      path: outputfile,
      format: "A4",
      printBackground: true,
    });

    // const pdf = fs.readFileSync(path.join(process.cwd(), "output.pdf"), "base64")
    // const pdfBuffer = Buffer.from(pdf, "base64")

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="generated.pdf"'
    );

    await browser.close();

    // res.status(201).sendFile(pdfpath.filename);
    res.status(201).send(pdf);
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server Error",
        details: error.message,
      })
    );
  }
};

exports.findNTrending = async (req, res) => {
  try {
    const sequelize = req.db;
    const n = req.params.n;
    const productMetrics = await sequelize.models.Product_metric.findAll({
      limit: n,
      order: [["view_count", "DESC"]],
      raw: true,
      include: [
        {
          model: sequelize.models.Product,
          where: { is_active: true },
          as: "product",
        },
      ],
    });

    const productIds = productMetrics.map((item) => item.ProductId);
    const products = await sequelize.models.Product.findAll({
      where: { id: productIds },
      include: [
        {
          model: sequelize.models.Variant,
          as: "variants",
          include: ["thumbnail", "gallery", "bulk_pricings"],
        },
        {
          model: sequelize.models.Media,
          as: "thumbnail",
        },
        {
          model: sequelize.models.Category,
          as: "category",
        },
        "tags",
        "gallery",
      ],
    });

    return res.status(200).send({ data: products });
  } catch (error) {
    console.error(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server error",
        details: error.message,
      })
    );
  }
};

exports.findNSelling = async (req, res) => {
  try {
    const sequelize = req.db;
    const n = req.params.n;

    const productMetrics = await sequelize.models.Product_metric.findAll({
      limit: n,
      order: [["ordered_count", "DESC"]],
      raw: true,
      include: [
        {
          model: sequelize.models.Product,
          where: { is_active: true },
          as: "product",
        },
      ],
    });

    const productIds = productMetrics.map((item) => item.ProductId);

    const products = await sequelize.models.Product.findAll({
      where: { id: productIds },
      include: [
        {
          model: sequelize.models.Variant,
          as: "variants",
          include: ["thumbnail", "gallery", "bulk_pricings"],
        },
        {
          model: sequelize.models.Media,
          as: "thumbnail",
        },
        {
          model: sequelize.models.Category,
          as: "category",
        },
        "tags",
        "gallery",
      ],
    });

    return res.status(200).send({ data: products });
  } catch (error) {
    console.error(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server error",
        details: error.message,
      })
    );
  }
};

// exports.exportToExcel = async (req, res) => {
//   try {
//     const sequelize = req.db;
//     const query = req.query;
//     const body = req.body;
//     const whereClause = {};
//     if (body.items.length && Array.isArray(body.items)) {
//       whereClause.id = { [Op.in]: body.items };
//     }
//     const order = orderBy(query);
//     const products = await sequelize.models.Product.findAll({
//       where: whereClause,
//       order: order,
//       include: [
//         {
//           model: sequelize.models.Variant,
//           as: "variants",
//           include: ["thumbnail", "gallery"],
//         },
//       ],
//       raw: true,
//     });
//     if (!products.length) {
//       return res
//         .status(400)
//         .send({ message: `No data found for last ${query.days}` });
//     }

//     const excelFile = await excelExport(products);
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
//     res.setHeader("Content-Disposition", 'attachment; filename="output.xlsx"');
//     return res.status(200).send(excelFile);
//   } catch (error) {
//     return res
//       .status(500)
//       .send(
//         errorResponse({ status: 500, message: error.message, details: error })
//       );
//   }
// };
exports.exportToExcel = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const body = req.body;

    // Prepare filter criteria
    const whereClause = {};
    if (body.items?.length && Array.isArray(body.items)) {
      whereClause.id = { [Op.in]: body.items };
    }

    const limit = 1000; // Number of records to fetch per batch
    let offset = 0;
    const products = [];

    // Fetch all products in batches
    while (true) {
      const batch = await sequelize.models.Product.findAll({
        where: whereClause,
        order: orderBy(query),
        include: [
          {
            model: sequelize.models.Variant,
            as: "variants",
            include: ["thumbnail", "gallery"],
          },
        ],
        raw: true,
        offset,
        limit,
      });

      if (!batch.length) break; // Exit loop if no more records
      products.push(...batch); // Add batch to products array
      offset += limit; // Increment offset for the next batch
    }

    // Handle no products found
    if (!products.length) {
      return res
        .status(400)
        .send({ message: "No data found for the given criteria." });
    }

    // Export to Excel
    const excelFile = await excelExport(products);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="products.xlsx"'
    );
    return res.status(200).send(excelFile);
  } catch (error) {
    return res
      .status(500)
      .send(
        errorResponse({ status: 500, message: error.message, details: error })
      );
  }
};

exports.importFromExcel = async (req, res) => {
  try {
    const sequelize = req.db;

    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
    }

    const result = await importProductsFromExcel({
      sequelize,
      fileBuffer: req.file.buffer,
    });

    if (result.error) {
      return res
        .status(500)
        .send({ message: "Import failed", error: result.error });
    }

    return res.status(200).send({ message: "Products Imported Successfully!" });
  } catch (error) {
    return res.status(500).send({
      message: "Failed to import data",
      error: error.message,
    });
  }
};

exports.importFromShopify = async (req, res) => {
  try {
    const sequelize = req.db;
    const { access_token, api_key, api_secret, domain } = req.body;
    const products = await importProduct({
      sequelize,
      access_token,
      api_key,
      api_secret,
      domain,
    });
    if (products) {
      return res
        .status(200)
        .send({ message: "Products Imported Successfully!" });
    } else {
      return res
        .status(500)
        .send(errorResponse({ message: "internal server error" }));
    }
  } catch (error) {
    //console.log(error)
    return res
      .status(500)
      .send(
        errorResponse({ status: 500, message: error.message, details: error })
      );
  }
};

exports.simpleData = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(query.pagination);
    const order = priceFilter(query, sequelize);
    const products = await sequelize.models.Product.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: order,
      attributes: ["id", "name"],
    });
    const meta = await getMeta(pagination, products.count);
    return res.status(200).send({ data: products.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server Error",
        details: error.message,
      })
    );
  }
};

exports.shareProduct = async (req, res) => {
  try {
    const { id } = req.params;
    //console.log(id)
    const createMetric = await productMetrics({
      field_name: product_metric_field.shares_count,
      product_id: [id],
    });
    return res.status(200).send({ message: "product share count updated" });
  } catch (error) {
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: error.message }));
  }
};
/**
 *
 * @param {Object} req
 * @param {import("sequelize").Sequelize} req.db
 * @param {*} res
 * @returns
 */
exports.productsByReview = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(query.pagination);
    const reviewQuery = query.qs
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${query.qs}%` } },
            { title: { [Op.iLike]: `%${query.qs}%` } },
            { review: { [Op.iLike]: `%${query.qs}%` } },
          ],
        }
      : {};
    const products = await sequelize.models.Product.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: orderBy(query),
      attributes: [
        "id",
        "name",
        [
          sequelize.literal(
            '(select count(*) from "Product_reviews" where "Product_reviews"."ProductId" = "Product"."id")'
          ),
          "reviewCount",
        ],
      ],
      distinct: true,
      include: [
        {
          model: sequelize.models.Media,
          as: "thumbnail",
          attributes: ["id", "url"],
        },
        {
          model: sequelize.models.Product_review,
          as: "product_reviews",
          attributes: [],
          where: reviewQuery,
          required: true,
        },
      ],
    });
    const meta = await getMeta(pagination, products.count);
    return res.status(200).send({ data: products.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server Error",
        details: error.message,
      })
    );
  }
};

exports.stats = async (req, res) => {
  try {
    const sequelize = req.db;
    const [allProducts, inActiveProducts, activeProduct, outOfStock] =
      await Promise.all([
        await sequelize.models.Product.count(),
        await sequelize.models.Product.count({ where: { is_active: false } }),
        await sequelize.models.Product.count({ where: { is_active: true } }),
        await sequelize.models.Product.count({
          distinct: true,
          include: [
            {
              model: sequelize.models.Variant,
              as: "variants",
              where: {
                quantity: 0,
              },
            },
          ],
        }),
      ]);

    return res.status(200).send({
      data: {
        allProducts: allProducts,
        activeProduct: activeProduct,
        inActiveProducts: inActiveProducts,
        outOfStock: outOfStock,
      },
    });
  } catch (error) {
    //console.log(error)
    return res.status(500).send(error);
  }
};

exports.removeCollection = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id, cId } = req.params;
    const productCollection = await sequelize.models.CollectionProduct.destroy({
      where: { ProductId: id, CollectionId: cId },
    });
    return res.status(200).send({
      message: "product updated successfully!",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.findByIds = async (req, res) => {
  try {
    const sequelize = req.db;
    // const { ids } = req.body;

    const products = await sequelize.models.Product.findAll({
      where: {
        ...(req.body.products ? { id: { [Op.in]: req.body.products } } : ""),
      },
      distinct: true,
      include: [
        {
          where: {
            ...(req.body.variants
              ? { id: { [Op.in]: req.body.variants } }
              : ""),
          },
          model: sequelize.models.Variant,
          as: "variants",
          include: ["gallery", "thumbnail"],
        },
        "tags",
        "gallery",
        "thumbnail",
        "sub_category",
        "category",
        "collections",
        "product_metrics",
      ],

      attributes: {
        include: [
          [
            sequelize.literal(
              '(SELECT ROUND(AVG("rating"), 2) FROM "Product_reviews" WHERE "Product_reviews"."ProductId" = "Product"."id")'
            ),
            "ratings",
          ],
        ],
      },
    });

    return res.status(200).send({ data: products });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server Error",
        details: error.message,
      })
    );
  }
};

// ✅ Updated generatePDF function that returns buffer
const generatePDF = async (productData) => {
  const htmlTemplate = fs.readFileSync(
    path.join(process.cwd(), "/views/productInfo.html"),
    "utf8"
  );

  const template = handlebars.compile(htmlTemplate);
  const html = template(productData[0]); // for one product

  const browser = await puppeteer.launch({
    headless: "new", // or true if you're not using the new headless mode
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // 🛠️ fix for running as root
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer; // ✅ Return buffer to controller
};

exports.productInfo = async (req, res) => {
  try {
    const productData = req.body;
    const pdfBuffer = await generatePDF(productData);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": 'attachment; filename="product-info.pdf"',
    });

    return res.send(pdfBuffer); // ✅ Stream to client
  } catch (error) {
    console.error("Error generating PDF:", error);
    return res.status(500).json({ message: "Failed to generate PDF" });
  }
};
