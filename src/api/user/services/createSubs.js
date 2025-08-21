const date = require("../../../services/date")
const { generateOrderId, generateTransactionId } = require("../../order/services/orderId")

module.exports = async ({ sequelize, store_sequelize, PlanId, transaction, store_transaction, UserId, StoreUserId }) => {
    try {
        let plan;
        if (!PlanId) {
            //console.log('Trial Plan Given')
            plan = await sequelize.models.Plan.findOne({ where: { name: "Trial" }, raw: true })
        } else {
            //console.log('Paid Plan Given')
            plan = await sequelize.models.Plan.findByPk(PlanId, { raw: true })
        }

        let today = date.getDate()
        let valid_date = date.getValidToDates(30)
        const S_subscription = await sequelize.models.Server_subscription.create({
            "amount": 0,
            "order_id": generateOrderId("ORD"),
            "payment_id": generateTransactionId("PAY"),
            "purchaseType": "CASH",
            "valid_from": today,
            "valid_to": valid_date,
            "is_paid": true,
            "status": "ACTIVE",
            // "PlanId": PlanId,
            UserId
        }, { transaction: transaction, raw: true })
        delete S_subscription.dataValues.id
        S_subscription.dataValues.StoreUserId = StoreUserId
        await store_sequelize.models.Store_server_subscription.create(S_subscription.dataValues, { transaction: store_transaction })

    } catch (error) {
        //console.log(error)
        return error
    }
}