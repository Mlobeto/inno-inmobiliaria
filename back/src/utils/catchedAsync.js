module.exports = fn => {
  return async (req, res, next) => {
      try {
          console.log(`[${fn.name}] Request params:`, req.params);
          await fn(req, res, next);
      } catch (error) {
          console.error(`[${fn.name}] Error:`, {
              message: error.message,
              stack: error.stack,
              params: req.params,
              path: req.path
          });
          next(error);
      }
  };
};
  
