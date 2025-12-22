// Fineshare 积分查询
!(async () => {
  const token = $argument.fineshare_token || "";
  const url = "https://aivoiceover.fineshare.com/api/getcredits";

  $httpClient.get({
    url,
    headers: {
      Authorization: `Bearer ${token}`
    }
  }, function (error, response, data) {
    if (error) {
      $notification.post("🤖 Fineshare 查询失败", "", String(error));
      return $done();
    }

    try {
      const credits = JSON.parse(data)?.credits ?? "未知";
      $notification.post("🤖 Fineshare 积分", "", `积分: ${credits}`);
    } catch (e) {
      $notification.post("🤖 积分解析失败", "", String(e));
    }

    $done();
  });
})();