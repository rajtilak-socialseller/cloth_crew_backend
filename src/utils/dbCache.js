const nodeCache = require("node-cache");
const dbCache = new nodeCache({ stdTTL: 36000 });
// const { createClient } = require('@redis/client');

// const client = createClient({ socket: { port: 6379, host: "127.0.0.1" } });

// (async () => {
//     await client.connect();
// })();

// module.exports = client;
module.exports = dbCache;
