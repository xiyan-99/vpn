// @name=主题盒子多并发兑换 by夕颜
// @desc=支持多wxid并发兑换，自动清洗兑换码，推送结果
// @author=夕颜
// @version=1.0.0
// @argument wxid=input, "wxid一行一个", tag=自定义wxid列表, desc=多个wxid支持并发兑换
// @script-protocol=http-request
// @match=^https:\/\/theme\.25mao\.com\/index\/redeem
// @requires-body=true
// @timeout=30
// @platform=loon
// @tag=主题盒子并发兑换

(async () => {
  let body = $request.body;
  let input;

  try {
    input = JSON.parse(body);
  } catch (e) {
    console.log("请求体解析失败:", body);
    $notification.post("兑换失败", "请求体不是JSON", body);
    $done({});
    return;
  }

  let { code, wxid: singleWxid } = input;

  if (!code) {
    console.log("未提供兑换码字段");
    $notification.post("兑换失败", "未提供兑换码", "");
    $done({});
    return;
  }

  // ✅ 获取参数 wxid，支持多行
  const wxids = ($argument.wxid || "")
    .split(/\n+/)
    .map(w => w.trim())
    .filter(Boolean);

  if (wxids.length === 0) {
    console.log("未传入任何 wxid");
    $notification.post("兑换失败", "未配置 wxid", "请在脚本参数中填写 wxid");
    $done({});
    return;
  }

  const rawCodes = code.split(/\n+/);
  const codes = rawCodes.map(c => c.trim().replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean)
    .map(c => (c.startsWith("TB") ? c : "TB" + c));

  console.log("原始兑换码：", rawCodes);
  console.log("清洗后的兑换码：", codes);

  // 只兑换与 wxids 等数量的 code
  const tasks = codes.slice(0, wxids.length).map((code, i) => {
    return redeem(wxids[i], code);
  });

  const results = await Promise.all(tasks);
  const success = results.filter(r => r.success).length;
  const failed = results.length - success;

  const detail = results.map((r, i) =>
    `第${i + 1}次:\nwxid: ${r.wxid}\ncode: ${r.code}\n状态: ${r.success ? "✅成功" : "❌失败"}\n信息: ${r.message}`
  ).join("\n\n");

  console.log("兑换完成：", JSON.stringify(results, null, 2));
  $notification.post(`盒子兑换完毕 ✅${success} ❌${failed}`, "", detail);
  $done({});
})();

// 发起兑换请求
function redeem(wxid, code) {
  const url = "https://theme.25mao.com/index/redeem";
  const headers = {
    "Content-Type": "application/json",
    "Origin": "https://theme.25mao.com",
    "Referer": "https://theme.25mao.com/",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
  };
  const body = JSON.stringify({ wxid, code });

  console.log(`发起请求 => wxid: ${wxid}, code: ${code}`);

  return new Promise(resolve => {
    $httpClient.post({ url, headers, body }, (err, resp, data) => {
      if (err) {
        console.log(`请求错误 <= wxid: ${wxid}, code: ${code}`, err);
        resolve({ wxid, code, success: false, message: "请求异常" });
        return;
      }

      try {
        const json = JSON.parse(data);
        console.log(`返回结果 <= wxid: ${wxid}, code: ${code}, body: ${data}`);
        resolve({
          wxid,
          code,
          success: json.code === 200,
          message: json.message || "未知响应"
        });
      } catch (e) {
        console.log(`响应解析失败 <= wxid: ${wxid}, code: ${code}`);
        resolve({ wxid, code, success: false, message: "响应解析失败" });
      }
    });
  });
}

