#!/usr/bin/env node
const program = require("commander");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const rimraf = require("rimraf"); // Import the 'rimraf' package

// to create api folders
program
  .command("generate")
  .description("Generate model-related folders and files")
  .action(async () => {
    const { modelName, fields } = await promptForModelInfo();
    generateModelFiles(modelName, fields);
    generateControllerFile(modelName, fields);
    generateMiddlewareFile(modelName, fields);
    generateRouteFile(modelName, fields);
  });
// to remove api
program
  .command("remove <modelName>")
  .description("Remove model-related folders and files")
  .action((modelName) => {
    removeModelFiles(modelName);
  });

program.parse(process.argv);

async function promptForModelInfo() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const modelName = await new Promise((resolve) => {
    rl.question("Enter the model name: ", (answer) => {
      resolve(answer);
    });
  });

  const fields = await new Promise((resolve) => {
    rl.question("Enter model fields (key:value format, e.g., name:string): ", (answer) => {
      const fieldArray = answer.split(",").map((field) => {
        const [key, value] = field.trim().split(":");
        return { key, value };
      });
      resolve(fieldArray);
    });
  });

  rl.close();

  return { modelName, fields };
}

function generateModelFileContent(modelName, fields) {
  return `
    const { DataTypes } = require('sequelize');

    module.exports = (sequelize) => {
        // Define the Post model using the provided Sequelize instance
        const ${modelName} = sequelize.define("${modelName}", {
            ${fields
      .map(
        (field) => `  ${field.key}: {
                type: DataTypes.${field.value.toUpperCase()},
                  },`
      )
      .join("\n")}
            });
    
        // Define associations or additional methods as needed
    
       
        return ${modelName};
    };
`;
}

function generateControllerFileContent(modelName) {
  // Define the controller template here
  return `
    const { getPagination, getMeta } = require("../../../services/pagination");

    // Controller function to create a new post
    /**
     * 
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     */

    const { errorResponse } = require("../../../services/errorResponse");
    
    exports.create = async (req, res) => {
        try {
    
            const sequelize = req.db;
            const ${modelName} = await sequelize.models.${modelName}.create(req.body);
           return res.status(200).send(${modelName})
        } catch (error) {
            console.log(error);
           return res.status(500).send({ error: 'Failed to create a ${modelName}' });
        }
    };
    /**
     * 
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     */
    // Controller function to get all posts
    exports.find = async (req, res) => {
        try {
            const sequelize = req.db;
            const query = req.query;
            const pagination = await getPagination(query.pagination)
            const ${modelName}s = await sequelize.models.${modelName}.findAndCountAll({
                offset: pagination.offset,
                limit: pagination.limit
            });
            const meta = await getMeta(pagination, ${modelName}s.count)
            return res.status(200).send({ data: ${modelName}s.rows, meta });
        } catch (error) {
            console.log(error);
           return res.status(500).send({ error: 'Failed to fetch ${modelName}s' });
        }
    };
    /**
     * 
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     */
    exports.findOne = async (req, res) => {
        try {
            const sequelize = req.db;
            const { id } = req.params
            const ${modelName} = await sequelize.models.${modelName}.findByPk(id);
            if (!${modelName}) {
                return res.status(400).send(errorResponse({message:"Invalid ID"}))
            }
                return res.status(200).send(${modelName})
        } catch (error) {
            console.log(error);
           return res.status(500).send({ error: 'Failed to fetch ${modelName}' });
        }
    };
    /**
     * 
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     */
    
    exports.update = async (req, res) => {
        try {
            const sequelize = req.db;
            const { id } = req.params
            const get${modelName} = await sequelize.models.${modelName}.findByPk(id)
            
            if (!get${modelName}) {
                return res.status(400).send(errorResponse({message:"Invalid ID"}))
            }            
            const ${modelName} = await sequelize.models.${modelName}.update(req.body, { where: { id },returning:true });
            return res.status(200).send({message:"${modelName} updated",data:${modelName}[1][0]})
        } catch (error) {
            console.log(error);
            return res.status(500).send({ error: 'Failed to fetch ${modelName}' });
        }
    };
    /**
     * 
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     */
    
    exports.delete = async (req, res) => {
        try {
            const sequelize = req.db;
            const { id } = req.params
            const get${modelName} = await sequelize.models.${modelName}.findByPk(id)

            if (get${modelName}) {
                return res.status(400).send(errorResponse({message:"Invalid ID"}))
            } 
            const ${modelName} = await sequelize.models.${modelName}.destroy({ where: { id } });
            return res.status(200).send({message:"${modelName} deleted!"})
        } catch (error) {
            console.log(error);
            res.status(500).send({ error: 'Failed to fetch ${modelName}' });
        }
    };

`;
}

