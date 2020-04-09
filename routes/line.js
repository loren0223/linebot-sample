"use strict";
require("dotenv").config();

const express = require("express");
const router = express.Router();

const line = require("@line/bot-sdk");
const fs = require("fs");
const path = require("path");
const querystring = require("querystring");
const request = require("request");

const baseURL = process.env["BASE_URL"];
const lineImgURL = "https://d.line-scdn.net/n/line_lp/img/ogimage.png";

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

// handle GET request
router.get("/", (req, res) =>
  res.end(`I'm listening. Please access with POST.`)
);

// register a webhook handler with middleware
// about the middleware, please refer to doc
router.post("/", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
function handleEvent(event) {
  if (event.replyToken && event.replyToken.match(/^(.)\1*$/)) {
    return console.log("Test hook recieved: " + JSON.stringify(event.message));
  }
  console.log(`User ID: ${event.source.userId}`);

  switch (event.type) {
    case "message":
      const message = event.message;
      switch (message.type) {
        case "text":
          return handleText(message, event.replyToken, event.source);
        case "image":
          return handleImage(message, event.replyToken);
        case "video":
          return handleVideo(message, event.replyToken);
        case "audio":
          return handleAudio(message, event.replyToken);
        case "location":
          return handleLocation(message, event.replyToken, event.source);
        case "sticker":
          return handleSticker(message, event.replyToken);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }

    case "follow":
      console.log(`Followed this bot: ${JSON.stringify(event)}`);
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "Got followed event",
      });

    case "unfollow":
      return console.log(`Unfollowed this bot: ${JSON.stringify(event)}`);

    case "join":
      console.log(`Joined: ${JSON.stringify(event)}`);
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: `Joined ${event.source.type}`,
      });

    case "leave":
      return console.log(`Left: ${JSON.stringify(event)}`);

    case "memberJoined":
      console.log(`MemberJoined: ${JSON.stringify(event)}`);
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: `MemberJoined ${event.source.type}`,
      });

    case "memberLeft":
      return console.log(`MemberLeft: ${JSON.stringify(event)}`);

    case "postback":
      let data = querystring.parse(event.postback.data);
      // your logical process.....
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: `Got postback: ${JSON.stringify(data)}`,
      });

    case "beacon":
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: `Got beacon: ${event.beacon.hwid}`,
      });

    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

