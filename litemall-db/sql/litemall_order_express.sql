CREATE TABLE IF NOT EXISTS `litemall_order_express` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL COMMENT '订单ID',
  `exp_code` varchar(16) NOT NULL COMMENT '快递公司编码',
  `exp_no` varchar(64) NOT NULL COMMENT '物流单号',
  `vendor_name` varchar(64) DEFAULT NULL COMMENT '快递公司名称',
  `customer_name_suffix` varchar(8) DEFAULT NULL COMMENT '手机号后四位（条件字段）',
  `state` varchar(16) DEFAULT NULL COMMENT '当前物流状态码',
  `traces_json` mediumtext COMMENT '快递鸟返回的完整JSON',
  `query_time` datetime DEFAULT NULL COMMENT '首次快照时间',
  `updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_order` (`order_id`),
  KEY `idx_expno` (`exp_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单快递轨迹快照';

