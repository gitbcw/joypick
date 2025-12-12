package org.linlinjava.litemall.admin.web;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.linlinjava.litemall.admin.annotation.RequiresPermissionsDesc;
import org.linlinjava.litemall.admin.service.AdminOrderService;
import org.linlinjava.litemall.core.express.ExpressService;
import org.linlinjava.litemall.core.notify.NotifyService;
import org.linlinjava.litemall.core.util.ResponseUtil;
import org.linlinjava.litemall.core.validator.Order;
import org.linlinjava.litemall.core.validator.Sort;
import org.linlinjava.litemall.db.service.LitemallOrderExpressService;
import org.linlinjava.litemall.db.service.LitemallOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/admin/order")
@Validated
public class AdminOrderController {
    private final Log logger = LogFactory.getLog(AdminOrderController.class);

    @Autowired
    private AdminOrderService adminOrderService;
    @Autowired
    private ExpressService expressService;
    @Autowired
    private LitemallOrderExpressService orderExpressService;
    @Autowired
    private LitemallOrderService orderService;

    /**
     * 查询订单
     *
     * @param orderSn
     * @param orderStatusArray
     * @param page
     * @param limit
     * @param sort
     * @param order
     * @return
     */
    @RequiresPermissions("admin:order:list")
    @RequiresPermissionsDesc(menu = { "商场管理", "订单管理" }, button = "查询")
    @GetMapping("/list")
    public Object list(String nickname, String consignee, String orderSn,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime end,
            @RequestParam(required = false) List<Short> orderStatusArray,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer limit,
            @Sort @RequestParam(defaultValue = "add_time") String sort,
            @Order @RequestParam(defaultValue = "desc") String order) {
        return adminOrderService.list(nickname, consignee, orderSn, start, end, orderStatusArray, page, limit, sort,
                order);
    }

    /**
     * 查询物流公司
     *
     * @return
     */
    @GetMapping("/channel")
    public Object channel() {
        return ResponseUtil.ok(expressService.getVendors());
    }

    /**
     * 物流查询（按编码与单号）
     *
     * @param expCode 快递公司编码，例如 YD、ZTO、YTO 等
     * @param expNo   物流单号
     * @return 物流轨迹信息
     */
    @GetMapping("/express")
    public Object express(@RequestParam String expCode, @RequestParam String expNo,
            @RequestParam(required = false) String customerName) {
        return ResponseUtil.ok(expressService.getExpressInfo(expCode, expNo, customerName));
    }

    /**
     * 物流快照（写入/刷新指定订单的轨迹快照）
     *
     * @param orderId 订单ID
     * @return 持久化后的结果
     */
    @PostMapping("/express/snapshot")
    public Object snapshot(@RequestParam Integer orderId,
            @RequestParam(required = false) String customerName) {
        org.linlinjava.litemall.db.domain.LitemallOrder order = orderService.findById(orderId);
        if (order == null) {
            return ResponseUtil.badArgumentValue();
        }
        org.linlinjava.litemall.core.express.dao.ExpressInfo ei = expressService.getExpressInfo(order.getShipChannel(),
                order.getShipSn(), customerName);
        String mobile = order.getMobile();
        String suffix = customerName;
        if (suffix == null && mobile != null && mobile.length() >= 4) {
            suffix = mobile.substring(mobile.length() - 4);
        }
        String vendorName = expressService.getVendorName(order.getShipChannel());
        String state = ei == null ? null : ei.getState();
        String tracesJson = ei == null ? null : org.linlinjava.litemall.core.util.JacksonUtil.toJson(ei);
        orderExpressService.snapshot(order.getId(), order.getShipChannel(), order.getShipSn(), suffix,
                vendorName, state, tracesJson);
        return ResponseUtil.ok(ei);
    }

    /**
     * 物流快照（按订单编号）
     */
    @PostMapping("/express/snapshotBySn")
    public Object snapshotBySn(@RequestParam String orderSn,
            @RequestParam(required = false) String customerName) {
        org.linlinjava.litemall.db.domain.LitemallOrder order = orderService.findBySn(orderSn);
        if (order == null) {
            return ResponseUtil.badArgumentValue();
        }
        org.linlinjava.litemall.core.express.dao.ExpressInfo ei = expressService.getExpressInfo(order.getShipChannel(),
                order.getShipSn(), customerName);
        String mobile = order.getMobile();
        String suffix = customerName;
        if (suffix == null && mobile != null && mobile.length() >= 4) {
            suffix = mobile.substring(mobile.length() - 4);
        }
        String vendorName = expressService.getVendorName(order.getShipChannel());
        String state = ei == null ? null : ei.getState();
        String tracesJson = ei == null ? null : org.linlinjava.litemall.core.util.JacksonUtil.toJson(ei);
        orderExpressService.snapshot(order.getId(), order.getShipChannel(), order.getShipSn(), suffix,
                vendorName, state, tracesJson);
        return ResponseUtil.ok(ei);
    }

    /**
     * 订单详情
     *
     * @param id
     * @return
     */
    @RequiresPermissions("admin:order:read")
    @RequiresPermissionsDesc(menu = { "商场管理", "订单管理" }, button = "详情")
    @GetMapping("/detail")
    public Object detail(@NotNull Integer id) {
        return adminOrderService.detail(id);
    }

    /**
     * 订单退款
     *
     * @param body 订单信息，{ orderId：xxx }
     * @return 订单退款操作结果
     */
    @RequiresPermissions("admin:order:refund")
    @RequiresPermissionsDesc(menu = { "商场管理", "订单管理" }, button = "订单退款")
    @PostMapping("/refund")
    public Object refund(@RequestBody String body) {
        return adminOrderService.refund(body);
    }

    /**
     * 发货
     *
     * @param body 订单信息，{ orderId：xxx, shipSn: xxx, shipChannel: xxx }
     * @return 订单操作结果
     */
    @RequiresPermissions("admin:order:ship")
    @RequiresPermissionsDesc(menu = { "商场管理", "订单管理" }, button = "订单发货")
    @PostMapping("/ship")
    public Object ship(@RequestBody String body) {
        return adminOrderService.ship(body);
    }

    @RequiresPermissions("admin:order:pay")
    @RequiresPermissionsDesc(menu = { "商场管理", "订单管理" }, button = "订单收款")
    @PostMapping("/pay")
    public Object pay(@RequestBody String body) {
        return adminOrderService.pay(body);
    }

    /**
     * 删除订单
     *
     * @param body 订单信息，{ orderId：xxx }
     * @return 订单操作结果
     */
    @RequiresPermissions("admin:order:delete")
    @RequiresPermissionsDesc(menu = { "商场管理", "订单管理" }, button = "订单删除")
    @PostMapping("/delete")
    public Object delete(@RequestBody String body) {
        return adminOrderService.delete(body);
    }

    /**
     * 回复订单商品
     *
     * @param body 订单信息，{ orderId：xxx }
     * @return 订单操作结果
     */
    @RequiresPermissions("admin:order:reply")
    @RequiresPermissionsDesc(menu = { "商场管理", "订单管理" }, button = "订单商品回复")
    @PostMapping("/reply")
    public Object reply(@RequestBody String body) {
        return adminOrderService.reply(body);
    }
}
