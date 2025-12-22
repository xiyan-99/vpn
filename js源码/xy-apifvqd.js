// Fineshare 签到并获取积分信息（最终修正版）

!(async () => {
  const token = $argument.fineshare_token || "";
  if (!token) {
    $notification.post("🤖 Fineshare 签到失败", "未设置Token", "请在插件参数填写 fineshare_token");
    return $done();
  }

  const url = "https://aivoiceover.fineshare.com/api/checkin";
  const headers = {
    "authorization": `Bearer ${token}`,
    "accept": "application/json, text/plain, */*",
    "referer": "https://finevoice.fineshare.com/",
    "user-agent": "WeChat/8.0.59.32 CFNetwork/1408.0.4 Darwin/22.5.0",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "accept-language": "zh-CN,zh;q=0.9",
    "accept-encoding": "gzip, deflate, br"
  };

  $httpClient.get({ url, headers }, (error, response, data) => {
    if (error) {
      $notification.post("🤖 Fineshare 签到失败", "网络请求错误", String(error));
      console.log("❌ 网络错误:", error);
      return $done();
    }

    try {
      const json = JSON.parse(data);
      const credits = json.credits ?? "未知";
      const acquired = json.acquiredCredits ?? "未知";
      const err = json.error || {};
      const code = err.code || "";
      const message = err.message;

      if (code === "0028" && message === "You have already checked in today.") {
        $notification.post("🤖 Fineshare 签到", "今日已签到过，明天再签到吧！", ` 获得积分: ${acquired}`);
      } else if (code === "0001" && message === null) {
        $notification.post("🤖 Fineshare 签到成功", "签到成功", `当前积分: ${credits}，获得积分: ${acquired}`);
      } else {
        $notification.post("🤖 Fineshare 签到失败", message || "未知错误", `错误码: ${code}`);
      }

    } catch (e) {
      $notification.post("🤖 签到响应解析失败", "", String(e));
      console.log("❌ 解析错误:", e, "\n响应内容:", data);
    }

    $done();
  });
})();