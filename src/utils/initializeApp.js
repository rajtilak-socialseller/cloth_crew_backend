/**
 * 
 * @param {import("sequelize").Sequelize} sequelize 
 */
module.exports = async (sequelize) => {
    const hasPass = await hash("admin@123")
    await sequelize.models.User.findOrCreate({
        where: {
            "username": "admin",
            "email": "admin@gmail.com"
        },
        defaults: {
            "password": hasPass,
            "name": "Admin"
        }
    })

    // roles 

    const roles = await sequelize.models.Role.bulkCreate(role, { updateOnDuplicate: ["name"] })
    const SuperAdminRole = roles.find((item) => item.name === "Super_Admin")
    const ConumerRole = roles.find((item) => item.name === "Consumer")
    SuperAdmin[0].RoleId = SuperAdminRole?.id
    await SuperAdmin[0].save();

    // assign persmission to Super Admin
    const allPermissions = await Permission.findAll({ attributes: ["id"] })
    const allPermissionArray = allPermissions.map((item) => {
        return {
            RoleId: SuperAdminRole.id,
            PermissionId: item.id
        }
    })
    const consumersPermissionlist = permission_list.Consumer;
    const consumerPermissions = await Permission.findAll({ where: { handler: { [Op.in]: consumersPermissionlist } } })

    const superadminPermission = await Role_permission.bulkCreate(allPermissionArray, { updateOnDuplicate: ["RoleId", "PermissionId"] })
    const ConsumerPermissions = await Role_permission.bulkCreate(consumerPermissions.map((item) => {
        return { PermissionId: item.id, RoleId: ConumerRole.id }
    }), { updateOnDuplicate: ["RoleId", "PermissionId"] })
    return true


}