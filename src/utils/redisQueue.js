
const Bull = require('bull');
const { subscriptionExpireNotify } = require('../services/notification');

const queue = new Bull('message_queue', {
    redis: { port: 6379, host: '127.0.0.1' } // Adjust if your Redis configuration is different
});

async function publishPhoneNumbers(users) {
    for (const user of users) {
        await queue.add(user);
        console.log(` [x] Sent ${user.phone}`);
    }
}

// Call handleQueue once to start the consumer
function handleQueue() {
    queue.process(async (job, done) => {
        const user = job.data;
        console.log(`[x] Received ${JSON.stringify(user)}`);
        try {
            const data = {
                containsImage: true,
                hasButton: false,
                phoneNumber: user.phone,
                body: [user.username],
                image: "https://mtlapi.socialseller.in/public/uploads/expired_template_message.png",
            };
            await subscriptionExpireNotify(data);
            console.log(`[x] Message sent to ${user.username}`);
            done();
        } catch (error) {
            console.error(` [x] Failed to send message to ${user.phone}:`, error);
            done(new Error(`Failed to send message to ${user.phone}`));
        }
    });
}

// Initialize the consumer
handleQueue();


module.exports = { publishPhoneNumbers };
