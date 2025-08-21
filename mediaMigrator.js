const axios =require("axios");
const { Upload } = require( "@aws-sdk/lib-storage");
const { S3Client } = require( "@aws-sdk/client-s3");
const  dotenv  = require("dotenv")
dotenv.config()
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;
const region = process.env.S3_REGION;
const Bucket = process.env.S3_BUCKET;
const { Sequelize, Op } = require('sequelize');

const relation = require('./src/utils/relation');
async function migrate() {
    const sequelize = new Sequelize({
        dialect: "postgres",
        host: "localhost",
        port: 5432,
        username: "dhyani",
        password: "12345678",
        database: "dhyani",
    });
    const tenantSequelize = await relation(sequelize);
    const medias = await tenantSequelize.models.Media.findAll();
    for (const item of medias) {
        console.count()
        const thumbnail = await axios.get(item.url, { responseType: "arraybuffer" })
        const filesToUpload = await new Upload({
            client: new S3Client({
                credentials: {
                    accessKeyId,
                    secretAccessKey
                },
                region
            }),
            params: {
                ACL: 'public-read',
                Bucket,
                Key: item.url.split("/")[item.url.split("/").length-1].split("?")[0],
                Body: Buffer.from(thumbnail.data)
            },
        }).done()

        // item.url = filesToUpload.Location
        // await item.save();
        console.log(filesToUpload.Location())
    }

    console.log("Image Migrated!")
    return "Ok";

}
migrate()