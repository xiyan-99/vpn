// 微信斗图五接口抓包脚本 (Host从url中提取)

let url = $request.url;

// 解析 URL 中的 Host
let host = url.match(/^https?:\/\/([^\/?#]+)/i);
host = host ? host[1] : "";

const keyMap = {
  "i.kongxu.de": "dt_urls_kongxu",
  "apt.25mao.com": "dt_urls_lanmao",
  "doutu2.aqkj77.com": "dt_urls_aqkj",
  "dutu.iospaopaoyu.cn": "dt_urls_ppy",
  "dt.zyxzy.cn": "dt_urls_xzy"
};

const key = keyMap[host];
if (!key) {
  console.log("未识别的域名: " + host);
  $done();
  return;
}

let oldList = [];
try {
  oldList = JSON.parse($persistentStore.read(key) || "[]");
} catch {
  oldList = [];
}

// 自动去重保存
if (!oldList.includes(url)) {
  oldList.push(url);
  $persistentStore.write(JSON.stringify(oldList), key);
  // 使用通知来显示URL
  $notification.post("新增URL", "", url);
} else {
  $notification.post("已存在URL", "", url);
}

$done();