function success(res, data = null, message = "success") {
  return res.json({
    success: true,
    message,
    data
  });
}

function error(res, message = "请求失败", status = 500) {
  return res.status(status).json({
    success: false,
    message
  });
}

module.exports = {
  success,
  error
};