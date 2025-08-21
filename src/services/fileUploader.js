const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto')



const storage = multer.diskStorage({
    destination: 'public/uploads',
    filename: (req, file, cb) => {

        originalname = file.originalname.split(" ").join("_")
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const extname = path.extname(originalname);
        const filename = `${originalname}-${uniqueSuffix}${extname}`;
        cb(null, filename);
    },
});

const upload = multer({ storage: storage });

module.exports = upload;