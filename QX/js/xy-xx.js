// @author xiyan

const isResponse = typeof $response !== "undefined";

if (!isResponse) {
  // 请求阶段处理，移除缓存头
  const headers = $request.headers;
  delete headers["x-revenuecat-etag"];
  delete headers["X-RevenueCat-ETag"];
  $done({ headers });
} else {
  // 响应阶段处理
  try {
    const body = JSON.parse($response.body);
    const UA = $request.headers["User-Agent"] || $request.headers["user-agent"];
    
    const mappings = {
      "ClipyBoard": { name: "premium", id: "clipyboard_yearly" },
      "Wake%20Music": { name: "premium", id: "com.OfflineMusic.www.lifetime298" },
      "Spark": { name: "premium", id: "spark_c_5999_1y_d50" },
      "VSCO": { name: "pro", id: "vscopro_global_5999_annual_7D_free" },
      "Pillow": { name: "premium", id: "com.neybox.pillow.premium.yearly" },
      // 添加更多应用识别 UA...
    };

    const unlockInfo = {
      "expires_date": "2099-12-31T12:00:00Z",
      "original_purchase_date": "2023-09-01T11:00:00Z",
      "purchase_date": "2023-09-01T11:00:00Z",
      "ownership_type": "PURCHASED",
      "store": "app_store"
    };

    for (const key in mappings) {
      const reg = new RegExp(key, "i");
      if (reg.test(UA)) {
        const { name, id } = mappings[key];
        body.subscriber = body.subscriber || {};
        body.subscriber.subscriptions = {};
        body.subscriber.entitlements = {};
        body.subscriber.subscriptions[id] = unlockInfo;
        body.subscriber.entitlements[name] = {
          ...unlockInfo,
          product_identifier: id
        };
        break;
      }
    }

    $done({ body: JSON.stringify(body) });
  } catch (e) {
    console.log("❌ RevenueCat 解锁失败:", e);
    $done({});
  }
}