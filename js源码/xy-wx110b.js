// 微信娱乐 - 注入 wxid，修改 scene 参数，同时打印日志与通知

const wxid = $argument.wxid;
const wgRaw = $argument.wg;
const header = $argument.header;

if (!wxid || !wgRaw || !header) {
  console.log("❌ 缺少必要参数 wxid、wg 或 header");
  $notification.post("表扬书脚本失败", "缺少参数", `wxid=${wxid || "空"}\nwg=${wgRaw ? "有" : "空"}\nheader=${header || "空"}`);
  $done({});
}

console.log("✅ 原始 wxid 参数：", wxid);
console.log("✅ 原始 wg 内容：\n" + wgRaw);

// 1. 替换请求体中的 username 和 sender 为 wxid
let modifiedBody = wgRaw
  .replace(/("username"\s*:\s*")[^"]*(")/g, `$1${wxid}$2`)
  .replace(/("sender"\s*:\s*")[^"]*(")/g, `$1${wxid}$2`);
console.log("✅ 替换后请求体：\n" + modifiedBody);

// 2. 替换 URL 中 scene 参数
let modifiedUrl = $request.url.replace(/([?&]scene=)[^&]*/g, `$1${encodeURIComponent(header)}`);
console.log("✅ 修改后的 URL：", modifiedUrl);

// 3. 替换原始 Referer 中 scene 参数（不创建新 Referer）
let headers = $request.headers || {};
if (headers["referer"]) {
  headers["referer"] = headers["referer"].replace(/([?&]scene=)[^&]*/g, `$1${encodeURIComponent(header)}`);
  console.log("✅ 修改 referer 中 scene：", headers["referer"]);
} else {
  console.log("⚠️ 未检测到 Referer，未修改");
}

// 4. 成功通知
$notification.post(
  "✅ 表扬书注入成功",
  `wxid = ${wxid}`,
  `scene = ${header}，请求体、URL、Referer 已修改`
);

$done({
  url: modifiedUrl,
  body: modifiedBody,
  headers
});