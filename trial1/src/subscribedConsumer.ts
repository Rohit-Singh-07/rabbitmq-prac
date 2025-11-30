import amqp from "amqplib";

type RabbitMessage = {
  content: Buffer;
  fields: any;
  properties: any;
};

async function startConsumer() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();

  const queue = "subscribed_user_mail_queue";

  await channel.assertQueue(queue, { durable: true });

  console.log("Waiting for messages...");

  channel.consume(
    queue,
    (msg: RabbitMessage | null) => {
      if (!msg) return;

      const payload = JSON.parse(msg.content.toString());
      console.log("Received message:", payload);

      channel.ack(msg as any);
    },
    { noAck: false }
  );
}

startConsumer().catch(console.error);
