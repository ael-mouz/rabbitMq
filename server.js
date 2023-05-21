const express = require('express');
const amqp = require('amqplib');
const app = express();
const port = 1515;

app.use(express.json());

async function publishMessage(message) {
    try {
        const connection = await amqp.connect('amqp://localhost:5672');
        const channel = await connection.createChannel();
        await channel.assertQueue('test_queue', { durable: false });
        await channel.sendToQueue('test_queue', Buffer.from(JSON.stringify(message)));
        console.log(`Message published: ${JSON.stringify(message)}`);
        channel.close();
        connection.close();
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        process.exit(1);
    }
}

async function consumeMessages() {
    try {
        const connection = await amqp.connect('amqp://localhost:5672');
        const channel = await connection.createChannel();
        await channel.assertQueue('test_queue', { durable: false });
        console.log('Waiting for messages...');
        await channel.consume('test_queue', (msg) => {
            const message = JSON.parse(msg.content.toString());
            console.log('Received message:', message);
            channel.ack(msg);
        });
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        process.exit(1);
    }
}

publishMessage({ text: 'Hello, RabbitMQ!' });
consumeMessages();

function errorHandler(err, req, res, next) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
}

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
