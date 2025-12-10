## 文档结论
- 快递鸟“快递查询”API即“即时查询API”，`RequestType=1002`，按运单号+快递公司编码实时返回轨迹（https://www.kdniao.com/api-track）。
- 增值/监控类接口存在不同指令：
  - 即时查询（增值版）文档展示为 `8001`（在途监控API页，增值文档说明，含更多状态字段）：https://www.kdniao.com/api-monitor
  - 订阅接口文档常见 `8008`（订阅到快递鸟后由其推送），推送数据的 `RequestType` 可能标为 `102/101`（文档示例，见物流查询API/在途监控API页面说明）：https://www.kdniao.com/api-follow
- 你提到的“赠送用于测试的【快递查询】API”即对应 `1002` 版（免费/基础版）。该版接口参数与签名规则明确，系统级参数：`RequestData`（URL编码JSON）、`EBusinessID`、`RequestType=1002`、`DataSign`（MD5(JSON+AppKey)再Base64再URL编码）、`DataType`，请求体 JSON 字段：`ShipperCode`、`LogisticCode`、`OrderCode`（可选）［来源：即使查询API页面］。

## 现有系统映射
- 后端查询逻辑：`ExpressService.getExpressInfo(expCode, expNo)` 构造 `RequestData` 并向快递鸟正式地址 `http://api.kdniao.com/Ebusiness/EbusinessOrderHandle.aspx` 发起查询，系统参数中设置 `RequestType` 为即时查询（已在代码中体现）
  - 代码位置：`litemall-core/src/main/java/org/linlinjava/litemall/core/express/ExpressService.java:86-102`（构造请求体与系统参数、签名与 POST 调用）
  - 配置读取：`litemall-core/src/main/java/org/linlinjava/litemall/core/express/config/ExpressProperties.java:10-16,32-46`（`enable/appId/appKey/vendors`）
  - 配置文件：`litemall-core/src/main/resources/application-core.yml:53-57`（`litemall.express.enable/appId/appKey`）
- 用户端聚合：订单详情在“已发货”状态时查询物流并返回给小程序展示
  - 代码位置：`litemall-wx-api/src/main/java/org/linlinjava/litemall/wx/service/WxOrderService.java:172-234`（发货状态下调用 `expressService.getExpressInfo` 并将 `expressInfo` 放入响应）
  - 小程序展示：`litemall-wx/pages/ucenter/orderDetail/orderDetail.wxml:83-97`（显示快递公司、单号、展开轨迹列表）
- 结论：当前系统与快递鸟“快递查询（即时查询，RequestType=1002）”完全匹配；无需走订阅/增值型 `8001/8008` 才能展示轨迹。

## “快递查询”API（赠送）的使用要点
- 使用条件：在快递鸟控制台开通“物流查询（免费/赠送）”套餐；若返回“没有可用套餐”，需开通或续费后再调试［来源：官方接口页说明与错误返回语义］。
- 请求参数：
  - 系统级：`RequestData`（URL-utf8编码）、`EBusinessID`（用户ID）、`RequestType=1002`、`DataSign`（MD5(JSON+AppKey)→Base64→URL编码）、`DataType`（2 表示 JSON）
  - JSON：`ShipperCode`（快递公司编码，如 `ZTO`）、`LogisticCode`（运单号）、`OrderCode`（可选）
- 端点：正式 `https://api.kdniao.com/Ebusiness/EbusinessOrderHandle.aspx`；沙箱 `http://sandboxapi.kdniao.com:8080/kdniaosandbox/gateway/exterfaceInvoke.json`［api-track］。
- 风险与限制：日调用量限制（免费版文档示例通常提示500/日）；编码需准确，单号错误或公司编码不匹配会返回错误。

## 与 8001/8002 的差异与切换建议
- 适用场景差异：
  - `1002`：前端即时显示最新轨迹，按次调用，便捷；适合订单详情打开时查一次。
  - `8001`（增值版即时查询）：提供更丰富状态字段（如 `StateEx` 等），计费/套餐不同；文档挂在在途监控页。
  - 订阅（文档常见 `8008`）：由快递鸟持续监控并推送到你的回调地址，减少轮询成本，适合大量订单的后台监控；推送内容的 `RequestType` 在文档示例中标注为 `102/101`，视产品形态而定。
- 切换策略（不改代码的前提下）：
  - 若使用赠送的“快递查询（1002）”：保持现有实现，配置好 `EBusinessID/AppKey` 并启用即可。
  - 若希望走增值/订阅：需准备回调地址（HTTP POST）、开放外网访问并按文档校验签名；然后将发货时改为“订阅一次”+前端读缓存或拉取订阅结果，避免频繁即时查询。

## 执行方案（待你确认后可实施）
1. 启用赠送版“快递查询（1002）”
   - 在运行环境注入：`KDN_ENABLE=true`、`KDN_APP_ID=<你的ID>`、`KDN_APP_KEY=<你的Key>`
   - 后台发货填写：`shipChannel`（如 `ZTO`）与 `shipSn`（真实运单号）
   - 验证：小程序订单详情展示轨迹；管理端可加只读查询端点用于调试（如 `GET /admin/order/express`）。
2. 评估是否需要切换到增值/订阅
   - 依据调用量与成本评估，若需要：
     - 在快递鸟后台开通相应套餐（在途监控/增值版）
     - 提供回调地址与签名校验逻辑；将发货流程加入“订阅”动作（依文档 RequestType `8008`）
     - 前端展示读取我方缓存（由推送写入），必要时降级 `1002` 补齐轨迹。
3. 编码差异对照（作为后续实现参考，不立即修改）
   - 即时查询（1002）：现有 `ExpressService` 已满足；只要配置启用即可。
   - 订阅/增值（8001/8008）：需要新增回调 Controller、签名验证、存储与幂等处理，以及订阅请求的 JSON 丰富字段（可能包含收/寄地址信息等，参考在途监控页示例）。

## 参考文档链接
- 即时查询API（1002）：https://www.kdniao.com/api-track
- 在途监控API（含增值版即时查询说明、订阅/推送）：https://www.kdniao.com/api-monitor
- 物流查询API（订阅与推送说明示例）：https://www.kdniao.com/api-follow

请确认上述方案；确认后我将按第1步为你完成赠送版 `1002` 的启用与一次端到端验证，或按第2步扩展到订阅/增值模式。