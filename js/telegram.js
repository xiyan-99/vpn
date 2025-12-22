// Telegram t.me 秒跳第三方客户端（无页面感）
// Author: iOS夕颜

if (!$request || !$request.url) {
  $done({});
  return;
}

// argument 读取
let client = ($argument && Object.values($argument)[0]) || "Telegram";

const map = {
  "Telegram": "tg",
  "Nicegram": "ng",
  "Swiftgram": "sg",
  "iMe": "ime",
  "Turrit": "turrit",
  "Lingogram": "lingo"
};

const scheme = map[client] || client;

// 提取 domain
const match = $request.url.match(/t\.me\/([^/?]+)/);

if (!match) {
  $done({});
  return;
}

const domain = match[1];

// 直接返回一个最小 HTML，立即跳
const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<script>
location.href = "${scheme}://resolve?domain=${domain}";
</script>
</head>
<body></body>
</html>`;

console.log(`🚀 t.me → ${scheme}://resolve?domain=${domain}`);

$done({
  status: 200,
  headers: {
    "Content-Type": "text/html; charset=utf-8"
  },
  body: html
});