let url = $request.url;

// 域名与参数名对应关系
const domainMap = {
  "kongxu.de": "wxidkx",
  "apt.25mao.com": "wxidmao",
  "dutu.iospaopaoyu.cn": "wxidppy",
  "dt.zyxzy.cn": "wxidxzy",
  "aqkj77.com": "wxidaqkj",
  "dt.9527cleo.com": "wxid9527",
	"doutu.hai6.live": "wxidhai"
};

let matched = false;

for (const [domain, paramKey] of Object.entries(domainMap)) {
  if (url.includes(domain)) {
    matched = true;
    const newWxid = $argument[paramKey] || "";
    if (newWxid) {
      let before = url.match(/wxid=[^&]+/)?.[0] || "未找到wxid";
      let modifiedUrl = url.replace(/wxid=[^&]+/, "wxid=" + newWxid);
      console.log(`✅ 域名匹配: ${domain}`);
      console.log(`📦 参数键: ${paramKey}`);
      console.log(`🔄 替换前: ${before}`);
      console.log(`🔄 替换后: wxid=${newWxid}`);
      console.log("🌐 修改后链接: " + modifiedUrl);
      $done({ url: modifiedUrl });
    } else {
      console.log(`❌ 未传入参数 ${paramKey}，跳过修改`);
      $done({});
    }
    break;
  }
}

if (!matched) {
  console.log("❌ 未匹配到任何目标域名，跳过处理");
  $done({});
}
