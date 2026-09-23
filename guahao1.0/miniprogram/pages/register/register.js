Page({
  data: {
    type: "normal",
    typeName: "预约挂号",

    doctor: null,
    price: 0,

    diseases: [],
    diseaseIndex: -1,

    dates: [],
    dateIndex: -1,

    times: [],
    timeIndex: -1,

    schedules: {},

    patientName: "",
    phone: "",
    description: "",

    submitting: false
  },

  onLoad(options) {
    const app = getApp();

    const type =
      options.type === "fast"
        ? "fast"
        : "normal";

    const doctorId = options.id;

    const doctor = (
      app.globalData.doctors || []
    ).find(item => {
      return String(item.id) === String(doctorId);
    });

    if (!doctor) {
      wx.showToast({
        title: "医生信息不存在",
        icon: "none"
      });

      return;
    }

    this.setData({
      doctor,
      type,
      typeName:
        type === "fast"
          ? "极速问诊"
          : "预约挂号",
      price:
        type === "fast"
          ? Number(doctor.fastPrice || 0)
          : Number(doctor.price || 0)
    });

    this.loadDiseases();
    this.loadSchedules();
  },

  loadDiseases() {
    const app = getApp();

    wx.cloud.callContainer({
      config: {
        env: app.globalData.envId
      },
      path: "/api/diseases",
      method: "GET",
      header: {
        "X-WX-SERVICE": app.globalData.serviceName
      }
    })
      .then(res => {
        if (!res.data || !res.data.success) {
          wx.showToast({
            title: "获取病种失败",
            icon: "none"
          });

          return;
        }

        this.setData({
          diseases: res.data.data || [],
          diseaseIndex: -1
        });
      })
      .catch(error => {
        console.error("获取病种失败:", error);

        wx.showToast({
          title: "获取病种失败",
          icon: "none"
        });
      });
  },

  loadSchedules() {
    const app = getApp();

    wx.cloud.callContainer({
      config: {
        env: app.globalData.envId
      },
      path: `/api/schedules/${this.data.doctor.id}`,
      method: "GET",
      header: {
        "X-WX-SERVICE": app.globalData.serviceName
      }
    })
      .then(res => {
        if (!res.data || !res.data.success) {
          wx.showToast({
            title: "获取号源失败",
            icon: "none"
          });

          return;
        }

        const schedules = res.data.data || [];
        const dateMap = {};

        schedules.forEach(item => {
          if (Number(item.remaining) <= 0) {
            return;
          }

          if (!dateMap[item.date]) {
            dateMap[item.date] = [];
          }

          dateMap[item.date].push(item);
        });

        const dates = Object.keys(dateMap)
          .sort()
          .map(date => {
            return {
              value: date,
              text: date
            };
          });

        this.setData({
          dates,
          schedules: dateMap,
          dateIndex: -1,
          timeIndex: -1,
          times: []
        });
      })
      .catch(error => {
        console.error("获取号源失败:", error);

        wx.showToast({
          title: "获取号源失败",
          icon: "none"
        });
      });
  },

  chooseDisease(e) {
    this.setData({
      diseaseIndex: Number(e.detail.value)
    });
  },

  chooseDate(e) {
    const dateIndex = Number(e.detail.value);
    const date = this.data.dates[dateIndex];

    if (!date) {
      return;
    }

    const schedules =
      this.data.schedules[date.value] || [];

    const now = new Date();

    const times = schedules
      .filter(item => {
        if (Number(item.remaining) <= 0) {
          return false;
        }

        const scheduleDateTime = new Date(
          `${item.date}T${item.time}:00`
        );

        return scheduleDateTime > now;
      })
      .map(item => item.time);

    this.setData({
      dateIndex,
      times,
      timeIndex: -1
    });
  },

  chooseTime(e) {
    this.setData({
      timeIndex: Number(e.detail.value)
    });
  },

  inputName(e) {
    this.setData({
      patientName: e.detail.value
    });
  },

  inputPhone(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  inputDescription(e) {
    this.setData({
      description: e.detail.value
    });
  },

  getPhoneNumber(e) {
    if (
      !e.detail ||
      !e.detail.code
    ) {
      wx.showToast({
        title: "未获取手机号",
        icon: "none"
      });

      return;
    }

    const app = getApp();

    wx.showLoading({
      title: "获取手机号..."
    });

    wx.cloud.callContainer({
      config: {
        env: app.globalData.envId
      },
      path: "/api/user/phone",
      method: "POST",
      header: {
        "X-WX-SERVICE": app.globalData.serviceName,
        "content-type": "application/json"
      },
      data: {
        code: e.detail.code
      }
    })
      .then(res => {
        wx.hideLoading();

        if (
          res.data &&
          res.data.success &&
          res.data.phone
        ) {
          this.setData({
            phone: res.data.phone
          });

          wx.showToast({
            title: "手机号已获取",
            icon: "success"
          });

          return;
        }

        wx.showToast({
          title:
            res.data?.message ||
            "手机号获取失败",
          icon: "none"
        });
      })
      .catch(error => {
        wx.hideLoading();

        console.error(
          "手机号获取失败:",
          error
        );

        wx.showToast({
          title: "手机号获取失败",
          icon: "none"
        });
      });
  },

  submit() {
    if (this.data.submitting) {
      return;
    }

    const {
      doctor,
      type,
      diseaseIndex,
      dateIndex,
      timeIndex,
      patientName,
      phone,
      description,
      diseases,
      dates,
      times
    } = this.data;

    if (!doctor) {
      wx.showToast({
        title: "医生信息不存在",
        icon: "none"
      });

      return;
    }

    if (
      diseaseIndex < 0 ||
      !diseases[diseaseIndex]
    ) {
      wx.showToast({
        title: "请选择病种",
        icon: "none"
      });

      return;
    }

    if (
      dateIndex < 0 ||
      !dates[dateIndex]
    ) {
      wx.showToast({
        title: "请选择就诊日期",
        icon: "none"
      });

      return;
    }

    if (
      timeIndex < 0 ||
      !times[timeIndex]
    ) {
      wx.showToast({
        title: "请选择预约时段",
        icon: "none"
      });

      return;
    }

    if (!patientName.trim()) {
      wx.showToast({
        title: "请输入患者姓名",
        icon: "none"
      });

      return;
    }

    if (
      !/^1[3-9]\d{9}$/.test(phone)
    ) {
      wx.showToast({
        title: "请输入正确手机号",
        icon: "none"
      });

      return;
    }

    const appointmentDate =
      dates[dateIndex].value;

    const appointmentTime =
      times[timeIndex];

    const appointmentDateTime =
      new Date(
        `${appointmentDate}T${appointmentTime}:00`
      );

    if (
      appointmentDateTime <= new Date()
    ) {
      wx.showToast({
        title: "该时间已经无法预约",
        icon: "none"
      });

      this.loadSchedules();

      return;
    }

    const app = getApp();

    this.setData({
      submitting: true
    });

    wx.showLoading({
      title: "提交中..."
    });

    wx.cloud.callContainer({
      config: {
        env: app.globalData.envId
      },
      path: "/api/appointments",
      method: "POST",
      header: {
        "X-WX-SERVICE": app.globalData.serviceName,
        "content-type": "application/json"
      },
      data: {
        doctorId: doctor.id,
        type,
        disease:
          diseases[diseaseIndex].name,
        date: appointmentDate,
        time: appointmentTime,
        patientName:
          patientName.trim(),
        phone,
        description:
          description.trim()
      }
    })
      .then(res => {
        wx.hideLoading();

        this.setData({
          submitting: false
        });

        if (
          !res.data ||
          res.data.success === false
        ) {
          wx.showToast({
            title:
              res.data?.message ||
              "预约失败",
            icon: "none"
          });

          return;
        }

        wx.showModal({
          title: "预约成功",
          content:
            `专家：${doctor.name}\n` +
            `日期：${appointmentDate}\n` +
            `时间：${appointmentTime}\n` +
            `费用：¥${res.data.price}`,
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
      })
      .catch(error => {
        wx.hideLoading();

        this.setData({
          submitting: false
        });

        console.error(
          "提交预约失败:",
          error
        );

        wx.showToast({
          title: "服务器连接失败",
          icon: "none"
        });
      });
  }
});