async function handleText(message, replyToken, source) {
  switch (message.text) {
    case "測試1":
      return client.replyMessage(replyToken, [
        {
          type: "sticker",
          packageId: "1",
          stickerId: "1",
        },
        {
          type: "image",
          originalContentUrl:
            "https://www.pkstep.com/wp-content/uploads/2015/12/line-pc.png",
          previewImageUrl:
            "https://www.pkstep.com/wp-content/uploads/2015/12/line-pc.png",
        },
        {
          type: "video",
          originalContentUrl:
            "https://techslides.com/demos/sample-videos/small.mp4",
          previewImageUrl:
            "https://i.ytimg.com/an_webp/BPl7D20F2mE/mqdefault_6s_480x270.webp?du=3000&sqp=CLLsuvQF&rs=AOn4CLBkCE0M_y3SoG1hPvhfQANuF5HB9A",
        },
        {
          type: "audio",
          originalContentUrl:
            "https://www.sample-videos.com/audio/mp3/crowd-cheering.mp3",
          duration: "27000",
        },
        {
          type: "location",
          title: "my location",
          address: "〒150-0002 東京都渋谷区渋谷２丁目２１−１",
          latitude: 35.65910807942215,
          longitude: 139.70372892916203,
        },
      ]);

    case "測試2":
      return client.replyMessage(replyToken, [
        {
          type: "imagemap",
          baseUrl:
            "https://github.com/line/line-bot-sdk-nodejs/raw/master/examples/kitchensink/static/rich",
          altText: "Imagemap alt text",
          baseSize: {
            width: 1040,
            height: 1040,
          },
          actions: [
            {
              area: {
                x: 0,
                y: 0,
                width: 520,
                height: 520,
              },
              type: "uri",
              linkUri: "https://store.line.me/family/manga/en",
            },
            {
              area: {
                x: 520,
                y: 0,
                width: 520,
                height: 520,
              },
              type: "uri",
              linkUri: "https://store.line.me/family/music/en",
            },
            {
              area: {
                x: 0,
                y: 520,
                width: 520,
                height: 520,
              },
              type: "uri",
              linkUri: "https://store.line.me/family/play/en",
            },
            {
              area: {
                x: 520,
                y: 520,
                width: 520,
                height: 520,
              },
              type: "message",
              text: "URANAI!",
            },
          ],
          video: {
            originalContentUrl:
              "https://github.com/line/line-bot-sdk-nodejs/raw/master/examples/kitchensink/static/imagemap/video.mp4",
            previewImageUrl:
              "https://github.com/line/line-bot-sdk-nodejs/raw/master/examples/kitchensink/static/imagemap/preview.jpg",
            area: {
              x: 280,
              y: 385,
              width: 480,
              height: 270,
            },
            externalLink: {
              linkUri: "https://line.me",
              label: "LINE",
            },
          },
        },
        {
          type: "template",
          altText: "Buttons alt text",
          template: {
            type: "buttons",
            thumbnailImageUrl:
              "https://github.com/line/line-bot-sdk-nodejs/raw/master/examples/kitchensink/static/buttons/1040.jpg",
            title: "My button sample",
            text: "Hello, my button",
            actions: [
              {
                label: "Go to line.me",
                type: "uri",
                uri: "https://line.me",
              },
              {
                label: "Say hello1",
                type: "postback",
                data: "hello こんにちは",
              },
              {
                label: "言 hello2",
                type: "postback",
                data: "hello こんにちは",
                text: "hello こんにちは",
              },
              {
                label: "Say message",
                type: "message",
                text: "Rice=米",
              },
            ],
          },
        },
        {
          type: "flex",
          altText: "Shopping flex message",
          contents: {
            type: "carousel",
            contents: [
              {
                type: "bubble",
                hero: {
                  type: "image",
                  size: "full",
                  aspectRatio: "20:13",
                  aspectMode: "cover",
                  url:
                    "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_5_carousel.png",
                },
                body: {
                  type: "box",
                  layout: "vertical",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "Arm Chair, White",
                      wrap: true,
                      weight: "bold",
                      size: "xl",
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      contents: [
                        {
                          type: "text",
                          text: "$49",
                          wrap: true,
                          weight: "bold",
                          size: "xl",
                          flex: 0,
                        },
                        {
                          type: "text",
                          text: ".99",
                          wrap: true,
                          weight: "bold",
                          size: "sm",
                          flex: 0,
                        },
                      ],
                    },
                  ],
                },
                footer: {
                  type: "box",
                  layout: "vertical",
                  spacing: "sm",
                  contents: [
                    {
                      type: "button",
                      style: "primary",
                      action: {
                        type: "uri",
                        label: "Add to Cart",
                        uri: "https://linecorp.com",
                      },
                    },
                    {
                      type: "button",
                      action: {
                        type: "uri",
                        label: "Add to wishlist",
                        uri: "https://linecorp.com",
                      },
                    },
                  ],
                },
              },
              {
                type: "bubble",
                hero: {
                  type: "image",
                  size: "full",
                  aspectRatio: "20:13",
                  aspectMode: "cover",
                  url:
                    "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_6_carousel.png",
                },
                body: {
                  type: "box",
                  layout: "vertical",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "Metal Desk Lamp",
                      wrap: true,
                      weight: "bold",
                      size: "xl",
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      flex: 1,
                      contents: [
                        {
                          type: "text",
                          text: "$11",
                          wrap: true,
                          weight: "bold",
                          size: "xl",
                          flex: 0,
                        },
                        {
                          type: "text",
                          text: ".99",
                          wrap: true,
                          weight: "bold",
                          size: "sm",
                          flex: 0,
                        },
                      ],
                    },
                    {
                      type: "text",
                      text: "Temporarily out of stock",
                      wrap: true,
                      size: "xxs",
                      margin: "md",
                      color: "#ff5551",
                      flex: 0,
                    },
                  ],
                },
                footer: {
                  type: "box",
                  layout: "vertical",
                  spacing: "sm",
                  contents: [
                    {
                      type: "button",
                      flex: 2,
                      style: "primary",
                      color: "#aaaaaa",
                      action: {
                        type: "uri",
                        label: "Add to Cart",
                        uri: "https://linecorp.com",
                      },
                    },
                    {
                      type: "button",
                      action: {
                        type: "uri",
                        label: "Add to wish list",
                        uri: "https://linecorp.com",
                      },
                    },
                  ],
                },
              },
              {
                type: "bubble",
                body: {
                  type: "box",
                  layout: "vertical",
                  spacing: "sm",
                  contents: [
                    {
                      type: "button",
                      flex: 1,
                      gravity: "center",
                      action: {
                        type: "uri",
                        label: "See more",
                        uri: "https://linecorp.com",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          type: "flex",
          altText: "Apparel flex message",
          contents: {
            type: "carousel",
            contents: [
              {
                type: "bubble",
                body: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "image",
                      url:
                        "https://scdn.line-apps.com/n/channel_devcenter/img/flexsnapshot/clip/clip1.jpg",
                      size: "full",
                      aspectMode: "cover",
                      aspectRatio: "2:3",
                      gravity: "top",
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "Brown's T-shirts",
                              size: "xl",
                              color: "#ffffff",
                              weight: "bold",
                            },
                          ],
                        },
                        {
                          type: "box",
                          layout: "baseline",
                          contents: [
                            {
                              type: "text",
                              text: "¥35,800",
                              color: "#ebebeb",
                              size: "sm",
                              flex: 0,
                            },
                            {
                              type: "text",
                              text: "¥75,000",
                              color: "#ffffffcc",
                              decoration: "line-through",
                              gravity: "bottom",
                              flex: 0,
                              size: "sm",
                            },
                          ],
                          spacing: "lg",
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "filler",
                            },
                            {
                              type: "box",
                              layout: "baseline",
                              contents: [
                                {
                                  type: "filler",
                                },
                                {
                                  type: "icon",
                                  url:
                                    "https://scdn.line-apps.com/n/channel_devcenter/img/flexsnapshot/clip/clip14.png",
                                },
                                {
                                  type: "text",
                                  text: "Add to cart",
                                  color: "#ffffff",
                                  flex: 0,
                                  offsetTop: "-2px",
                                },
                                {
                                  type: "filler",
                                },
                              ],
                              spacing: "sm",
                            },
                            {
                              type: "filler",
                            },
                          ],
                          borderWidth: "1px",
                          cornerRadius: "4px",
                          spacing: "sm",
                          borderColor: "#ffffff",
                          margin: "xxl",
                          height: "40px",
                        },
                      ],
                      position: "absolute",
                      offsetBottom: "0px",
                      offsetStart: "0px",
                      offsetEnd: "0px",
                      backgroundColor: "#03303Acc",
                      paddingAll: "20px",
                      paddingTop: "18px",
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "text",
                          text: "SALE",
                          color: "#ffffff",
                          align: "center",
                          size: "xs",
                          offsetTop: "3px",
                        },
                      ],
                      position: "absolute",
                      cornerRadius: "20px",
                      offsetTop: "18px",
                      backgroundColor: "#ff334b",
                      offsetStart: "18px",
                      height: "25px",
                      width: "53px",
                    },
                  ],
                  paddingAll: "0px",
                },
              },
              {
                type: "bubble",
                body: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "image",
                      url:
                        "https://scdn.line-apps.com/n/channel_devcenter/img/flexsnapshot/clip/clip2.jpg",
                      size: "full",
                      aspectMode: "cover",
                      aspectRatio: "2:3",
                      gravity: "top",
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "text",
                              text: "Cony's T-shirts",
                              size: "xl",
                              color: "#ffffff",
                              weight: "bold",
                            },
                          ],
                        },
                        {
                          type: "box",
                          layout: "baseline",
                          contents: [
                            {
                              type: "text",
                              text: "¥35,800",
                              color: "#ebebeb",
                              size: "sm",
                              flex: 0,
                            },
                            {
                              type: "text",
                              text: "¥75,000",
                              color: "#ffffffcc",
                              decoration: "line-through",
                              gravity: "bottom",
                              flex: 0,
                              size: "sm",
                            },
                          ],
                          spacing: "lg",
                        },
                        {
                          type: "box",
                          layout: "vertical",
                          contents: [
                            {
                              type: "filler",
                            },
                            {
                              type: "box",
                              layout: "baseline",
                              contents: [
                                {
                                  type: "filler",
                                },
                                {
                                  type: "icon",
                                  url:
                                    "https://scdn.line-apps.com/n/channel_devcenter/img/flexsnapshot/clip/clip14.png",
                                },
                                {
                                  type: "text",
                                  text: "Add to cart",
                                  color: "#ffffff",
                                  flex: 0,
                                  offsetTop: "-2px",
                                },
                                {
                                  type: "filler",
                                },
                              ],
                              spacing: "sm",
                            },
                            {
                              type: "filler",
                            },
                          ],
                          borderWidth: "1px",
                          cornerRadius: "4px",
                          spacing: "sm",
                          borderColor: "#ffffff",
                          margin: "xxl",
                          height: "40px",
                        },
                      ],
                      position: "absolute",
                      offsetBottom: "0px",
                      offsetStart: "0px",
                      offsetEnd: "0px",
                      backgroundColor: "#9C8E7Ecc",
                      paddingAll: "20px",
                      paddingTop: "18px",
                    },
                    {
                      type: "box",
                      layout: "vertical",
                      contents: [
                        {
                          type: "text",
                          text: "SALE",
                          color: "#ffffff",
                          align: "center",
                          size: "xs",
                          offsetTop: "3px",
                        },
                      ],
                      position: "absolute",
                      cornerRadius: "20px",
                      offsetTop: "18px",
                      backgroundColor: "#ff334b",
                      offsetStart: "18px",
                      height: "25px",
                      width: "53px",
                    },
                  ],
                  paddingAll: "0px",
                },
              },
            ],
          },
        },
        {
          type: "flex",
          altText: "Receipt flex message",
          contents: {
            type: "bubble",
            body: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "RECEIPT",
                  weight: "bold",
                  color: "#1DB446",
                  size: "sm",
                },
                {
                  type: "text",
                  text: "Brown Store",
                  weight: "bold",
                  size: "xxl",
                  margin: "md",
                },
                {
                  type: "text",
                  text: "Miraina Tower, 4-1-6 Shinjuku, Tokyo",
                  size: "xs",
                  color: "#aaaaaa",
                  wrap: true,
                },
                {
                  type: "separator",
                  margin: "xxl",
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "xxl",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "Energy Drink",
                          size: "sm",
                          color: "#555555",
                          flex: 0,
                        },
                        {
                          type: "text",
                          text: "$2.99",
                          size: "sm",
                          color: "#111111",
                          align: "end",
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "Chewing Gum",
                          size: "sm",
                          color: "#555555",
                          flex: 0,
                        },
                        {
                          type: "text",
                          text: "$0.99",
                          size: "sm",
                          color: "#111111",
                          align: "end",
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "Bottled Water",
                          size: "sm",
                          color: "#555555",
                          flex: 0,
                        },
                        {
                          type: "text",
                          text: "$3.33",
                          size: "sm",
                          color: "#111111",
                          align: "end",
                        },
                      ],
                    },
                    {
                      type: "separator",
                      margin: "xxl",
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "xxl",
                      contents: [
                        {
                          type: "text",
                          text: "ITEMS",
                          size: "sm",
                          color: "#555555",
                        },
                        {
                          type: "text",
                          text: "3",
                          size: "sm",
                          color: "#111111",
                          align: "end",
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "TOTAL",
                          size: "sm",
                          color: "#555555",
                        },
                        {
                          type: "text",
                          text: "$7.31",
                          size: "sm",
                          color: "#111111",
                          align: "end",
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "CASH",
                          size: "sm",
                          color: "#555555",
                        },
                        {
                          type: "text",
                          text: "$8.0",
                          size: "sm",
                          color: "#111111",
                          align: "end",
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "CHANGE",
                          size: "sm",
                          color: "#555555",
                        },
                        {
                          type: "text",
                          text: "$0.69",
                          size: "sm",
                          color: "#111111",
                          align: "end",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "separator",
                  margin: "xxl",
                },
                {
                  type: "box",
                  layout: "horizontal",
                  margin: "md",
                  contents: [
                    {
                      type: "text",
                      text: "PAYMENT ID",
                      size: "xs",
                      color: "#aaaaaa",
                      flex: 0,
                    },
                    {
                      type: "text",
                      text: "#743289384279",
                      color: "#aaaaaa",
                      size: "xs",
                      align: "end",
                    },
                  ],
                },
              ],
            },
            styles: {
              footer: {
                separator: true,
              },
            },
          },
        },
      ]);

    case "Buttons template":
      return client.replyMessage(replyToken, {
        type: "template",
        altText: "This is a buttons template",
        template: {
          type: "buttons",
          thumbnailImageUrl:
            "https://ithelp.ithome.com.tw/images/ironman/11th/event/kv_event/kv-bg-addfly.png",
          imageAspectRatio: "rectangle",
          imageSize: "cover",
          imageBackgroundColor: "#FFFFFF",
          title: "Menu",
          text: "Please select",
          defaultAction: {
            type: "uri",
            label: "View detail",
            uri: "https://google.com.tw",
          },
          actions: [
            {
              type: "postback",
              label: "Buy",
              data: "action=buy&itemid=123",
            },
            {
              type: "message",
              label: "it 邦幫忙鐵人賽",
              text: "it 邦幫忙鐵人賽",
            },
            {
              type: "uri",
              label: "View detail",
              uri: "https://ithelp.ithome.com.tw/2020ironman",
            },
          ],
        },
      });

    case "Confirm template":
      return client.replyMessage(replyToken, {
        type: "template",
        altText: "this is a confirm template",
        template: {
          type: "confirm",
          text: "Are you sure?",
          actions: [
            {
              type: "message",
              label: "Yes",
              text: "yes",
            },
            {
              type: "message",
              label: "No",
              text: "no",
            },
          ],
        },
      });

    case "Carousel template":
      return client.replyMessage(replyToken, {
        type: "template",
        altText: "this is a carousel template",
        template: {
          type: "carousel",
          columns: [
            {
              thumbnailImageUrl:
                "https://ithelp.ithome.com.tw/images/ironman/11th/event/kv_event/kv-bg-addfly.png",
              imageBackgroundColor: "#FFFFFF",
              title: "this is menu",
              text: "description",
              defaultAction: {
                type: "uri",
                label: "View detail",
                uri: "https://ithelp.ithome.com.tw/2020ironman",
              },
              actions: [
                {
                  type: "postback",
                  label: "Buy",
                  data: "action=buy&itemid=111",
                },
                {
                  type: "message",
                  label: "it 邦幫忙鐵人賽",
                  text: "it 邦幫忙鐵人賽",
                },
                {
                  type: "uri",
                  label: "View detail",
                  uri: "https://ithelp.ithome.com.tw/2020ironman",
                },
              ],
            },
            {
              thumbnailImageUrl:
                "https://ithelp.ithome.com.tw/images/ironman/11th/event/kv_event/kv-bg-addfly.png",
              imageBackgroundColor: "#000000",
              title: "this is menu",
              text: "description",
              defaultAction: {
                type: "uri",
                label: "View detail",
                uri: "https://ithelp.ithome.com.tw/2020ironman",
              },
              actions: [
                {
                  type: "postback",
                  label: "Buy",
                  data: "action=buy&itemid=222",
                },
                {
                  type: "message",
                  label: "it 邦幫忙鐵人賽",
                  text: "it 邦幫忙鐵人賽",
                },
                {
                  type: "uri",
                  label: "View detail",
                  uri: "https://ithelp.ithome.com.tw/2020ironman",
                },
              ],
            },
          ],
          imageAspectRatio: "rectangle",
          imageSize: "cover",
        },
      });

    case "Image carousel template":
      return client.replyMessage(replyToken, {
        type: "template",
        altText: "this is a image carousel template",
        template: {
          type: "image_carousel",
          columns: [
            {
              imageUrl:
                "https://ithelp.ithome.com.tw/images/ironman/11th/event/kv_event/kv-bg-addfly.png",
              action: {
                type: "postback",
                label: "Buy",
                data: "action=buy&itemid=111",
              },
            },
            {
              imageUrl:
                "https://ithelp.ithome.com.tw/images/ironman/11th/event/kv_event/kv-bg-addfly.png",
              action: {
                type: "message",
                label: "Yes",
                text: "yes",
              },
            },
            {
              imageUrl:
                "https://ithelp.ithome.com.tw/images/ironman/11th/event/kv_event/kv-bg-addfly.png",
              action: {
                type: "uri",
                label: "View detail",
                uri: "http://example.com/page/222",
              },
            },
          ],
        },
      });

    case "Quick reply":
      return client.replyMessage(replyToken, {
        type: "text",
        text: "Quick reply sample 😁",
        quickReply: {
          items: [
            {
              type: "action",
              action: {
                type: "postback",
                label: "ithome Clarence 鐵人賽",
                data: "action=url&item=clarence",
                text: "ithome Clarence 鐵人賽",
              },
            },
            {
              type: "action",
              action: {
                type: "message",
                label: "ithome Clarence",
                text: "https://ithelp.ithome.com.tw/users/20117701",
              },
            },
            {
              type: "action",
              action: {
                type: "camera",
                label: "Send camera",
              },
            },
            {
              type: "action",
              action: {
                type: "cameraRoll",
                label: "Send camera roll",
              },
            },
            {
              type: "action",
              action: {
                type: "location",
                label: "Send location",
              },
            },
          ],
        },
      });

    // Lancome導購訊息 //
    case "產品查詢":
      return client.replyMessage(replyToken, {
        type: "flex",
        altText: "請選擇產品類型",
        contents: {
          type: "bubble",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "請選擇產品類型",
                color: "#FFFFFF",
              },
            ],
            backgroundColor: "#000000",
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                action: {
                  type: "message",
                  label: "保養產品",
                  text: "保養產品",
                },
              },
              {
                type: "button",
                action: {
                  type: "message",
                  label: "彩妝產品",
                  text: "彩妝產品",
                },
              },
            ],
          },
        },
      });

    case "保養產品":
      return client.replyMessage(replyToken, {
        type: "flex",
        altText: "保養產品",
        contents: {
          type: "carousel",
          contents: [
            {
              type: "bubble",
              size: "kilo",
              direction: "ltr",
              hero: {
                type: "image",
                url:
                  "https://www.lancome.com.tw/dw/image/v2/AAWH_PRD/on/demandware.static/-/Sites-lancome-master-catalog/zh_TW/dwf91282e5/images/PACKSHOTS/BOM/A01224-LAC/A01224-LAC_191114.jpg?sw=1000&sh=1000&sm=fit",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "320:213",
              },
              body: {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: "臉部保養",
                        weight: "bold",
                        size: "sm",
                        wrap: true,
                        color: "#FFFFFF",
                      },
                      {
                        type: "text",
                        text: "請選擇想要的臉部保養系列：",
                        size: "xs",
                        wrap: true,
                        color: "#FFFFFF",
                      },
                    ],
                    backgroundColor: "#D51B51",
                    spacing: "sm",
                    paddingAll: "10px",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: "精華液",
                        align: "center",
                        action: {
                          type: "message",
                          label: "精華液",
                          text: "精華液",
                        },
                        size: "md",
                      },
                      {
                        type: "text",
                        text: "乳霜/日霜",
                        action: {
                          type: "message",
                          label: "乳霜/日霜",
                          text: "乳霜/日霜",
                        },
                        align: "center",
                        size: "md",
                      },
                      {
                        type: "text",
                        text: "晚霜",
                        action: {
                          type: "message",
                          label: "晚霜",
                          text: "晚霜",
                        },
                        align: "center",
                        size: "md",
                      },
                    ],
                    spacing: "lg",
                    margin: "lg",
                  },
                ],
              },
            },
            {
              type: "bubble",
              size: "kilo",
              direction: "ltr",
              hero: {
                type: "image",
                url:
                  "https://www.lancome.com.tw/dw/image/v2/AAWH_PRD/on/demandware.static/-/Sites-lancome-master-catalog/zh_TW/dwaa30dad9/images/PACKSHOTS/SKINCARE/GENIFIQUE/LORE-3605531688986-1.jpg?sw=1000&sh=1000&sm=fit",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "320:213",
              },
              body: {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: "肌膚需求",
                        weight: "bold",
                        size: "sm",
                        wrap: true,
                        color: "#FFFFFF",
                      },
                      {
                        type: "text",
                        text: "請選擇想要的肌膚需求系列：",
                        size: "xs",
                        wrap: true,
                        color: "#FFFFFF",
                      },
                    ],
                    backgroundColor: "#D51B51",
                    spacing: "sm",
                    paddingAll: "10px",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: "抗老修護",
                        align: "center",
                        action: {
                          type: "message",
                          label: "抗老修護",
                          text: "抗老修護",
                        },
                        size: "md",
                      },
                      {
                        type: "text",
                        text: "緊緻嫩白",
                        action: {
                          type: "message",
                          label: "緊緻嫩白",
                          text: "緊緻嫩白",
                        },
                        align: "center",
                        size: "md",
                      },
                      {
                        type: "text",
                        text: "對抗暗沉",
                        action: {
                          type: "message",
                          label: "對抗暗沉",
                          text: "對抗暗沉",
                        },
                        align: "center",
                        size: "md",
                      },
                      {
                        type: "text",
                        text: "輕盈防曬",
                        align: "center",
                        action: {
                          type: "message",
                          label: "輕盈防曬",
                          text: "輕盈防曬",
                        },
                        size: "md",
                      },
                    ],
                    spacing: "lg",
                    margin: "lg",
                  },
                ],
              },
            },
          ],
        },
      });

    case "彩妝產品":
      return client.replyMessage(replyToken, {
        type: "flex",
        altText: "彩妝產品",
        contents: {
          type: "carousel",
          contents: [
            {
              type: "bubble",
              size: "kilo",
              direction: "ltr",
              hero: {
                type: "image",
                url:
                  "https://www.lancome.com.tw/dw/image/v2/AAWH_PRD/on/demandware.static/-/Sites-lancome-master-catalog/zh_TW/dw4df0665a/images/PACKSHOTS/MAKEUP/FACE/TEINT%20IDOLE%20ULTRA%20WEAR%20CUSHION/4935421660068.jpg?sw=1000&sh=1000&sm=fit",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "320:213",
              },
              body: {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: "臉部彩妝",
                        weight: "bold",
                        size: "sm",
                        wrap: true,
                        color: "#FFFFFF",
                      },
                      {
                        type: "text",
                        text: "請選擇想要的臉部彩妝產品：",
                        size: "xs",
                        wrap: true,
                        color: "#FFFFFF",
                      },
                    ],
                    backgroundColor: "#D51B51",
                    spacing: "sm",
                    paddingAll: "10px",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: "氣墊粉餅",
                        align: "center",
                        action: {
                          type: "message",
                          label: "氣墊粉餅",
                          text: "氣墊粉餅",
                        },
                        size: "md",
                      },
                      {
                        type: "text",
                        text: "底妝/粉底/粉餅",
                        action: {
                          type: "message",
                          label: "底妝/粉底/粉餅",
                          text: "底妝/粉底/粉餅",
                        },
                        align: "center",
                        size: "md",
                      },
                      {
                        type: "text",
                        text: "蜜粉/蜜粉餅",
                        action: {
                          type: "message",
                          label: "蜜粉/蜜粉餅",
                          text: "蜜粉/蜜粉餅",
                        },
                        align: "center",
                        size: "md",
                      },
                      {
                        type: "text",
                        text: "檢視全部臉部彩妝",
                        action: {
                          type: "message",
                          label: "檢視全部",
                          text: "檢視全部臉部彩妝",
                        },
                        align: "center",
                        size: "md",
                      },
                    ],
                    spacing: "lg",
                    margin: "lg",
                  },
                ],
              },
            },
            {
              type: "bubble",
              size: "kilo",
              direction: "ltr",
              hero: {
                type: "image",
                url:
                  "https://www.lancome.com.tw/dw/image/v2/AAWH_PRD/on/demandware.static/-/Sites-lancome-master-catalog/default/dwbddee878/medias/sys_master/root/hfc/h38/9192205320222/LORE-3614271312235-1.jpg?sw=1000&sh=1000&sm=fit",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "320:213",
              },
              body: {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: "眼妝",
                        weight: "bold",
                        size: "sm",
                        wrap: true,
                        color: "#FFFFFF",
                      },
                      {
                        type: "text",
                        text: "請選擇想要的眼妝產品：",
                        size: "xs",
                        wrap: true,
                        color: "#FFFFFF",
                      },
                    ],
                    backgroundColor: "#D51B51",
                    spacing: "sm",
                    paddingAll: "10px",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: "睫毛膏",
                        align: "center",
                        action: {
                          type: "message",
                          label: "睫毛膏",
                          text: "睫毛膏",
                        },
                        size: "md",
                      },
                      {
                        type: "text",
                        text: "眼影",
                        action: {
                          type: "message",
                          label: "眼影",
                          text: "眼影",
                        },
                        align: "center",
                        size: "md",
                      },
                      {
                        type: "text",
                        text: "眼線液/眼線筆系列",
                        action: {
                          type: "message",
                          label: "眼線液/眼線筆系列",
                          text: "眼線液/眼線筆系列",
                        },
                        align: "center",
                        size: "md",
                      },
                      {
                        type: "text",
                        text: "檢視全部眼妝",
                        align: "center",
                        action: {
                          type: "message",
                          label: "檢視全部",
                          text: "檢視全部眼妝",
                        },
                        size: "md",
                      },
                    ],
                    spacing: "lg",
                    margin: "lg",
                  },
                ],
              },
            },
            {
              type: "bubble",
              size: "kilo",
              direction: "ltr",
              hero: {
                type: "image",
                url:
                  "https://www.lancome.com.tw/dw/image/v2/AAWH_PRD/on/demandware.static/-/Sites-lancome-master-catalog/default/dwb771c1a8/images/PACKSHOTS/MAKEUP/LIPS/ABSOLU_ROUGE/A01683-LAC_ABSOLU_ROUGE_CREAM/3614272653085_ABSOLU_ROUGE_CREAM_138_RAGING_RED_RUBY.jpg?sw=1000&sh=1000&sm=fit",
                size: "full",
                aspectMode: "cover",
                aspectRatio: "320:213",
              },
              body: {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: "唇彩",
                        weight: "bold",
                        size: "sm",
                        wrap: true,
                        color: "#FFFFFF",
                      },
                      {
                        type: "text",
                        text: "請選擇想要的唇彩產品：",
                        size: "xs",
                        wrap: true,
                        color: "#FFFFFF",
                      },
                    ],
                    backgroundColor: "#D51B51",
                    spacing: "sm",
                    paddingAll: "10px",
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    contents: [
                      {
                        type: "text",
                        text: "唇膏/口紅",
                        align: "center",
                        action: {
                          type: "message",
                          label: "唇膏/口紅",
                          text: "唇膏/口紅",
                        },
                        size: "md",
                      },
                      {
                        type: "text",
                        text: "唇萃/唇露/唇蜜/唇釉系列",
                        action: {
                          type: "message",
                          label: "唇萃/唇露/唇蜜/唇釉系列",
                          text: "唇萃/唇露/唇蜜/唇釉系列",
                        },
                        align: "center",
                        size: "md",
                      },
                      {
                        type: "text",
                        text: "檢視全部唇彩",
                        action: {
                          type: "message",
                          label: "檢視全部",
                          text: "檢視全部唇彩",
                        },
                        align: "center",
                        size: "md",
                      },
                    ],
                    spacing: "lg",
                    margin: "lg",
                  },
                ],
              },
            },
          ],
        },
      });

    default:
      console.log(`Echo message to ${replyToken}: ${message.text}`);
      const echo = {
        type: "text",
        text: message.text,
      };
      return client.replyMessage(replyToken, echo);
  }
}

