const client = require('./src/utils/dbCache'); // Adjust the path accordingly

(async () => {
    try {
        // Ensure the client is connected
        if (client.isOpen) {
            // Set a value in Redis
            await client.set('testKey', 'testValue');
            console.log('Value set successfully');

            // Get the value from Redis
            const value = await client.get('testKey');
            console.log('Value retrieved:', value);

            // Optionally, delete the key
            await client.del('testKey');
            console.log('Key deleted');
        } else {
            console.log('Redis client is not connected.');
        }
    } catch (err) {
        console.error('Error with Redis operations:', err);
    } finally {
        await client.quit(); // Ensure to close connection
    }
})();