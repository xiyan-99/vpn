// 微信点歌自定义脚本 by 夕颜
(async () => {
  try {
    const body = JSON.parse($response.body);
    const res = body.data || {};

    const fetchText = async (api) => {
      if (!api) return "";
      console.log("请求文本 API: " + api);
      return new Promise((resolve) => {
        $httpClient.get(api, (err, resp, data) => {
          if (err || !data) {
            console.log("❌ 文本请求失败: " + err);
            return resolve("");
          }
          console.log("✅ 文本 API 返回: " + data.trim());
          resolve(data.trim());
        });
      });
    };

    const fetchCoverUrl = async (api) => {
      if (!api) return "";
      const imageUrl = await fetchText(api);
      if (!imageUrl) return "";

      const uploadApi = `https://api.xiyan.pro/api/txtc.php?url=${encodeURIComponent(imageUrl)}`;
      console.log("请求封面上传接口: " + uploadApi);
      return new Promise((resolve) => {
        $httpClient.get(uploadApi, (err, resp, data) => {
          if (err || !data) {
            console.log("❌ 上传封面失败，使用原始 URL: " + imageUrl);
            return resolve(imageUrl);
          }
          try {
            const json = JSON.parse(data);
            if (json.url) {
              console.log("✅ 上传成功，返回封面 URL: " + json.url);
              return resolve(json.url);
            }
          } catch (e) {
            console.log("❌ 封面 JSON 解析失败: " + e);
          }
          resolve(imageUrl);
        });
      });
    };

    // ==== 解析原始参数 ====
    const requestUrl = $request.url || "";
    const urlParams = new URLSearchParams(requestUrl.split("?")[1] || "");
    const msgParam = decodeURIComponent(urlParams.get("msg") || "");

    console.log("🎯 请求参数 msg = " + msgParam);

    // ==== 音频处理 ====
    let musicLink = res.url || "";
    console.log("🎵 原始音频链接: " + musicLink);
    switch ($argument.pick_music) {
      case "使用抖音解析音频":
        musicLink = $persistentStore.read("dy_music_url") || musicLink;
        console.log("✅ 使用抖音音频: " + musicLink);
        break;
      case "使用快捷指令音频":
        musicLink = $persistentStore.read("kjzl_music_url") || musicLink;
        console.log("✅ 使用快捷指令音频: " + musicLink);
        break;
      case "使用自定义音频":
        musicLink = $argument.music_url || musicLink;
        console.log("✅ 使用插件音频: " + musicLink);
        break;
      default:
        console.log("✅ 使用原始音频: " + musicLink);
        break;
    }

    // ==== 歌名处理 ====
    let title = res.title || "";
    switch ($argument.pick_title) {
      case "使用自定义歌曲名":
        title = $argument.title || title;
        console.log("✅ 使用自定义歌名: " + title);
        break;
      case "使用自定义API":
        title = await fetchText($argument.api_title) || title;
        console.log("✅ 使用 API 歌名: " + title);
        break;
      default:
        console.log("✅ 使用原始歌名: " + title);
        break;
    }

    // ==== 歌手处理 ====
    let singer = res.singer || "";
    switch ($argument.pick_singer) {
      case "使用自定义歌手名":
        singer = $argument.song_singer || singer;
        console.log("✅ 使用自定义歌手: " + singer);
        break;
      case "使用自定义API":
        singer = await fetchText($argument.api_singer) || singer;
        console.log("✅ 使用 API 歌手: " + singer);
        break;
      default:
        console.log("✅ 使用原始歌手: " + singer);
        break;
    }

    // ==== 封面处理 ====
    let cover = res.cover || "";
    switch ($argument.pick_cover) {
      case "使用自定义封面":
        cover = $argument.cover || cover;
        console.log("✅ 使用自定义封面: " + cover);
        break;
      case "使用自定义API":
        cover = await fetchCoverUrl($argument.api_cover) || cover;
        break;
      case "使用随机举牌封面":
        if (!msgParam) {
          console.log("❌ 缺少 msg 参数，无法请求举牌封面");
        } else {
          const sjApi = `https://fm.xiyan.pro/?text=${encodeURIComponent(msgParam)}`;
          cover = await fetchCoverUrl(sjApi) || cover;
          console.log("✅ 使用随机举牌封面: " + cover);
        }
        break;
      default:
        console.log("✅ 使用原始封面: " + cover);
        break;
    }

    // ==== 歌词处理 ====
    let lyric = res.lyric || "";
    switch ($argument.pick_lyric) {
      case "使用自定义歌词":
        lyric = $argument.lyric || lyric;
        console.log("✅ 使用自定义歌词");
        break;
      case "使用自定义API":
      apiLyricUrl = `${$argument.api_lyric}${encodeURIComponent(msgParam)}`;
      console.log("🎵 请求歌词 API: " + apiLyricUrl);
      lyric = await fetchText(apiLyricUrl) || lyric;
      console.log("✅ 使用 API 歌词: " + lyric);
    
			
			
        break;
      default:
        console.log("✅ 使用原始歌词");
        break;
    }

    // ==== 最终返回数据 ====
    const result = {
      code: res.code || 200,
      msg: res.msg || "",
      music_url: musicLink,
      title,
      singer,
      cover,
      lyric
    };

    console.log("🎉 最终卡片数据: ");
    console.log(JSON.stringify(result, null, 2));
    $done({ body: JSON.stringify(result) });

  } catch (e) {
    console.log("❌ 处理响应体失败: " + e);
    $done({});
  }
})();