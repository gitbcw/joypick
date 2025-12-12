package org.linlinjava.litemall.wx.web;

import org.linlinjava.litemall.core.express.ExpressService;
import org.linlinjava.litemall.core.express.dao.ExpressInfo;
import org.linlinjava.litemall.core.util.ResponseUtil;
import org.linlinjava.litemall.db.domain.LitemallOrder;
import org.linlinjava.litemall.db.service.LitemallOrderExpressService;
import org.linlinjava.litemall.db.service.LitemallOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/wx/internal")
public class WxInternalController {
    @Autowired
    private LitemallOrderService orderService;
    @Autowired
    private ExpressService expressService;
    @Autowired
    private LitemallOrderExpressService orderExpressService;

    @PostMapping("/snapshotBySn")
    public Object snapshotBySn(@RequestParam String orderSn,
                               @RequestParam(required = false) String customerName) {
        LitemallOrder order = orderService.findBySn(orderSn);
        if (order == null) {
            return ResponseUtil.badArgumentValue();
        }
        ExpressInfo ei = expressService.getExpressInfo(order.getShipChannel(), order.getShipSn(), customerName);
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
}

