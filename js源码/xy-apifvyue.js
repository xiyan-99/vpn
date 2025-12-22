// Fineshare 字符余额查询
!(async () => {
  const token = $argument.fineshare_token || "";
  const url = "https://usage.fineshare.com/api/getmyusage";
  const requestBody = JSON.stringify({ appId: "107" });

  $httpClient.post({
    url,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json, text/plain, */*",
      "User-Agent": "WeChat/8.0.58.33 CFNetwork/1408.0.4 Darwin/22.5.0"
    },
    body: requestBody
  }, function (error, response, data) {
    if (error) {
      $notification.post("🤖 字符余额查询失败", "", String(error));
      return $done();
    }

    try {
      const json = JSON.parse(data);
      const usage = json?.usage?.find(item => item.featureid === "22");
      if (usage) {
        const totalCount = usage?.total_count || "未知";
        const availableCount = usage?.available_count || "未知";
        const msg = `总字符数: ${totalCount}，剩余字符数: ${availableCount}`;
        $notification.post("🤖 Fineshare 字符余额", "查询结果", msg);
      } else {
        $notification.post("🤖 字符余额查询错误", "未找到字符信息", "");
      }
    } catch (e) {
      $notification.post("🤖 字符余额解析失败", "", String(e));
    }
    $done();
  });
})();