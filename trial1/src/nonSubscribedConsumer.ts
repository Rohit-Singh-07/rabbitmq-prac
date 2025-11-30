import amqp from "amqplib";

type RabbitMessage = {
  content: Buffer;
  fields: any;
  properties: any;
};

async function startNonSubscribedConsumer() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();

  const queue = "non_subscribed_user_mail_queue";

  await channel.assertQueue(queue, { durable: true });

  console.log("📥 Non-Subscribed Consumer waiting for messages...");

  channel.consume(
    queue,
    (msg: RabbitMessage | null) => {
      if (!msg) return;

      const payload = JSON.parse(msg.content.toString());
        console.log("📨 Received message for NON-SUBSCRIBED user:", payload);
        
      channel.ack(msg as any);
    },
    { noAck: false }
  );
}

startNonSubscribedConsumer().catch(console.error);
