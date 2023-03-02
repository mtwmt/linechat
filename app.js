require('dotenv').config();

const express = require('express');
const line = require('@line/bot-sdk');
const { Configuration, OpenAIApi } = require('openai');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = new line.Client(config);
const openai = new OpenAIApi(configuration);

const app = express();

app.get('/', (req, res) => {
  res.send(
    `access token: ${config.channelAccessToken}, secret: ${config.channelSecret}`
  );
});

app.post('/callback', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => {
      return res.json(result)
    })
    .catch((error) => {
      console.error('🚀 ~ app.post ~ error', error);
      res.status(500).end();
    });
});

const handleEvent = async (e) => {
  // ignore none message or text
  if (
    e.type !== 'message' ||
    e.message.type !== 'text' ||
    !(/^安安.*/).test(e.message.text)
  )
    return Promise.resolve(null);

  // ai model render text
  const completion = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: e.message.text,
    max_tokens: 500,
  });

  //create a echoing text message
  const echo = { type: 'text', text: completion.data.choices[0].text.trim() };

  // use reply api
  return client.replyMessage(e.replyToken, echo);
};

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`listening app: ${port}`);
});
