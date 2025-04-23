const UsersService = require("../services/userService");
const User = require("../models/userModel"); // Adjust the path to your models if needed
const UserLogAccessModel = require("../models/userLogAccessModel"); // Adjust the path to your models if needed
const bcrypt = require("bcryptjs"); // For hashing passwords
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const {
  sendEmailFunction
} = require("../mail_templates/index");

const {
  validationResult
} = require("express-validator"); // For request validation
const {
  loginWithGoogle
} = require("../utils/userUtilities");
const jwt = require("jsonwebtoken");
const validator = require('validator');
const e = require("express");
const {
  Op
} = require("sequelize");

const getOneUsers = async (req, res) => {
  try {
    const {
      id_user
    } = req.params;

    if (!id_user) {
      res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        error: {
          message: "can't get id_user",
        },
      });
    }

    const user = await User.findOne({
      where: {
        id_user,
        status: "active",
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "user not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1, pageSize = 10
    } = req.body;
    const {
      status
    } =
    req.body && req.body.filter ?
      req.body.filter : {
        status: "active",
      };

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    const users = await User.findAndCountAll({
      where: {
        status,
      },
      offset,
      limit,
    });

    res.status(200).json({
      success: true,
      totalItems: users.count,
      totalPages: Math.ceil(users.count / pageSize),
      currentPage: parseInt(page),
      users: users.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

const login = async (req, res) => {
  try {
    // Extract user data from request
    const {
      email,
      password,
      infinite_token,
      remember_me
    } = req.body;

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    let emailOrNumberPhone;
    if (validator.isEmail(email)) {
      emailOrNumberPhone = "email";
    } else if (validator.isMobilePhone(email, 'any')) {
      emailOrNumberPhone = "phone";
    } else {
      emailOrNumberPhone = "invalid";
    }

    let user;
    if (emailOrNumberPhone == 'email') {
      // Find user by email
      user = await User.findOne({
        where: {
          email,
          status: "active",
        },
      });
    } else if (emailOrNumberPhone == 'phone') {
      user = await User.findOne({
        where: {
          phone: email,
          status: "active",
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        error: {
          message: "user not found",
        },
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "user not found",
        },
      });
    }

    // Check password
    let isMatch = false;
    if (password == decrypt(user.password, process.env.SALT)) {
      isMatch = true;
    }
    if (!isMatch) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        error: {
          message: "Invalid email/telp or password",
        },
      });
    }

    let token;
    if (infinite_token) {
      // Generate token
      token = jwt.sign({
          id: user.id_user,
          email: user.email,
        },
        process.env.JWT_SECRET
        // { expiresIn: '1h' } // Adjust expiration time as necessary
      );
    } else if (remember_me) {
      token = jwt.sign({
          id: user.id_user,
          email: user.email,
        },
        process.env.JWT_SECRET, {
          expiresIn: "30d",
        } // Adjust expiration time as necessary
      );
    } else {
      token = jwt.sign({
          id: user.id_user,
          email: user.email,
        },
        process.env.JWT_SECRET, {
          expiresIn: "1h",
        } // Adjust expiration time as necessary
      );
    }

    // Respond with token
    res.status(200).json({
      success: true,
      message: "Login successful",
      infinite_token,
      remember_me,
      token,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

// mutation
const createUser = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        error: {
          message: errors.array(),
        },
      });
    }

    // Extract user data from request
    const {
      email,
      password,
      username,
      name,
      birthdate,
      address,
      phone,
      gender,
      marriage_status,
      last_education,
      stay_with,
      job,
      body_weight,
      body_height,
    } = req.body;

    let existingUser;
    if (email) {
      // Check if user already exists
      existingUser = await User.findOne({
        where: {
          email,
          status: "active",
        },
      });
    } else if (phone) {
      existingUser = await User.findOne({
        where: {
          phone,
          status: "active",
        },
      });
    }

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash the password
    let hashPassword = encrypt(password, process.env.SALT);

    // Create new user
    const user = await User.create({
      email,
      password: hashPassword,
      username,
      name,
      birthdate,
      address,
      phone,
      gender,
      marriage_status,
      last_education,
      stay_with,
      job,
      body_weight,
      body_height,
    });

    if (email) {
      // Call sendEmailFunction, make run in background
      const emailResponse = sendEmailFunction(
        email,
        "verify_email", {}, // params are dynamically added inside the function
        "ind" // or 'eng' for English template
      );
    }

    // if (!emailResponse.success) {
    //   return res.status(emailResponse.error && emailResponse.error.code ? emailResponse.error.code : 400).json(emailResponse);
    // }
    // Respond with success
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    // Handle errors
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

const {
  OAuth2Client
} = require('google-auth-library');
const client = new OAuth2Client(process.env.oauth_client_id, process.env.oauth_client_secret, process.env.oauth_redirect_uris);

const libphonenumber = require('google-libphonenumber');
const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
const authorizeUrl = client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/user.birthday.read',
    'https://www.googleapis.com/auth/user.phonenumbers.read'
  ]
});

