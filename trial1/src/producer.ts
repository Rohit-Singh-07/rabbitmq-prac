import amqp from "amqplib";

async function sendMail() {
  let connection = await amqp.connect("amqp://localhost"); 
  const channel = await connection.createChannel(); 

  const exchange = "mail_exchange";
  const routingKey = "send_mail";
  const queue = "mail_queue";

  const message = {
    to: "example@gmail.com",
    from: "rs144506@gmail.com",
    subject: "trial mail",
    body: "Hellooooo",
  };

  await channel.assertExchange(exchange, "direct", { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, routingKey);

  channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));
  console.log("Mail data was sent:", message);

  await channel.close();
  await connection.close();
}

sendMail().catch(console.error);