function handleImage(message, replyToken) {
  let getContent;
  if (message.contentProvider.type === "line") {
    const downloadPath = path.join(
      process.cwd(),
      "public",
      "downloaded",
      `${message.id}.jpg`
    );

    getContent = downloadContent(message.id, downloadPath).then(
      (downloadPath) => {
        return {
          originalContentUrl:
            baseURL + "/downloaded/" + path.basename(downloadPath),
          previewImageUrl:
            baseURL + "/downloaded/" + path.basename(downloadPath),
        };
      }
    );
  } else if (message.contentProvider.type === "external") {
    getContent = Promise.resolve(message.contentProvider);
  }

  return getContent.then(({ originalContentUrl, previewImageUrl }) => {
    return client.replyMessage(replyToken, {
      type: "image",
      originalContentUrl,
      previewImageUrl,
    });
  });
}

function handleVideo(message, replyToken) {
  let getContent;
  if (message.contentProvider.type === "line") {
    const downloadPath = path.join(
      process.cwd(),
      "public",
      "downloaded",
      `${message.id}.mp4`
    );

    getContent = downloadContent(message.id, downloadPath).then(
      (downloadPath) => {
        return {
          originalContentUrl:
            baseURL + "/downloaded/" + path.basename(downloadPath),
          previewImageUrl: lineImgURL,
        };
      }
    );
  } else if (message.contentProvider.type === "external") {
    getContent = Promise.resolve(message.contentProvider);
  }

  return getContent.then(({ originalContentUrl, previewImageUrl }) => {
    return client.replyMessage(replyToken, {
      type: "video",
      originalContentUrl,
      previewImageUrl,
    });
  });
}

