require("dotenv").config();

const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const FLOWISE_API = process.env.FLOWISE_API;

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WEBHOOK VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  console.log("WEBHOOK HIT");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const messaging = entry?.messaging?.[0];

    const senderId = messaging?.sender?.id;
    const message = messaging?.message?.text;

    console.log("Sender ID:", senderId);
    console.log("Message:", message);

    if (message) {

      console.log("Sending to Flowise...");

      const aiResponse = await axios.post(
        FLOWISE_API,
        {
          question: message
        }
      );

      console.log("Flowise response:", aiResponse.data);

      const reply =
        aiResponse.data.text || "Sorry, no response.";

      console.log("Reply:", reply);

      console.log("Sending reply to Facebook...");

      const fbResponse = await axios.post(
        `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
        {
          recipient: {
            id: senderId
          },
          message: {
            text: reply
          }
        }
      );

      console.log("Facebook response:", fbResponse.data);
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("ERROR:");
    console.error(err.response?.data || err.message);

    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});