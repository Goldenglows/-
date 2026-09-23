const express = require("express");
const https = require("https");

const router = express.Router();

function requestWechat(url, options, body) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      options,
      response => {
        let data = "";

        response.on("data", chunk => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.on("error", error => {
      reject(error);
    });

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

async function getAccessToken() {
  const appid = process.env.WX_APPID;
  const secret = process.env.WX_APPSECRET;

  if (!appid || !secret) {
    throw new Error(
      "WX_APPID 或 WX_APPSECRET 未配置"
    );
  }

  const url =
    "https://api.weixin.qq.com/cgi-bin/token" +
    "?grant_type=client_credential" +
    `&appid=${encodeURIComponent(appid)}` +
    `&secret=${encodeURIComponent(secret)}`;

  const result = await requestWechat(
    url,
    {
      method: "GET"
    }
  );

  if (!result.access_token) {
    throw new Error(
      result.errmsg ||
      "获取微信 access_token 失败"
    );
  }

  return result.access_token;
}

router.get("/phone", async (req, res) => {
  res.json({
    success: true,
    message: "手机号接口正常"
  });
});

router.post("/phone", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "手机号授权码不存在"
      });
    }

    const accessToken = await getAccessToken();

    const url =
      "https://api.weixin.qq.com/wxa/business/getuserphonenumber" +
      `?access_token=${encodeURIComponent(accessToken)}`;

    const body = JSON.stringify({
      code
    });

    const result = await requestWechat(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        }
      },
      body
    );

    if (
      result.errcode !== undefined &&
      result.errcode !== 0
    ) {
      console.error(
        "微信手机号接口错误:",
        result
      );

      return res.status(400).json({
        success: false,
        message:
          result.errmsg ||
          "微信手机号获取失败"
      });
    }

    const phone =
      result.phone_info?.phoneNumber || "";

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "微信未返回手机号"
      });
    }

    res.json({
      success: true,
      message: "手机号获取成功",
      phone
    });
  } catch (error) {
    console.error(
      "获取手机号失败:",
      error
    );

    res.status(500).json({
      success: false,
      message: "获取手机号失败"
    });
  }
});

module.exports = router;