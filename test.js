const { Sequelize, Op } = require('sequelize');
const dbConfig = require('./config/db.config');
const mainDbRelation = require('./src/utils/mainDbRelation');
const relation = require('./src/utils/relation');

const { exec } = require('child_process');


async function getDUMPData() {
    const mainDb = {};
    const sequelize = new Sequelize(dbConfig);
    mainDb.sequelize = await mainDbRelation(sequelize);
    const mainSequelize = mainDb.sequelize;
    const users = await mainSequelize.models.User.findAll({ include: ["tenant_metric"] });
    for (const user of users) {
        if (!user.tenant_metric) {
            await mainSequelize.models.Tenant_metric.create({ UserId: user.id })
        }

    }
    console.log("updated rolled out!")
    exec('pm2 stop 9', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`Command stderr: ${stderr}`);
            return;
        }

        console.log(`Command output:\n${stdout}`);
    });
}
getDUMPData();