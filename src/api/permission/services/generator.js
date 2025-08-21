
const fs = require("fs").promises
const path = require('path')

/**
 * 
 * @returns {Array<{api:string,endpoint:string,method: string,handler: string}>}
 * 
 */
module.exports = async () => {
    try {
        const readPermissions = async (filePath) => {
            try {
                const fullPath = path.resolve(filePath);
                const module = require(fullPath);
                return module.permissions ? module.permissions : undefined;
            } catch (error) {
                console.error(`Error reading permissions from file ${filePath}: ${error.message}`);
                return null;
            }
        };

        const readApiPermissions = async (apiDirectory) => {
            let permissions;
            const files = await fs.readdir(apiDirectory);
            for (const file of files) {
                const filePath = path.join(apiDirectory, file);
                const stats = await fs.stat(filePath);
                if (stats.isFile() && path.extname(file) === '.js') {
                    const filePermissions = await readPermissions(filePath);
                    if (filePermissions) {
                        permissions = filePermissions;
                    }
                }
            }
            return permissions;
        };

        const apiDirectory = path.resolve('./src/api');
        // //console.log(2, apiDirectory);
        const apiFolders = await fs.readdir(apiDirectory);
        const allApiPermissions = await Promise.all(
            apiFolders.flatMap(apiFolder => readApiPermissions(path.join(apiDirectory, apiFolder, 'routes')))
        );

        let filteredArray = allApiPermissions.filter(item => item !== undefined).flatMap(apiArray => apiArray.map(apiObject => apiObject))
        return filteredArray

    } catch (error) {
        console.log(error);
        return { error };
    }
};