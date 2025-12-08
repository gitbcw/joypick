# MVP本周改造计划

## 背景与目标
- 采用成熟框架作为基础，快速搭建可用的MVP版本以供客户体验。
- 在不大幅改动后端的前提下，引入“运营介入发货”的流程与通知机制。
- 前端以权限控制与UI裁剪为主，呈现符合MVP的简化体验。

## MVP版本实现功能范围
- 小程序、后台管理系统项目整体框架搭建
- 核心业务流程：管理端商品分类、活动设定、商品上架 → 小程序活动和商品正确展示 → 用户对商品下单 → 订单流转（订单触达到运营人员，运营人员联系发货，回传快递单号流转订单状态）

## 核心流程（快递型商品）
- 用户下单并支付，订单进入“已付款未发货”（`201`）。
- 运营人员收到新订单通知（邮件/短信），联系供应商安排发货。
- 运营在管理后台回填快递公司与运单号，订单切换为“已发货”（`301`），系统短信通知用户。
- 用户查看物流并在收到后确认收货，订单进入“已收货”（`401`/`402`）。

## 角色与职责
- 用户：下单、支付、查看物流、确认收货、申请退款/售后。
- 门店运营人员：接收订单通知、联系供应商进行快递发货、在后台执行“发货”并回填运单信息。
- 运营管理人员（选品/活动）：负责商品分类、活动设定与商品上架策略。
- 供应商：按门店运营人员对接安排实际快递发货。

## 运营视角校验清单
- 完成商品分类与活动配置（管理后台）
- 商品上架并设置库存、价格与展示图（管理后台）
- 小程序首页/活动页正确展示商品与活动（小程序端）
- 用户下单与支付流程正常（小程序端）
- 支付成功后运营收到新订单邮件（`litemall.notify.mail.sendto`）
- 运营联系供应商安排发货（线下）
- 管理后台回填快递公司与运单号并发货（`POST /admin/order/ship`）
- 用户收到发货短信并可查看物流（`NotifyType.SHIP`，订单状态为`301`）
- 用户确认收货，订单完成（`401/402`）

## 后端改动策略
- 尽量不改动后端业务逻辑，复用既有订单状态与接口：
  - 订单状态：`201`（已付款未发货）→`301`（已发货）→`401/402`（已收货）见 `litemall-db/src/main/java/org/linlinjava/litemall/db/util/OrderUtil.java:24`。
  - 管理后台发货接口：`POST /admin/order/ship`，回填 `shipChannel/shipSn` 并触发短信通知，见 `litemall-admin-api/src/main/java/org/linlinjava/litemall/admin/service/AdminOrderService.java:194`、`AdminOrderService.java:220-224`。
  - 支付成功后邮件通知运营人员，见 `litemall-wx-api/src/main/java/org/linlinjava/litemall/wx/service/WxOrderService.java:515`、`WxOrderService.java:815`；退款申请邮件通知见 `WxOrderService.java:865`。
- 已集成短信与邮件通知能力：
  - 通知服务：`litemall-core/src/main/java/org/linlinjava/litemall/core/notify/NotifyService.java:24-31`、`NotifyService.java:89-99`、`NotifyService.java:38-44`、`NotifyService.java:54-65`。
  - 通知类型枚举：`litemall-core/src/main/java/org/linlinjava/litemall/core/notify/NotifyType.java:3-7`（`PAY_SUCCEED/SHIP/REFUND/CAPTCHA`）。
  - 通知配置自动装配：`litemall-core/src/main/java/org/linlinjava/litemall/core/notify/config/NotifyAutoConfiguration.java:25-49`、`NotifyAutoConfiguration.java:36-46`。

## 前端/管理后台MVP改造建议
- 管理后台：保留订单列表与“发货”操作，弱化非必须入口（如批量、复杂配置）。
- 小程序端：保留下单、支付、订单列表、物流查询与确认收货；对不需要的页面通过路由与权限隐藏。
- 通过权限控制实现MVP裁剪：将非MVP功能按钮/菜单隐藏，不动后端接口。

## 通知方案
- 邮件：使用 `litemall.notify.mail` 配置，将 `sendto` 设置为运营人员邮箱，以接收“新订单通知”“退款申请”。
- 短信：使用 `litemall.notify.sms` 配置，开启并选择 `active` 为 `aliyun` 或 `tencent`，设置签名与模板；
  - 发货短信：用户在发货后自动收到（运单公司与单号），参考 `AdminOrderService.java:220-224`。
  - 支付成功短信：用户在支付成功后收到（订单号后6位），参考 `WxOrderService.java:517`、`WxOrderService.java:817`。
  - 门店运营人员短信（可选）：如需给门店运营人员发短信，建议在配置中加入门店运营人员手机号列表，并在支付成功回调处追加发送；当前MVP默认使用邮件通知，避免后端改动。

### 运营手机号配置建议（可选）
- 配置结构建议：

```
litemall:
  notify:
    sms:
      enable: true
      active: aliyun # 或 tencent
      sign: <短信签名>
      operators:
        - 13800000000
        - 13900000000
```

- 最小实现建议：在支付成功逻辑处，给 `operators` 列表中的手机号发送 `NotifyType.PAY_SUCCEED` 模板短信：
  - 同步位置：`litemall-wx-api/src/main/java/org/linlinjava/litemall/wx/service/WxOrderService.java:517`、`WxOrderService.java:817`
  - 发送方式：`notifyService.notifySmsTemplateSync(<operatorPhone>, NotifyType.PAY_SUCCEED, new String[]{orderSn后6位})`
  - 如保持MVP不改后端，则仅启用邮件通知即可。

## 配置项指引
- `application.yml` 示例（在环境配置中启用/完善）：
  - 邮件：`litemall.notify.mail.enable/sendto/sendfrom/host/username/password/port`，参考 `docker/litemall/application.yml:52`。
  - 短信：`litemall.notify.sms.enable/active/sign/.../template`，对应属性见 `litemall-core/src/main/java/org/linlinjava/litemall/core/notify/config/NotifyProperties.java:95-201`。

## 接口清单（MVP使用）
- 管理后台：
  - `POST /admin/order/ship` 发货（运营人员执行）
- 小程序端：
  - `GET /wx/order/list` 订单列表（待发货/待收货/待评价）
  - `GET /wx/order/detail` 订单详情（含物流信息）
  - `POST /wx/order/confirm` 确认收货
  - `POST /wx/order/refund` 申请退款（MVP可按需开放）

## 本周任务清单
- 配置与验证订单短信通知门店运营人员。
- 配置与验证发货短信通知用户（`SHIP` 模板）。
- 管理后台：确认并保留“订单发货”流程入口，弱化非MVP入口。
- 小程序端：隐藏非MVP页面入口，保留下单/支付/订单/物流/确认收货。
- 验证端口与服务运行：`8083`（管理后端）、`8082`（小程序后端）连通。

## 风险与注意事项
- 通知模板与签名需在短信平台审核通过后方可发送。
- 邮件服务不同供应商可能需要额外SSL/STARTTLS配置（已在自动装配中考虑）。
- MVP通过UI与权限裁剪避免后端改动，但如需运营短信通知，需引入运营手机号配置或轻微后端扩展。
