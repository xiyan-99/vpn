/**
 * AI 接口 wxid 授权脚本 - 三端通用
 * 支持多个 AI 接口域名的 wxid 注入
 * 兼容 Surge / Loon / Quantumult X
 * @author xiyan wx: 1418581664
 */

const url = $request.url;
const headers = $request.headers;

// AI 接口域名与 wxid 映射关系
const AI_CONFIGS = {
  "ai.cios.top": "wxid_gewflp92k3c522",
  "gpt.cios.top": "wxid_gewflp92k3c522",
  "gpt.9527cleo.com": "hy894476729",
  "ai.vvios.com": "wxid_5t4ypj00k66j22",
  "ai.ssios.top": "wxid_nc0g8hupkdw212"
};

// 查找匹配的域名并注入 wxid
for (const [domain, wxid] of Object.entries(AI_CONFIGS)) {
  if (url.includes(domain)) {
    headers.wxid = wxid;
    console.log(`✅ 已为 ${domain} 注入 wxid`);
    $done({ headers });
    break;
  }
}

// 如果没有匹配到任何域名，直接放行
console.log("ℹ️ 未匹配到配置的 AI 域名");
$done({});

