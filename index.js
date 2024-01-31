require("dotenv").config();
const { Bot, webhookCallback } = require("grammy");
const express = require("express");
const axios = require("axios");

const bot = new Bot(process.env.BOT_TOKEN);

bot.command("start", async (ctx) => {
  await ctx.reply("<i>🤗 <b>Welcome!</b>\nAdd me to any public channel; I'll provide views on new posts.</i>", { parse_mode: "HTML" });
});

bot.command("balance", async (ctx) => {
  axios.get(`${process.env.BASE_URL}?key=${process.env.API_KEY}&action=balance`)
    .then(async (response) => {
      const balance = response.data.balance || 0;
      await ctx.reply(`<code>${parseFloat(balance).toFixed(2)}$</code>`, { parse_mode: "HTML" });
    })
    .catch(async () => {
      await ctx.reply("<i>❌ Unable to fetch balance</i>", { parse_mode: "HTML" });
    });
});

bot.command("order", async (ctx) => {
  if (ctx.update.message.text.split(" ")[1]) {
    axios.get(`${process.env.BASE_URL}?key=${process.env.API_KEY}&action=status&order=${ctx.update.message.text.split(" ")[1]}`)
      .then(async (response) => {
        const data = response.data || 0;
        await ctx.reply(`<code>${JSON.stringify(data)}</code>`, { parse_mode: "HTML" });
      })
      .catch(async () => {
        await ctx.reply("<i>❌ Unable to fetch order</i>", { parse_mode: "HTML" });
      });
  }
});

bot.on("channel_post", async (ctx) => {
  try {
    let postLink = "https://t.me/Rocoproc/5";
    if (ctx.channelPost.sender_chat.username === undefined) {
      const { message_id } = await ctx.api.forwardMessage(`@${process.env.CHANNEL}`, ctx.channelPost.sender_chat.id, ctx.channelPost.message_id);
      postLink = `https://t.me/${process.env.CHANNEL}/${message_id}`;
    } else {
      postLink = `https://t.me/${ctx.channelPost.sender_chat.username}/${ctx.channelPost.message_id}`;
    }
    const response = await axios.get(`${process.env.BASE_URL}?key=${process.env.API_KEY}&action=add&service=${process.env.SERVICE_ID}&link=${postLink}&quantity=${process.env.VIEW_COUNT}`);
    console.log(response.data);
    console.log(postLink);
  } catch (error) {
    console.log(error);
  }
});

if (process.env.NODE_ENV === "DEVELOPMENT") {
  bot.start({
    drop_pending_updates: true,
    onStart: console.log("Bot Started...")
  });
} else {
  const port = process.env.PORT || 3000;
  const app = express();
  app.use(express.json());
  app.use(`/${bot.token}`, webhookCallback(bot, "express"));
  app.listen(port, () => console.log(`listening on port ${port}`));
}