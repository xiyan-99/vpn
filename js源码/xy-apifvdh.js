// Fineshare 字符兑换
!(async () => {
  const token = $argument.fineshare_token || "";
  const url = "https://aivoiceover.fineshare.com/api/redemptioncredits";
  const body = {
    type: "chars",
    limitId: 102,
    count: 1
  };

  $httpClient.post({
    url,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  }, function (error, response, data) {
    if (error) {
      $notification.post("🤖 Fineshare 兑换失败", "", String(error));
      return $done();
    }
    try {
      const json = JSON.parse(data);
      const used = json?.usedCredits || 0;
      const left = json?.availableCredits || 0;
      $notification.post("🤖 Fineshare 积分兑换", "", `成功使用 ${used}，剩余 ${left}`);
    } catch (e) {
      $notification.post("🤖 积分兑换解析失败", "", String(e));
    }
    $done();
  });
})();