function handleAudio(message, replyToken) {
  let getContent;
  if (message.contentProvider.type === "line") {
    const downloadPath = path.join(
      process.cwd(),
      "public",
      "downloaded",
      `${message.id}.m4a`
    );

    getContent = downloadContent(message.id, downloadPath).then(
      (downloadPath) => {
        return {
          originalContentUrl:
            baseURL + "/downloaded/" + path.basename(downloadPath),
        };
      }
    );
  } else {
    getContent = Promise.resolve(message.contentProvider);
  }

  return getContent.then(({ originalContentUrl }) => {
    return client.replyMessage(replyToken, {
      type: "audio",
      originalContentUrl,
      duration: message.duration,
    });
  });
}

function downloadContent(messageId, downloadPath) {
  return client.getMessageContent(messageId).then(
    (stream) =>
      new Promise((resolve, reject) => {
        const writable = fs.createWriteStream(downloadPath);
        stream.pipe(writable);
        stream.on("end", () => resolve(downloadPath));
        stream.on("error", reject);
      })
  );
}

function handleLocation(message, replyToken) {
  return client.replyMessage(replyToken, {
    type: "location",
    title: message.title,
    address: message.address,
    latitude: message.latitude,
    longitude: message.longitude,
  });
}

function handleSticker(message, replyToken) {
  return client.replyMessage(replyToken, {
    type: "sticker",
    packageId: message.packageId,
    stickerId: message.stickerId,
  });
}

module.exports = router;
