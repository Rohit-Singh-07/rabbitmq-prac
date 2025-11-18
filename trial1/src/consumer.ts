import amqp from "amqplib";

async function receiveMail() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();

  const queue = "mail_queue";
  await channel.assertQueue(queue, { durable: true });

  console.log("Waiting for mail messages...");

  channel.consume(queue, (msg: { content: Buffer } | null) => {
  if (msg) {
    const content = JSON.parse(msg.content.toString());
    console.log("Received mail:", content);
    channel.ack(msg);
  }
});
}

receiveMail().catch(console.error);
