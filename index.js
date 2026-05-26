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

      // Send to Flowise
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

      // Reply to Facebook
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