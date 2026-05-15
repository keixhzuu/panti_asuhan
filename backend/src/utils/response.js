function sendSuccess(res, message, data = null, statusCode = 200) {
  return res.status(statusCode).json({
    message,
    data
  });
}

module.exports = {
  sendSuccess
};