function generateMiddlewareFileContent(modelName, fields) {
  // Define the middleware template here
  return `
// Middleware for ${modelName}
// Customize the middleware code here

/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 */

// write code below


const Joi = require("joi")

module.exports = {
        async validateRequest(req, res, next) {

            function validate(body) {
                const JoiSchema = Joi.object({
                    ${fields.map((field) => `"${field.key}": Joi.${field.value}(),`).join("\n")}
                });

            return JoiSchema.validate(body);
        }
  
      let result = validate(req.body);
        if(result.error) {
        return res.status(400).send(errorResponse({
            message: result.error.message,
            details: result.error.details
        }));
    } else {
        await next(); // Corrected the square brackets to curly braces
    }
}
}
`;
}

function generateRouteFileContent(modelName) {
  // Define the route template here
  return `
    // src/api/post/postRoutes.js
    const router = require('express').Router();
    const ${modelName}Controller = require('../controllers/${modelName}');
    
    // Define routes for the "Post" resource
    module.exports = (app) => {
        router.post('/', ${modelName}Controller.create);
        router.get('/', ${modelName}Controller.find);
        router.get('/:id', ${modelName}Controller.findOne);
        router.put('/:id', ${modelName}Controller.update);
        router.delete('/:id', ${modelName}Controller.delete);
        app.use('/api/${modelName}s', router)
    }
 `;
}

function generateModelFiles(modelName, fields) {
  const apiDirectory = path.join(__dirname, "src", "api", modelName);
  const modelsDirectory = path.join(apiDirectory, "models");
  fs.mkdirSync(modelsDirectory, { recursive: true });

  // Create model file
  const modelFileContent = generateModelFileContent(modelName, fields);
  const modelFilePath = path.join(modelsDirectory, `${modelName}.js`);
  fs.writeFileSync(modelFilePath, modelFileContent);
}

function generateControllerFile(modelName, fields) {
  const apiDirectory = path.join(__dirname, "src", "api", modelName);
  const controllersDirectory = path.join(apiDirectory, "controllers");
  fs.mkdirSync(controllersDirectory, { recursive: true });

  // Create controller file
  const controllerFileContent = generateControllerFileContent(modelName);
  const controllerFilePath = path.join(controllersDirectory, `${modelName}.js`);
  fs.writeFileSync(controllerFilePath, controllerFileContent);
}

function generateMiddlewareFile(modelName, fields) {
  const apiDirectory = path.join(__dirname, "src", "api", modelName);
  const middlewaresDirectory = path.join(apiDirectory, "middlewares");
  fs.mkdirSync(middlewaresDirectory, { recursive: true });

  // Create middleware file
  const middlewareFileContent = generateMiddlewareFileContent(modelName, fields);
  const middlewareFilePath = path.join(middlewaresDirectory, `${modelName}.js`);
  fs.writeFileSync(middlewareFilePath, middlewareFileContent);
}

function generateRouteFile(modelName, fields) {
  const apiDirectory = path.join(__dirname, "src", "api", modelName);
  const routesDirectory = path.join(apiDirectory, "routes");
  fs.mkdirSync(routesDirectory, { recursive: true });

  // Create route file
  const routeFileContent = generateRouteFileContent(modelName);
  const routeFilePath = path.join(routesDirectory, `${modelName}.js`);
  fs.writeFileSync(routeFilePath, routeFileContent);
}

// remove files functinality
function removeModelFiles(modelName) {
  const apiDirectory = path.join(__dirname, "src", "api", modelName);

  // Check if the API directory exists
  if (fs.existsSync(apiDirectory)) {
    // Use the 'rimraf' package to remove the entire directory and its contents
    rimraf.sync(apiDirectory);
    //console.log(`Model "${modelName}" and its associated files have been removed.`);
  } else {
    //console.log(`Model "${modelName}" does not exist.`);
  }
}
