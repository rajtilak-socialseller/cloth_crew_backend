const { Op } = require("sequelize")
const permissionList = require("../constants/permission.list")
const prefildata = require("../constants/prefildata")

/**
 * @param {Object} Object
 * @param {import("sequelize").Sequelize} Object.sequelize The Sequelize instance.
 * @param {import("sequelize").Transaction}Object.transaction
 * @param {Object}Object.body
 * @param {string}Object.personal_token
 * @returns {boolean} Returns Boolean.
 */
module.exports = async ({ sequelize, transaction, body, personal_token }) => {
    try {
        const products = [];
        for (const item of prefildata.categories) {
            const categoryThumbnail = await sequelize.models.Media.create({ name: "name", url: item.thumbnail }, { transaction: transaction })
            const category = await sequelize.models.Category.create({ name: item.name, ThumbnailId: categoryThumbnail.id }, { transaction: transaction })
            // products 
            for (const product of item.products) {
                const productThumbnail = await sequelize.models.Media.create({ name: "anme", url: product.thumbnail }, { transaction: transaction })
                const newProduct = await sequelize.models.Product.create({
                    "cod_enabled": product.cod_enabled,
                    "description": product.description,
                    "enquiry_enabled": product.enquiry_enabled,
                    "is_active": product.is_active,
                    "name": product.name,
                    "product_return": product.product_return,
                    "shipping_value": product.shipping_value,
                    "shipping_value_type": product.shipping_value_type,
                    "show_price": product.show_price,
                    "ThumbnailId": productThumbnail.id,
                    "CategoryId": category.id
                }, { transaction: transaction })
                products.push(newProduct.id)
                const product_metric = await sequelize.models.Product_metric.create({ ProductId: newProduct.id }, { transaction: transaction })

                // product gallery
                for (const galleryItem of product.gallery) {
                    const GalleryMedia = await sequelize.models.Media.create({
                        name: "name", url: galleryItem
                    }, { transaction: transaction })

                    const productGallery = await sequelize.models.Product_gallery.create({
                        MediaId: GalleryMedia.id,
                        ProductId: newProduct.id
                    }, { transaction: transaction })
                }
                const variants = await sequelize.models.Variant.bulkCreate(product.variants.map((v) => {
                    return { ...v, ProductId: newProduct.id }
                }), { transaction: transaction, })
            }
        }
        for (const item of prefildata.banners) {
            const MediaDesktop = await sequelize.models.Media.create({
                name: "name", url: item.image
            }, { transaction: transaction });
            const MediaModile = await sequelize.models.Media.create({
                name: "name", url: item.image_mobile
            }, { transaction: transaction })

            const banner = await sequelize.models.Banner.create({
                action: "COLLECTION",
                data: "1",
                type: item.type,
                "MobileThumbnailId": MediaModile.id,
                "DesktopThumbnailId": MediaDesktop.id
            }, { transaction: transaction })
        }
        for (const collection of prefildata.collections) {
            await sequelize.models.Collection.create({
                name: collection.name,
            })
        }
        // Roles and permissions
        const ConumerRole = await sequelize.models.Role.findOne({ where: { name: "Consumer" }, transaction: transaction })

        const consumersPermissionlist = permissionList.Consumer;
        const consumerPermissions = await sequelize.models.Permission.findAll({
            where: { handler: { [Op.in]: consumersPermissionlist } },
            transaction: transaction
        })

        const array = consumerPermissions.map((item) => {
            return { PermissionId: item.dataValues.id, RoleId: ConumerRole.dataValues.id }
        })
        const ConsumerPermissions = await sequelize.models.Role_permission.bulkCreate(array, { updateOnDuplicate: ["RoleId", "PermissionId"], transaction: transaction })

        const media = await sequelize.models.Media.create({
            name: "brand-logo",
            url: body.logo
        }, { transaction: transaction })

        // global and setting 
        const storeGlobal = await sequelize.models.Global_brand.create({
            store_type: body.store_type,
            name: body.brand_name,
            tagline: body.tag_line,
            calling_number: body.calling_number,
            whatsapp_number: body.whatsapp_number,
            address: body.address,
            youtube: body.youtube,
            instagram: body.instagram,
            youtube: body.youtube,
            facebook: body.facebook,
            telegram: body.telegram,
            LogoIdDark: media.id,
            LogoIdLight: media.id,
            FavIconId: media.id,
            email: body.email,
            address: body.address
        }, { transaction: transaction });

        const storeGlobalBrand = await sequelize.models.Store_global.create({
            personal_id: personal_token,
            store_link: `https://${body.subdomain}.socialseller.in`
        }, { transaction: transaction })

        const storeSetting = await sequelize.models.Store_setting.create({
            store_type: body.store_type,
            bg_color: "#222222"
        }, { transaction: transaction });

        for (const item of prefildata.marquees) {
            const marName = item.split("/")[item.split("/").length - 1].split(".")[0] || "untitled"
            const marqueeMedia = await sequelize.models.Media.create({
                url: item,
                name: marName
            }, { transaction: transaction })
            const marqueess = await sequelize.models.Marquee.create({
                name: marName,
                active: true,
                ImageId: marqueeMedia.id
            }, { transaction: transaction })
        }

        for (const item of prefildata.stories) {
            const storyMedia = await sequelize.models.Media.create({
                name: "untitled",
                url: item
            }, { transaction: transaction })

            const story = await sequelize.models.Story.create({
                VideoId: storyMedia.id
            }, { transaction: transaction })

            await sequelize.models.StoryProduct.create({ StoryId: story.id, ProductId: products[0] }, { transaction: transaction })

        }

        const promotional_message = await sequelize.models.Promotional_message.create({
            title: "Flat 10% off on new collections",
            is_active: true
        })

        for (const item of prefildata.testimonials) {
            const testiMedia = await sequelize.models.Media.create({
                name: "untitled",
                url: item.image
            })
            const testimonial = await sequelize.models.Testimonial.create({
                name: item.name,
                content: item.content,
                ThumbnailId: testiMedia.id,
                rating: item.rating
            })
        }


        return true
    } catch (error) {
        //console.log(error)
        return false
    }
}