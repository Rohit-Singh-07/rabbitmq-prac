import amqp from "amqplib";

interface MailMessage {
  to: string;
  from: string;
  subject: string;
  body: string;
}

const CONFIG = {
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost",

  EXCHANGE: "mail_exchange",
  ROUTING_KEYS: {
    SUBSCRIBED: "send_mail_subscribers",
    NON_SUBSCRIBED: "send_mail_non_subscribers",
  },
  QUEUES: {
    SUBSCRIBED: "subscribed_user_mail_queue",
    NON_SUBSCRIBED: "non_subscribed_user_mail_queue",
  },
};

function toBuffer(data: unknown) {
  return Buffer.from(JSON.stringify(data), "utf8");
}

function validateMessage(msg: MailMessage): void {
  if (!msg.to || !msg.from || !msg.subject || !msg.body) {
    throw new Error("Invalid mail payload");
  }
}

// Retry RabbitMQ connection
async function connectWithRetry(retries = 5, delay = 2000) {
  while (retries) {
    try {
      console.log("Connecting to RabbitMQ...");
      return await amqp.connect(CONFIG.RABBITMQ_URL);
    } catch (err) {
      retries -= 1;
      console.error(`Connection failed. Retries left: ${retries}`);
      if (!retries) throw err;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

async function sendMail() {
  const message = {
    to: "example@gmail.com",
    from: "rs144506@gmail.com",
    subject: "Trial Mail",
    body: "Hellooooo",
  };

  validateMessage(message);

  let connection;
  let channel;

  try {
    // Connect with retry logic
    connection = await connectWithRetry();

    // Use confirm channel (guaranteed delivery)
    channel = await connection.createConfirmChannel();

    // Setup Exchange & Queues
    await channel.assertExchange(CONFIG.EXCHANGE, "direct", { durable: true });

    // Subscribed queue
    await channel.assertQueue(CONFIG.QUEUES.SUBSCRIBED, { durable: true });
    await channel.bindQueue(
      CONFIG.QUEUES.SUBSCRIBED,
      CONFIG.EXCHANGE,
      CONFIG.ROUTING_KEYS.SUBSCRIBED
    );

    // Non-subscribed queue
    await channel.assertQueue(CONFIG.QUEUES.NON_SUBSCRIBED, { durable: true });
    await channel.bindQueue(
      CONFIG.QUEUES.NON_SUBSCRIBED,
      CONFIG.EXCHANGE,
      CONFIG.ROUTING_KEYS.NON_SUBSCRIBED
    );

    // Publish Message (choose routing key)
    const routingKey = CONFIG.ROUTING_KEYS.SUBSCRIBED;

    channel.publish(CONFIG.EXCHANGE, routingKey, toBuffer(message), {
      persistent: true,
    });

    // Confirm publish to guarantee delivery
    await channel.waitForConfirms();

    console.log("Mail message published successfully:", message);
  } catch (error) {
    console.error("Error sending mail:", error);
  } finally {
    // Clean shutdown
    try {
      if (channel) await channel.close();
      if (connection) await connection.close();
    } catch (closeErr) {
      console.error("Error closing connection:", closeErr);
    }
  }
}

sendMail();
