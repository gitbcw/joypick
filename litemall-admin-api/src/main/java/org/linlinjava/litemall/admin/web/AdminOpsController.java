package org.linlinjava.litemall.admin.web;

import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.linlinjava.litemall.admin.annotation.RequiresPermissionsDesc;
import org.linlinjava.litemall.core.util.ResponseUtil;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/ops")
@Validated
public class AdminOpsController {

    @RequiresPermissions("admin:ops:notify")
    @RequiresPermissionsDesc(menu = {"系统管理", "运营通知"}, button = "接收支付通知")
    @GetMapping("/notify-scope")
    public Object notifyScope() {
        return ResponseUtil.ok();
    }
}

