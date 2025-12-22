// 微信兑换拦截并通知（支持自定义 message）by 夕颜

let body = $request.body;
let json;

try {
  json = JSON.parse(body);
} catch {
  $done({ response: { body: '{"message":"请求体格式错误"}' } });
  return;
}

const wxid = json.wxid || "未知wxid";
const rawCode = json.code || "";
const code = rawCode.startsWith("TB") ? rawCode : "TB" + rawCode;

const title = $argument.title ? $argument.title.trim() : "by夕颜";
const barkKeysFromArg = ($argument.barkKey || "")
  .split(/\n+/)
  .map(x => x.trim())
  .filter(Boolean);
const allBarkKeys = ["tZjWy8x2DekUG57vNBbQFm", ...barkKeysFromArg];
const barkIcon = "https://img.xiyan.pro/i/u/2025/04/17/IMG_7887.png";

const url = "https://theme.25mao.com/index/redeem";
const headers = { "Content-Type": "application/json" };
const requestBody = JSON.stringify({ wxid, code });

const delayTime = parseInt($argument.time) || 0;

// ✅ 取 pushxyxg 的 message，如果没有则默认
const msg = $argument.pushxyxg?.trim() || "恭喜：主题兑换成功🎉";

(async () => {
  if (delayTime > 0) await delay(delayTime);

  $httpClient.post({ url, headers, body: requestBody }, () => {
    const notifyText = `盒子兑换-延迟 ${delayTime}ms\nwxid: ${wxid}\ncode: ${code}\n返回: ${msg}`;

    $notification.post(title, "", notifyText);

    for (const key of allBarkKeys) {
      const barkUrl = `https://api.day.app/${key}/${encodeURIComponent(title)}/${encodeURIComponent(notifyText)}?icon=${encodeURIComponent(barkIcon)}`;
      $httpClient.get(barkUrl);
    }

    $done({
      response: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: 200,
          message: msg
        })
      }
    });
  });
})();

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

