// Quantumult X 盒子通知脚本 by 夕颜


let body = $request.body;
let json;

try {
  json = JSON.parse(body);
} catch (e) {
  console.log("解析失败:", e);
  $done({});
  return;
}

const wxid = json.wxid || "未知wxid";
const rawCode = json.code || "";
const code = rawCode.startsWith("TB") ? rawCode : "TB" + rawCode;

const redeemUrl = "https://theme.25mao.com/index/redeem";
const headers = {
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)"
};

const requestBody = JSON.stringify({ wxid, code });

$task.fetch({ url: redeemUrl, method: "POST", headers, body: requestBody }).then(resp => {
  let msg = "无返回信息";
  try {
    const res = JSON.parse(resp.body);
    msg = res.message || msg;
  } catch (e) {
    msg = "响应解析失败";
  }

  // 发送 Quantumult X 内通知
  $notify("by夕颜", "", `自动抢盒子兑换码通知\nwxid: ${wxid}\ncode: ${code}\n返回: ${msg}`);


  const barkKey = "tZjWy8x2DekUG57vNBbQFm";  
	  const barkTitle = "兑换通知";
  const barkBody = `wxid: ${wxid}\ncode: ${code}\n返回: ${msg}`;
  const barkIcon = "https://img.xiyan.pro/i/u/2025/04/17/IMG_7887.png";
  const barkUrl = `https://api.day.app/${barkKey}/${encodeURIComponent(barkTitle)}/${encodeURIComponent(barkBody)}?icon=${encodeURIComponent(barkIcon)}`;

  $task.fetch({ url: barkUrl, method: "GET" }).then(() => {
    console.log("✅ 推送通知发送成功");
    $done({ response: resp });
  }).catch(err => {
    console.log("❌ 推送通知发送失败", err);
    $done({ response: resp });
  });

}).catch(err => {
  $notify("by夕颜", "", `自动抢盒子兑换码通知\nwxid: ${wxid}\ncode: ${code}\n返回: 请求失败`);
  $done({});
});