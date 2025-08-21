const XLSX = require("xlsx");

/***********************Below Is Working Code*********************************************** */

// module.exports = async ({ sequelize, fileBuffer }) => {
//   const transaction = await sequelize.transaction();
//   try {
//     const workbook = XLSX.read(fileBuffer, { type: "buffer" });
//     const sheetName = workbook.SheetNames[0];
//     const products = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

//     for (const item of products) {
//       // Ensure Category
//       const [category] = await sequelize.models.Category.findOrCreate({
//         where: { id: item.CategoryId },
//         defaults: { name: item.category_name || "Uncategorized" },
//         transaction,
//       });

//       // Ensure SubCategory
//       const [subCategory] = await sequelize.models.Sub_category.findOrCreate({
//         where: { id: item.SubCategoryId },
//         defaults: {
//           name: item.subcategory_name || "Default Subcategory",
//           CategoryId: category.id,
//         },
//         transaction,
//       });

//       // Create or Update Product
//       await sequelize.models.Product.upsert(
//         {
//           id: item.id,
//           name: item.name,
//           description: item.description || "",
//           is_active: item.is_active || true,
//           cod_enabled: item.cod_enabled || true,
//           product_return: item.product_return || true,
//           return_days: item.return_days || 30,
//           shipping_value: item.shipping_value || 0,
//           enquiry_enabled: item.enquiry_enabled || false,
//           show_price: item.show_price || true,
//           shipping_value_type: item.shipping_value_type || "SHIPPING_PRICE",
//           yt_video_link: item.yt_video_link || null,
//           rating: item.rating || 0,
//           CollectionStaticId: item.CollectionStaticId || null,
//           CategoryId: category.id,
//           SubCategoryId: subCategory.id,
//           ThumbnailId: item.ThumbnailId || null,
//           createdAt: item.createdAt || new Date(),
//           updatedAt: item.updatedAt || new Date(),
//         },
//         { transaction }
//       );
//     }

//     await transaction.commit();
//     return true;
//   } catch (error) {
//     await transaction.rollback();
//     return { error: error.message };
//   }
// };

/***********************Below Is Working Code*********************************************** */

module.exports = async ({ sequelize, fileBuffer }) => {
  const transaction = await sequelize.transaction();
  try {
    // Parse the Excel file
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const productMap = {}; // Track created products by ID
    let product_gallery_body = [];
    let variant_gallery_body = [];
    let variantArray = [];

    for (const row of rows) {
      let product;

      // Create or find the product (if not already created)
      if (!productMap[row.id]) {
        product = await sequelize.models.Product.create(
          {
            id: row.id,
            name: row.name,
            description: row.description || "",
            shipping_value: row.shipping_value || 0,
            shipping_value_type: row.shipping_value_type || "SHIPPING_PRICE",
            CategoryId: row.CategoryId || null,
            CollectionId: row.CollectionId || null,
            is_active: row.is_active || true,
            cod_enabled: row.cod_enabled || true,
            product_return: row.product_return || true,
            enquiry_enabled: row.enquiry_enabled || false,
            show_price: row.show_price || true,
            ThumbnailId: row.ThumbnailId || null,
            rating: row.rating || 0,
            createdAt: row.createdAt || new Date(),
            updatedAt: row.updatedAt || new Date(),
          },
          { transaction }
        );
        productMap[row.id] = product;

        // Add product gallery
        if (row.gallery) {
          const gallery = JSON.parse(row.gallery);
          const productGallery = gallery.map((mediaId) => ({
            MediaId: mediaId,
            ProductId: product.id,
          }));
          product_gallery_body.push(...productGallery);
        }
      } else {
        product = productMap[row.id];
      }

      // Handle variant creation
      const variant = {
        id: row.variant_id || null, // Support optional variant ID
        name: row.variant_name,
        price: row.variant_price,
        premium_price: row.variant_premium_price || null,
        strike_price: row.strike_price || null,
        quantity: row.variant_quantity,
        is_active: row.variant_is_active || true,
        ProductId: product.id,
        ThumbnailId: row.variant_ThumbnailId || null,
        createdAt: row.variant_createdAt || new Date(),
        updatedAt: row.variant_updatedAt || new Date(),
      };
      variantArray.push(variant);

      // Add variant gallery
      if (row.variant_gallery) {
        const gallery = JSON.parse(row.variant_gallery);
        const variantGallery = gallery.map((mediaId) => ({
          MediaId: mediaId,
          VariantId: row.variant_id || null, // Use variant_id from Excel or null
        }));
        variant_gallery_body.push(...variantGallery);
      }
    }

    // Bulk create variants
    const createdVariants = await sequelize.models.Variant.bulkCreate(
      variantArray,
      { transaction, returning: true }
    );

    // Resolve Variant IDs for galleries
    if (variant_gallery_body.length) {
      const variantIdMap = {};
      createdVariants.forEach((variant) => {
        variantIdMap[variant.name] = variant.id;
      });

      variant_gallery_body = variant_gallery_body.map((item) => ({
        ...item,
        VariantId: variantIdMap[item.VariantId] || item.VariantId,
      }));
    }

    // Bulk create product and variant galleries
    if (product_gallery_body.length) {
      await sequelize.models.Product_gallery.bulkCreate(product_gallery_body, {
        transaction,
      });
    }
    if (variant_gallery_body.length) {
      await sequelize.models.Variant_gallery.bulkCreate(variant_gallery_body, {
        transaction,
      });
    }

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    console.error("Error during import:", error);
    return { error: error.message };
  }
};