function formatPhoneNumberToLocal(phoneNumber, regionCode) {
  try {
    const number = phoneUtil.parse(phoneNumber, regionCode);

    // Format the number without the international country code (use national format)
    const nationalNumber = phoneUtil.format(number, libphonenumber.PhoneNumberFormat.NATIONAL);

    // Replace the first digit with 0 (if it's not already 0)
    return nationalNumber.replace(/^(\d)/, '0');
  } catch (error) {
    console.error('Error parsing phone number:', error);
    return null;
  }
}

const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8); // Generates an 8-character random string
};

const verifyWithGoogle = async (req, res) => {
  try {

    let {
      id_token
    } = req.body;

    // Verifikasi ID token untuk mendapatk  an informasi pengguna
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.oauth_client_id
    });

    const payload = ticket.getPayload();
    // Anda dapat mengakses informasi pengguna di payload
    const userInfo = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      email_verified: payload.email_verified,
      locale: payload.locale,
      sub: payload.sub, // Unique user ID from Google
      birthdate: payload.birthdate || null, // Retrieve birthdate if available
    };

    let formattedPhone;
    if (payload.phone_number) {
      formattedPhone = formatPhoneNumberToLocal(payload.phone_number, payload.locale);
    }

    let user = await User.findOne({
      where: {
        status: "active",
        [Op.or]: [{
          email: payload.email
        }, formattedPhone ? {
          phone: formattedPhone
        } : null].filter(Boolean),
      },
    });

    if (!user) {
      const randomPassword = generateRandomPassword();
      const hashPassword = encrypt(randomPassword, process.env.SALT);

      user = await User.create({
        email: userInfo.email,
        password: hashPassword,
        name: userInfo.name,
        birthdate: userInfo.birthdate,
      });

      // sending registeration message
      if (user.email) {
        const emailResponse = sendEmailFunction(
          userInfo.email,
          "register_oauth", {
            password: randomPassword
          }, // params are dynamically added inside the function
          "ind" // or 'eng' for English template
        );
      }
    }

    const token = jwt.sign({
        id: user.id_user,
        email: user.email,
      },
      process.env.JWT_SECRET
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      infinite_token: true,
      token,
      data: user,
    });

  } catch (error) {
    console.log(error)
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(500).json({
        success: false,
        message: "INTERNAL_SERVER_ERROR",
        error: {
          message: error.errors[0].message,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        message: "INTERNAL_SERVER_ERROR",
        error: {
          message: error.message,
        },
      });
    }
  }
};

