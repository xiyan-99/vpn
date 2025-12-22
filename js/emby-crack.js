/**
 * Emby 会员解锁脚本 - 三端通用
 * 兼容 Surge / Loon / Quantumult X
 * @author xiyan
 */

const url = $request.url;

const myStatus = "HTTP/1.1 200 OK";
const myHeaders = {
  "Crack": "KS",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Method": "*",
  "Access-Control-Allow-Credentials": "true"
};

let obj = {};

if (url.indexOf('/admin/service/registration/validateDevice') != -1) {
  obj = {
    "cacheExpirationDays": 365,
    "message": "Device Valid",
    "resultCode": "GOOD"
  };
} else if (url.indexOf('/admin/service/appstore/register') != -1) {
  obj = {
    "featId": "",
    "registered": true,
    "expDate": "2099-09-09",
    "key": ""
  };
} else if (url.indexOf('/admin/service/registration/validate') != -1) {
  obj = {
    "featId": "",
    "registered": true,
    "expDate": "2099-09-09",
    "key": ""
  };
} else if (url.indexOf('/admin/service/registration/getStatus') != -1) {
  obj = {
    "planType": "Cracked",
    "deviceStatus": "",
    "subscriptions": []
  };
} else if (url.indexOf('/admin/service/supporter/retrievekey') != -1) {
  obj = {
    "Success": false,
    "ErrorMessage": "Supporter not found"
  };
}

const myData = JSON.stringify(obj);

$done({
  status: myStatus,
  headers: myHeaders,
  body: myData
});

