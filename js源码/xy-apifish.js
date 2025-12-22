// FishAudio API 余额查询
!(async () => {
  const token = $argument.fish_token || "";
  const url = "https://api.fish.audio/wallet/self/api-credit";

  $httpClient.get({
    url,
    headers: {
      Authorization: `Bearer ${token}`
    }
  }, function (error, response, data) {
    if (error) {
      $notification.post("🐟 FishAudio 查询失败", "", String(error));
      return $done();
    }
    try {
      const json = JSON.parse(data);
      const credit = json?.credit || 0;
      $notification.post("🐟 FishAudio", "API 余额", `剩余: $${credit}`);
    } catch (e) {
      $notification.post("🐟 余额解析失败", "", String(e));
    }
    $done();
  });
})();