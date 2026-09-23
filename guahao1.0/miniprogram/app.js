App({
  globalData: {
    envId: "prod-d5g5mxos13d3302b6",
    serviceName: "express-ko2i",
    doctors: []
  },

  onLaunch() {
    wx.cloud.init({
      env: this.globalData.envId,
      traceUser: true
    });
  }
});