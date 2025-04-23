const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware function to check for valid JWT
const authMiddleware = async (req, res, next) => {
  // Get token from the Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      error: {
        message: 'Unauthorized: No token provided'
      }
    });
  }

  // Extract the token
  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID and ensure their status is active
    const user = await User.findOne({
      where: {
        id_user: decoded.id,
        status: 'active'
      }
    });

    // If user is not found or status is not active, reject the request
    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZE',
        error: {
          message: 'Unauthorized: User not found'
        }
      });
    }

    // Attach user data to request object
    req.user = user; // Attach user object to request

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    // Handle errors (e.g., invalid token)
    res.status(401).json({
      success: false,
      code: 'UNAUTHORIZE',
      error: {
        message: 'Unauthorized: Invalid token'
      }
    });
  }
};

module.exports = authMiddleware;