const createUserByGoogle = async (req, res) => {
  try {
    loginWithGoogle.authenticate("google", {
      scope: ["profile", "email"],
    })(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

const updateUser = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    // Extract user data from request
    const {
      id_user
    } = req.params; // User ID from the URL
    const {
      email,
      password,
      username,
      name,
      birthdate,
      address,
      phone,
      gender,
      marriage_status,
      last_education,
      stay_with,
      job,
    } = req.body;

    // Find the user by ID
    const user = await User.findOne({
      where: {
        id_user,
        status: "active",
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "User not found",
        },
      });
    }

    if (password) {
      password = encrypt(password, process.env.SALT);
    }

    if (email && email !== user.email) {
      const emailResponse = sendEmailFunction(
        email,
        "verify_email", {}, // params are dynamically added inside the function
        "ind" // or 'eng' for English template
      );
    }

    // Update user details
    await user.update({
      email,
      username,
      name,
      password,
      birthdate,
      address,
      phone,
      gender,
      marriage_status,
      last_education,
      stay_with,
      job,
    });

    // Respond with updated user details
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    // Handle errors
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    // Extract user ID from request parameters
    const {
      id_user
    } = req.params;

    // Find and delete the user
    const user = await User.findOne({
      where: {
        id_user,
        status: "active",
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "User not found",
        },
      });
    }

    await user.update({
      status: "deleted",
      deletedAt: new Date(),
    });

    // Respond with a success message
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: user.status,
    });
  } catch (error) {
    // Handle errors
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

const logUserAccess = async (req, res) => {
  try {
    const {
      id_user,
      datetime,
      access_via
    } = req.body;
    let userAccess = await UserLogAccessModel.create({
      id_user,
      datetime,
      access_via,
    });

    return res.status(200).json({
      success: true,
      data: userAccess,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    let {
      email
    } = req.body;

    if (!email) {
      email = req.user.email;
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        error: {
          message: "email is needed",
        },
      });
    }

    if (req.user && !req.user.email_verified_at) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        error: {
          message: "email is not verified",
        },
      });
    }
    // Call sendEmailFunction
    const emailResponse = await sendEmailFunction(
      email,
      "forgot_password", {}, // params are dynamically added inside the function
      "ind" // or 'eng' for English template
    );

    if (!emailResponse.success) {
      return res
        .status(
          emailResponse.error && emailResponse.error.code ?
          emailResponse.error.code :
          400
        )
        .json(emailResponse);
    }

    return res.status(200).json({
      success: true,
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error("Error sending forgot password email:", error);
    return res.status(500).json({
      success: false,
      message: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const {
      token
    } = req.params; // User ID from the URL

    // Ensure the user is authenticated and `id_user` is present
    if (!userLogin || !userLogin.id_user) {
      return res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        error: {
          message: "User ID is missing or user not authenticated",
        },
      });
    }

    // Update the user's email verification date
    const updateUser = await User.update({
        email_verified_at: new Date(),
      }, // Fields to update
      {
        where: {
          id_user: userLogin.id_user,
        },
      } // Condition to find the record
    );

    // Check if any rows were updated (updateUser[0] > 0)
    if (updateUser[0] > 0) {
      return res.status(200).json({
        success: true,
        message: "Email verified successfully",
      });
    } else {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "User not found or already verified",
        },
      });
    }
  } catch (error) {
    console.error("Error verifying email:", error);
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

const verifyProcess = async (req, res) => {
  const token = req.params.token;

  if (!token) {
    return res.status(400).send({
      success: false,
      code: "BAD_REQUEST",
      error: {
        message: "Token tidak tersedia",
      },
    });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by email
    const user = await User.findOne({
      where: {
        email: decoded.email,
      },
    });

    if (!user) {
      return res.status(404).send({
        success: false,
        code: "NOT_FOUND",
        error: {
          message: "Pengguna tidak ditemukan",
        },
      });
    }

    // Check if the user is already verified
    if (user.email_verified_at) {
      return res.status(403).send({
        success: false,
        code: "FORBIDDEN",
        error: {
          message: "Email sudah diverifikasi sebelumnya",
        },
      });
    }

    // Mark the user as verified
    user.email_verified_at = new Date();
    await user.save(); // Save the changes to the database

    return res.status(200).send({
      success: true,
      error: {
        message: "Email berhasil diverifikasi. Terima kasih!",
      },
    });
  } catch (error) {
    // Handle invalid token or other errors
    return res.status(403).send({
      success: false,
      code: "FORBIDDEN",
      error: {
        message: "Token tidak valid atau telah kadaluarsa",
      },
    });
  }
};

// Encryption function using salt as the key
function encrypt(text, salt) {
  const algorithm = "aes-256-cbc";
  const key = crypto.createHash("sha256").update(salt).digest(); // Derive key from salt
  const iv = Buffer.alloc(16, 0); // Use a fixed IV (not secure, but simple for this use case)

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return encrypted;
}

// Decryption function with string salt as the key
function decrypt(encryptedText, salt) {
  const algorithm = "aes-256-cbc";
  const key = crypto.createHash("sha256").update(salt).digest(); // Derive key from salt
  const iv = Buffer.alloc(16, 0); // Use the same fixed IV as in encryption

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

module.exports = {
  logUserAccess,
  getAllUsers,
  createUser,
  login,
  createUserByGoogle,
  updateUser,
  deleteUser,
  getOneUsers,
  forgotPassword,
  verifyEmail,
  verifyProcess,
  encrypt,
  verifyWithGoogle
};