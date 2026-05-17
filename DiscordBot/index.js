require("dotenv").config();
import { Attachment } from "./node_modules/discord.js/typings/index.d";
const { Client, GatewayIntentBits, AttachmentBuilder } = require("discord.js");
const { GoogleGenAI } = require("@google/genai");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

async function generateImage(prompt) {
  const response = await ai.models.generateContent({
    models: "gemini-2.0-flash-image-preview",
    contents: prompt,
  });
}

client.once("ready", () => {
  console.log("Bot is ready!");
});

client.on("messageCreate", async (message) => {
  // console.log(message.member);
  const isBot = message.author.bot;
  if (isBot) return;

  const imageBuffer = await generateImage(message.content);

  if (imageBuffer) {
    const attachment = new AttachmentBuilder(imageBuffer, {
      name: "generated_image.png",
    });
    message.channel.send({ files: [attachment] });
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
