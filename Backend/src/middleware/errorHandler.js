const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Server error";

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid id";
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = "Duplicate value already exists";
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = {
  asyncHandler,
  notFound,
  errorHandler
};
