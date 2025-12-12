var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');

Page({
  data: {
    orderId: 0,
    orderInfo: {},
    orderGoods: [],
    expressInfo: {},
    flag: false,
    handleOption: {},
    isDemo: true,
    expressInfoReal: {}
  },
  onLoad: function(options) {
    // 页面初始化 options为页面跳转所带来的参数
    this.setData({
      orderId: options.id
    });
    this.getOrderDetail();
  },
  onPullDownRefresh() {
    wx.showNavigationBarLoading() //在标题栏中显示加载
    this.getOrderDetail();
    wx.hideNavigationBarLoading() //完成停止加载
    wx.stopPullDownRefresh() //停止下拉刷新
  },
  expandDetail: function() {
    let that = this;
    this.setData({
      flag: !that.data.flag
    })
  },
  getOrderDetail: function() {
    wx.showLoading({
      title: '加载中',
    });

    setTimeout(function() {
      wx.hideLoading()
    }, 2000);

    let that = this;
    util.request(api.OrderDetail, {
      orderId: that.data.orderId
    }).then(function(res) {
      if (res.errno === 0) {
        console.log(res.data);
        const realExpress = res.data.expressInfo || {};
        let demoExpress = realExpress;
        if (that.data.isDemo) {
          // DEMO: 快递轨迹演示数据（ZTO 78963716282576 尾号7221）
          demoExpress = {
            EBusinessID: "1904646",
            ShipperCode: "ZTO",
            LogisticCode: "78963716282576",
            Location: "惠州市",
            State: "3",
            StateEx: "304",
            Success: true,
            DeliveryManTel: "13192472891",
            Traces: [
              {
                Action: "1",
                AcceptStation: "【南通市】 快件已由南通姜灶出港称台（15665132898）揽收",
                AcceptTime: "2025-12-06 22:18:22",
                Location: "南通市"
              },
              {
                Action: "2",
                AcceptStation: "【南通市】 快件已发往 南通转运中心",
                AcceptTime: "2025-12-06 22:18:25",
                Location: "南通市"
              },
              {
                Action: "204",
                AcceptStation: "【南通市】 快件已到达 南通转运中心",
                AcceptTime: "2025-12-06 23:48:58",
                Location: "南通市"
              },
              {
                Action: "2",
                AcceptStation: "【南通市】 快件已发往 东莞转运中心",
                AcceptTime: "2025-12-06 23:52:52",
                Location: "南通市"
              },
              {
                Action: "204",
                AcceptStation: "【常州市】 快件已到达 常州转运中心",
                AcceptTime: "2025-12-07 05:39:17",
                Location: "常州市"
              },
              {
                Action: "2",
                AcceptStation: "【常州市】 快件已发往 东莞转运中心",
                AcceptTime: "2025-12-07 05:40:21",
                Location: "常州市"
              },
              {
                Action: "204",
                AcceptStation: "【东莞市】 快件已到达 东莞转运中心",
                AcceptTime: "2025-12-08 01:40:01",
                Location: "东莞市"
              },
              {
                Action: "2",
                AcceptStation: "【东莞市】 快件已发往 惠州转运中心",
                AcceptTime: "2025-12-08 01:40:08",
                Location: "东莞市"
              },
              {
                Action: "204",
                AcceptStation: "【惠州市】 快件已到达 惠州转运中心",
                AcceptTime: "2025-12-08 04:05:09",
                Location: "惠州市"
              },
              {
                Action: "2",
                AcceptStation: "【惠州市】 快件已发往 惠州大亚湾",
                AcceptTime: "2025-12-08 07:33:56",
                Location: "惠州市"
              },
              {
                Action: "2",
                AcceptStation: "【惠州市】 快件已到达 惠州大亚湾",
                AcceptTime: "2025-12-08 07:44:18",
                Location: "惠州市"
              },
              {
                Action: "202",
                AcceptStation: "惠州大亚湾 快递员【朱静,13192472891】正在为您派件",
                AcceptTime: "2025-12-08 11:15:21",
                Location: "惠州市"
              },
              {
                Action: "202",
                AcceptStation: "惠州大亚湾 快递员【朱静,13192472891】正在第2次派件",
                AcceptTime: "2025-12-08 12:10:29",
                Location: "惠州市"
              },
              {
                Action: "211",
                AcceptStation: "快件已由快递员【朱静：13192472891】送达代收点存放",
                AcceptTime: "2025-12-08 12:12:44",
                Location: "惠州市"
              },
              {
                Action: "304",
                AcceptStation: "您的快件已在代收点取出签收",
                AcceptTime: "2025-12-08 12:32:35",
                Location: "惠州市"
              }
            ]
          };
        }
        that.setData({
          orderInfo: res.data.orderInfo,
          orderGoods: res.data.orderGoods,
          handleOption: res.data.orderInfo.handleOption,
          expressInfo: demoExpress,
          expressInfoReal: realExpress
        });
      }

      wx.hideLoading();
    });
  },
  onDemoChange: function(e) {
    const checked = e.detail.value;
    if (checked) {
      this.getOrderDetail();
    } else {
      this.setData({
        expressInfo: this.data.expressInfoReal
      });
    }
  },
  // “去付款”按钮点击效果
  payOrder: function() {
    let that = this;
    util.request(api.OrderPrepay, {
      orderId: that.data.orderId
    }, 'POST').then(function(res) {
      if (res.errno === 0) {
        const payParam = res.data;
        console.log("支付过程开始");
        wx.requestPayment({
          'timeStamp': payParam.timeStamp,
          'nonceStr': payParam.nonceStr,
          'package': payParam.packageValue,
          'signType': payParam.signType,
          'paySign': payParam.paySign,
          'success': function(res) {
            console.log("支付过程成功");
            util.redirect('/pages/ucenter/order/order');
          },
          'fail': function(res) {
            console.log("支付过程失败");
            util.showErrorToast('支付失败');
          },
          'complete': function(res) {
            console.log("支付过程结束")
          }
        });
      }
    });

  },
  // “取消订单”点击效果
  cancelOrder: function() {
    let that = this;
    let orderInfo = that.data.orderInfo;

    wx.showModal({
      title: '',
      content: '确定要取消此订单？',
      success: function(res) {
        if (res.confirm) {
          util.request(api.OrderCancel, {
            orderId: orderInfo.id
          }, 'POST').then(function(res) {
            if (res.errno === 0) {
              wx.showToast({
                title: '取消订单成功'
              });
              util.redirect('/pages/ucenter/order/order');
            } else {
              util.showErrorToast(res.errmsg);
            }
          });
        }
      }
    });
  },
  // “取消订单并退款”点击效果
  refundOrder: function() {
    let that = this;
    let orderInfo = that.data.orderInfo;

    wx.showModal({
      title: '',
      content: '确定要取消此订单？',
      success: function(res) {
        if (res.confirm) {
          util.request(api.OrderRefund, {
            orderId: orderInfo.id
          }, 'POST').then(function(res) {
            if (res.errno === 0) {
              wx.showToast({
                title: '取消订单成功'
              });
              util.redirect('/pages/ucenter/order/order');
            } else {
              util.showErrorToast(res.errmsg);
            }
          });
        }
      }
    });
  },
  // “删除”点击效果
  deleteOrder: function() {
    let that = this;
    let orderInfo = that.data.orderInfo;

    wx.showModal({
      title: '',
      content: '确定要删除此订单？',
      success: function(res) {
        if (res.confirm) {
          util.request(api.OrderDelete, {
            orderId: orderInfo.id
          }, 'POST').then(function(res) {
            if (res.errno === 0) {
              wx.showToast({
                title: '删除订单成功'
              });
              util.redirect('/pages/ucenter/order/order');
            } else {
              util.showErrorToast(res.errmsg);
            }
          });
        }
      }
    });
  },
  // “确认收货”点击效果
  confirmOrder: function() {
    let that = this;
    let orderInfo = that.data.orderInfo;

    wx.showModal({
      title: '',
      content: '确认收货？',
      success: function(res) {
        if (res.confirm) {
          util.request(api.OrderConfirm, {
            orderId: orderInfo.id
          }, 'POST').then(function(res) {
            if (res.errno === 0) {
              wx.showToast({
                title: '确认收货成功！'
              });
              util.redirect('/pages/ucenter/order/order');
            } else {
              util.showErrorToast(res.errmsg);
            }
          });
        }
      }
    });
  },
  // “申请售后”点击效果
  aftersaleOrder: function () {
    if(this.data.orderInfo.aftersaleStatus === 0){
      util.redirect('/pages/ucenter/aftersale/aftersale?id=' + this.data.orderId );
    }
    else{
      util.redirect('/pages/ucenter/aftersaleDetail/aftersaleDetail?id=' + this.data.orderId);
    }
  },
  onReady: function() {
    // 页面渲染完成
  },
  onShow: function() {
    // 页面显示
  },
  onHide: function() {
    // 页面隐藏
  },
  onUnload: function() {
    // 页面关闭
  }
})
