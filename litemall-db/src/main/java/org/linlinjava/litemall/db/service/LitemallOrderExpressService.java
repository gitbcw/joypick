package org.linlinjava.litemall.db.service;

import org.linlinjava.litemall.db.dao.LitemallOrderExpressMapper;
import org.linlinjava.litemall.db.domain.LitemallOrderExpress;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.time.LocalDateTime;

@Service
public class LitemallOrderExpressService {
    @Resource
    private LitemallOrderExpressMapper orderExpressMapper;

    public LitemallOrderExpress getByOrderId(Integer orderId) {
        return orderExpressMapper.selectByOrderId(orderId);
    }

    public void snapshot(Integer orderId, String expCode, String expNo, String customerNameSuffix,
            String vendorName, String state, String tracesJson) {
        try {
            orderExpressMapper.createTableIfNotExists();
        } catch (Exception ignore) {
        }
        LitemallOrderExpress existing = orderExpressMapper.selectByOrderId(orderId);
        LocalDateTime now = LocalDateTime.now();

        if (existing == null) {
            LitemallOrderExpress rec = new LitemallOrderExpress();
            rec.setOrderId(orderId);
            rec.setExpCode(expCode);
            rec.setExpNo(expNo);
            rec.setVendorName(vendorName);
            rec.setCustomerNameSuffix(customerNameSuffix);
            rec.setState(state);
            rec.setTracesJson(tracesJson);
            rec.setQueryTime(now);
            rec.setUpdated(now);
            orderExpressMapper.insertSelective(rec);
        } else {
            existing.setExpCode(expCode);
            existing.setExpNo(expNo);
            existing.setVendorName(vendorName);
            existing.setCustomerNameSuffix(customerNameSuffix);
            existing.setState(state);
            existing.setTracesJson(tracesJson);
            existing.setUpdated(now);
            orderExpressMapper.updateByPrimaryKeySelective(existing);
        }
    }
}
