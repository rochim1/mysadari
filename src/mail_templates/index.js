const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const {
    Op
} = require('sequelize');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const blockedMails = [];

const mailOptions = [{
        template_name: 'forgot_password',
        require_params: {
            resetLink: 'link',
            username: 'name'
        },
        from: process.env.EMAIL,
        receiver_role: ['user', 'admin'],
        to: '', // User email will be dynamically set
        subject: 'Password Reset',
        html: '../mail_templates/forgotPassword/'
    },
    {
        template_name: 'verify_email',
        require_params: {
            name: 'name',
            verificationLink: 'link'
        },
        from: process.env.EMAIL,
        receiver_role: ['user'],
        to: '', // User email will be dynamically set
        subject: 'verifikasi email',
        html: '../mail_templates/emailVerification/'
    },
    {
        template_name: 'register_oauth',
        require_params: {
            name: 'name',
            password: 'password',
        },
        from: process.env.EMAIL,
        receiver_role: ['user'],
        to: '', // User email will be dynamically set
        subject: 'berhasil mendaftar',
        html: '../mail_templates/emailVerificationGenerateByGoogle/'
    }
];

async function sendEmailFunction(email, template_name, params, lang = 'ind') {
    try {
        if (!blockedMails.includes(template_name)) {
            const getMailOptions = mailOptions.find(options => options.template_name === template_name);

            if (!getMailOptions) {
                return {
                    success: false,
                    error: {
                        code: 404,
                        message: 'Cannot send mail, template not found'
                    },
                    code: 'NOT_FOUND',
                };
            }

            let emailTemplate, user;
            if (template_name == 'forgot_password') {
                const template = await sendEmailForgotPassword(getMailOptions, email, params, lang);
                emailTemplate = template.emailTemplate
                user = template.user
            } else if (template_name == 'verify_email') {
                const template = await sendEmailVerification(getMailOptions, email,params, lang);
                emailTemplate = template.emailTemplate
                user = template.user
            } else if (template_name == 'register_oauth') {
                const template = await sendEmailVerification(getMailOptions, email,params, lang);
                emailTemplate = template.emailTemplate
                user = template.user
            }
            // Create transporter for sending email
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD,
                },
            });
            // Set dynamic email options
            const finalMailOptions = {
                from: getMailOptions.from,
                to: user.email,
                subject: getMailOptions.subject,
                html: emailTemplate,
            };

            // Send email
            await transporter.sendMail(finalMailOptions);

            return {
                success: true,
                message: 'Verification email sent successfully',
            };
        } else {
            return {
                success: false,
                error: {
                    code: 403,
                    message: 'Email template is blocked from sending',
                },
                code: 'FORBIDDEN',
            };
        }
    } catch (error) {
        throw {
            success: error.success || false,
            code: error.code || 'INTERNAL_SERVER_ERROR',
            error: error.error || {
                code: 500,
                message: error.message
            },
        };
    }
}

async function sendEmailForgotPassword(getMailOptions, email, params, lang) {

    // Fetch user by email and ensure email is verified
    const user = await User.findOne({
        where: {
            email,
            status: 'active',
            email_verified_at: {
                [Op.ne]: null,
            },
        },
    });
    
    if (!user) {
        throw {
            success: false,
            error: {
                code: 404,
                message: 'User not found or email not verified',
            },
            code: 'NOT_FOUND',
        };
    }

    // Generate token and save to the user document
    // const token = crypto.randomBytes(32).toString('hex');
    // user.resetPasswordToken = token;
    // user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    // await user.save();

    const token = jwt.sign({ id_user: user.id_user }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });
    
    // Construct template path and read HTML content
    const templatePath = path.join(__dirname, `${getMailOptions.html}${lang === 'ind' ? 'ind.html' : 'eng.html'}`);
    const htmlSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(htmlSource);

    // Replace placeholders with actual data
    const resetLink = `http://${process.env.HOST}/update_password/${token}`;
    const replacements = {
        ...params,
        resetLink,
        username: user.name,
    };

    const emailTemplate = template(replacements);
    return {
        emailTemplate,
        user
    };
}

async function sendEmailVerification(getMailOptions, email, params, lang) {
    // Fetch user by email and ensure email is verified
    const user = await User.findOne({
        where: {
            email,
            status: 'active'
        },
    });

    if (!user) {
        throw {
            success: false,
            error: {
                code: 404,
                message: 'User not found or email not verified',
            },
            code: 'NOT_FOUND',
        };
    }

    // Generate token and save to the user document
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });

    const verificationLink = `${process.env.HOST}/verify_email/${token}`;

    // Construct template path and read HTML content
    const templatePath = path.join(__dirname, `${getMailOptions.html}${lang === 'ind' ? 'ind.html' : 'eng.html'}`);
    const htmlSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(htmlSource);

    // Replace placeholders with actual data
    const replacements = {
        ...params,
        verificationLink : verificationLink,
        name: user.name,
    };

    const emailTemplate = template(replacements);
    return {
        emailTemplate,
        user
    };
}

module.exports = {
    sendEmailFunction
};