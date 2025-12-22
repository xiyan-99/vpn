/**
 * 微信小火花 wxid 列表注入 - 三端通用
 * 兼容 Surge / Loon / Quantumult X
 * @author xiyan wx: 1418581664
 * 备注：加夕颜微信 1418581664 备注小火花即可使用
 */

const newWxids = [
  "NDQxODkwMTg3MjVAY2hhdHJvb20=",
  "NDM1MjEwMzA3MzVAY2hhdHJvb20=",
  "d3hpZF80Z3hja3N3dzVsdzgxMg=="
];

$done({
  body: JSON.stringify(newWxids)
});

