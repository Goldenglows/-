Page({
  data: {
    doctors: []
  },

  onLoad() {
    this.loadDoctors();
  },

  onShow() {
    this.loadDoctors();
  },

  loadDoctors() {
    const app = getApp();

    wx.cloud.callContainer({
      config: {
        env: app.globalData.envId
      },
      path: "/api/doctors",
      method: "GET",
      header: {
        "X-WX-SERVICE": app.globalData.serviceName
      }
    })
      .then(res => {
        if (!res.data || !res.data.success) {
          wx.showToast({
            title: "获取医生信息失败",
            icon: "none"
          });
          return;
        }

        const doctors = res.data.data || [];

        this.setData({
          doctors
        });

        app.globalData.doctors = doctors;
      })
      .catch(error => {
        console.error(
          "获取医生失败:",
          error
        );

        wx.showToast({
          title: "服务器连接失败",
          icon: "none"
        });
      });
  },

  addView(doctorId) {
    const app = getApp();

    return wx.cloud.callContainer({
      config: {
        env: app.globalData.envId
      },
      path: `/api/views?doctorId=${doctorId}`,
      method: "GET",
      header: {
        "X-WX-SERVICE": app.globalData.serviceName
      }
    })
      .then(res => {
        if (
          !res.data ||
          !res.data.success
        ) {
          console.error(
            "记录浏览失败:",
            res.data
          );
        }

        return res.data;
      })
      .catch(error => {
        console.error(
          "记录浏览失败:",
          error
        );

        return null;
      });
  },

  register(e) {
    const doctorId =
      e.currentTarget.dataset.id;

    // 点击预约挂号按钮立即记录浏览
    this.addView(doctorId);

    wx.navigateTo({
      url:
        `/pages/register/register?id=${doctorId}&type=normal`
    });
  },

  fastRegister(e) {
    const doctorId =
      e.currentTarget.dataset.id;

    // 点击极速问诊按钮立即记录浏览
    this.addView(doctorId);

    wx.navigateTo({
      url:
        `/pages/register/register?id=${doctorId}&type=fast`
    });
  },

  quickRegister() {
    const doctors =
      this.data.doctors || [];

    if (!doctors.length) {
      wx.showToast({
        title: "暂无医生信息",
        icon: "none"
      });
      return;
    }

    const availableDoctors =
      doctors.filter(
        doctor =>
          doctor.nextDateTime
      );

    if (!availableDoctors.length) {
      wx.showToast({
        title: "暂无可预约号源",
        icon: "none"
      });
      return;
    }

    availableDoctors.sort(
      (a, b) => {
        return (
          new Date(
            a.nextDateTime
          ).getTime() -
          new Date(
            b.nextDateTime
          ).getTime()
        );
      }
    );

    const doctor =
      availableDoctors[0];

    // 手机号快捷预约自动选择医生
    // 同样记录该医生一次浏览
    this.addView(doctor.id);

    wx.navigateTo({
      url:
        `/pages/register/register?id=${doctor.id}&type=normal`
    });
  }
});