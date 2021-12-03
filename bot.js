require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const bot = new TelegramBot(process.env.TG_TOKEN, { polling: true });

bot.setMyCommands([
  { command: "/start", description: "Приветствие" },
  { command: "/info", description: "Что я могу?" },
]);
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  console.log(
    `First name: |${msg.from.first_name}|; last name: |${msg.from.last_name}|; id: |${msg.from.id}|; username: |${msg.from.username}|   пишет: |${text}|`
  );
  if (text === "/start") {
    await bot.sendMessage(
      chatId,
      `Добрый день, ${msg.from.first_name}! Я помогу тебе перевести голосовое сообщение в текст,если что-то непонятно нажимай /info`
    );
  } else if (text === "/info") {
    await bot.sendMessage(
      chatId,
      "Я могу распознать речь на русском языке и преобразовать её в текст."
    );
  } else if (text) {
    bot.sendMessage(chatId, "Я не настроен на восприятие текстовых сообщений");
  }
});

bot.on("voice", async (msg) => {
  const stream = bot.getFileStream(msg.voice.file_id);
  let chunks = [];
  stream.on("data", (chunk) => chunks.push(chunk));
  stream.on("end", async () => {
    const axiosConfig = {
      method: "POST",
      url: "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize",
      headers: {
        Authorization: `Api-Key ${process.env.API_YA_KEY}`,
      },
      data: Buffer.concat(chunks),
    };
    try {
      const response = await axios(axiosConfig);
      const { result } = response.data;
      const chatId = msg.chat.id;
      if (msg.hasOwnProperty("forward_from")) {
        console.log(
          `First name: |${msg?.forward_from?.first_name}|; last name: |${msg?.forward_from?.last_name}|; id: |${msg?.forward_from?.id}|; username: |${msg?.forward_from?.username}| говорит: |${result}|`
        );
        bot.sendMessage(
          chatId,
          `${msg.forvard_from?.first_name} ${msg.forvard_from?.last_name} говорит:\n${result}`
        );
      } else {
        console.log(
          `First name: |${msg.from.first_name}|; last name: |${msg.from.last_name}|; id: |${msg.from.id}|; username: |${msg.from.username}| говорит: |${result}|`
        );
        bot.sendMessage(
          chatId,
          `${msg.from?.first_name} ${msg.from?.last_name} говорит:\n${result}`
        );
      }
    } catch (error) {
      console.log("Error:", error);
    }
  });
});
