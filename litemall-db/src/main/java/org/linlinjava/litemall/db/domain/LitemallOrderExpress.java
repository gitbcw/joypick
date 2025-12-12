package org.linlinjava.litemall.db.domain;

import java.time.LocalDateTime;

public class LitemallOrderExpress {
    private Integer id;
    private Integer orderId;
    private String expCode;
    private String expNo;
    private String vendorName;
    private String customerNameSuffix;
    private String state;
    private String tracesJson;
    private LocalDateTime queryTime;
    private LocalDateTime updated;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public String getExpCode() {
        return expCode;
    }

    public void setExpCode(String expCode) {
        this.expCode = expCode;
    }

    public String getExpNo() {
        return expNo;
    }

    public void setExpNo(String expNo) {
        this.expNo = expNo;
    }

    public String getVendorName() {
        return vendorName;
    }

    public void setVendorName(String vendorName) {
        this.vendorName = vendorName;
    }

    public String getCustomerNameSuffix() {
        return customerNameSuffix;
    }

    public void setCustomerNameSuffix(String customerNameSuffix) {
        this.customerNameSuffix = customerNameSuffix;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getTracesJson() {
        return tracesJson;
    }

    public void setTracesJson(String tracesJson) {
        this.tracesJson = tracesJson;
    }

    public LocalDateTime getQueryTime() {
        return queryTime;
    }

    public void setQueryTime(LocalDateTime queryTime) {
        this.queryTime = queryTime;
    }

    public LocalDateTime getUpdated() {
        return updated;
    }

    public void setUpdated(LocalDateTime updated) {
        this.updated = updated;
    }
}

