/**
 * Middleware pour logger toutes les requêtes et réponses
 */

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip;

  // Log la requête
  console.log(`\n📨 [${new Date().toISOString()}] ${method} ${url}`);
  console.log(`   IP: ${ip}`);
  console.log(`   Body:`, JSON.stringify(req.body, null, 2));
  if (req.headers.authorization) {
    console.log(`   Auth: ${req.headers.authorization.substring(0, 50)}...`);
  }

  // Intercepter la réponse
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log la réponse
    console.log(`📤 Response [${statusCode}] - ${duration}ms`);
    console.log(`   Data:`, JSON.stringify(data, null, 2));

    // Appeler la fonction originale
    return originalJson.call(this, data);
  };

  next();
};

module.exports = requestLogger;
