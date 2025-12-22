// DeepSeek 余额查询
!(async () => {
  const token = $argument.deepseek_token || "";
  const url = "https://api.deepseek.com/user/balance";

  $httpClient.get({
    url,
    headers: {
      Authorization: `Bearer ${token}`
    }
  }, function (error, response, data) {
    if (error) {
      $notification.post("🤖 DeepSeek 查询失败", "", String(error));
      return $done();
    }
    try {
      const json = JSON.parse(data);
      const info = json.balance_infos?.[0];
      const total = info?.total_balance || 0;
      const grant = info?.granted_balance || 0;
      $notification.post("🤖 DeepSeek", "API 余额", `剩余: ¥${total}，赠送: ¥${grant}`);
    } catch (e) {
      $notification.post("🤖 DeepSeek 查询错误", "", String(e));
    }
    $done();
  });
})();