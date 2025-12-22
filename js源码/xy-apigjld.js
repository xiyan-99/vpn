// SiliconFlow API 余额查询
!(async () => {
  const token = $argument.silicon_token || "";
  const url = "https://api.siliconflow.cn/v1/user/info";

  $httpClient.get({
    url,
    headers: {
      Authorization: `Bearer ${token}`
    }
  }, function (error, response, data) {
    if (error) {
      $notification.post("💻 SiliconFlow 查询失败", "", String(error));
      return $done();
    }
    try {
      const json = JSON.parse(data)?.data || {};
      const balance = json.balance ?? "未知";
      const status = json.status ?? "未知";
      $notification.post("💻 SiliconFlow", "API 余额", `可用: ¥${balance}，状态: ${status}`);
    } catch (e) {
      $notification.post("💻 余额解析失败", "", String(e));
    }
    $done();
  });
})();