package org.linlinjava.litemall.db.dao;

import org.apache.ibatis.annotations.Param;
import org.linlinjava.litemall.db.domain.LitemallOrderExpress;

public interface LitemallOrderExpressMapper {
    int insertSelective(LitemallOrderExpress record);

    LitemallOrderExpress selectByOrderId(@Param("orderId") Integer orderId);

    int updateByPrimaryKeySelective(LitemallOrderExpress record);

    void createTableIfNotExists();
}
