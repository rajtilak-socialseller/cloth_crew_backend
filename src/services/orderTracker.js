module.exports = async ({ sequelize, transaction, order_variant_ids = [], status }) => {
    try {
        let array = order_variant_ids.map((id) => {
            return {
                OrderVariantId: id,
                status: status
            }
        })
        const order_status_tracker = await sequelize.models.Order_status_tracker.bulkCreate(array, { transaction: transaction })
    } catch (error) {
        //console.log(error)
    }
}
