const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post(
    '/signup',
    [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail()
            .custom(value => {
                const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com', 'protonmail.com'];
                const domain = value.split('@')[1];
                if (!allowedDomains.includes(domain)) {
                    throw new Error('Please use a valid email provider (Gmail, Outlook, Yahoo, etc.)');
                }
                return true;
            }),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
        body('firstName')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('First name must be between 2 and 50 characters'),
        body('lastName')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Last name must be between 2 and 50 characters'),
        body('dateOfBirth')
            .optional()
            .isISO8601()
            .withMessage('Please provide a valid date of birth')
    ],
    async (req, res) => {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array().map(err => ({
                        field: err.path,
                        message: err.msg
                    }))
                });
            }

            const { email, password, firstName, lastName, dateOfBirth } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Create new user
            const user = await User.create({
                email,
                password,
                firstName,
                lastName,
                dateOfBirth: dateOfBirth || undefined
            });

            // Generate verification token
            const verificationToken = user.getVerificationToken();
            await user.save();

            // Create verification URL
            const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

            // Send verification email
            const message = `
                <h1>Email Verification</h1>
                <p>Please verify your email address to activate your Legalyze account.</p>
                <a href="${verifyUrl}" clicktracking=off>${verifyUrl}</a>
                <p>This link will expire in 24 hours.</p>
            `;

            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Legalyze Account Verification',
                    message
                });

                res.status(201).json({
                    success: true,
                    message: 'Registration successful! Please check your email to verify your account.',
                    data: {
                        user: {
                            id: user._id,
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName
                        }
                    }
                });
            } catch (error) {
                console.error('Email send error:', error);
                user.verificationToken = undefined;
                user.verificationTokenExpire = undefined;
                await user.save({ validateBeforeSave: false });

                return res.status(500).json({
                    success: false,
                    message: 'Email could not be sent. Please try again later.'
                });
            }

        } catch (error) {
            console.error('Signup error:', error);
            
            // Handle duplicate key error
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error creating user account',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// @route   POST /api/auth/login
// @desc    Login user and return JWT token
// @access  Public
router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail(),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
    ],
    async (req, res) => {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array().map(err => ({
                        field: err.path,
                        message: err.msg
                    }))
                });
            }

            const { email, password } = req.body;

            // Find user and verify credentials
            const user = await User.findByCredentials(email, password);

            // TEMPORARILY DISABLED FOR TESTING
            // Check if user is verified
            // if (!user.isVerified) {
            //     return res.status(401).json({
            //         success: false,
            //         message: 'Please verify your email address to login'
            //     });
            // }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate JWT token
            const token = generateToken(user._id);
            console.log('Login Route - Generated token:', token.substring(0, 10) + '...');
            console.log('Login Route - Secret length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'MISSING');

            // Return success response
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user._id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        dateOfBirth: user.dateOfBirth,
                        lastLogin: user.lastLogin
                    },
                    token
                }
            });

        } catch (error) {
            console.error('Login error:', error);

            // Handle invalid credentials
            if (error.message === 'Invalid email or password') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error during login',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    dateOfBirth: user.dateOfBirth,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt
                }
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data'
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', protect, async (req, res) => {
    try {
        // In JWT, logout is handled client-side by removing the token
        // This endpoint is for logging purposes
        res.status(200).json({
            success: true,
            message: 'Logout successful. Please remove token from client.'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during logout'
        });
    }
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', (req, res, next) => {
    const passport = require('../config/passport');
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })(req, res, next);
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', (req, res, next) => {
    const passport = require('../config/passport');
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/signin?error=google_auth_failed`
    }, (err, user) => {
        if (err || !user) {
            console.error('Google auth error:', err);
            return res.redirect(`${process.env.FRONTEND_URL}/signin?error=authentication_failed`);
        }

        try {
            // Generate JWT token
            const token = generateToken(user._id);

            // Redirect to frontend with token
            res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?token=${token}&userId=${user._id}`);
        } catch (error) {
            console.error('Token generation error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/signin?error=token_generation_failed`);
        }
    })(req, res, next);
});

module.exports = router;

// @route   GET /api/auth/verify-email/:token
// @desc    Verify email address
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
    try {
        // Get token from params
        const verificationToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        // Find user with matching token and valid expiration
        const user = await User.findOne({
            verificationToken,
            verificationTokenExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Verify user
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now login.'
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying email'
        });
    }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Account already verified'
            });
        }

        // Generate new token
        const verificationToken = user.getVerificationToken();
        await user.save();

        // Create verification URL
        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

        // Send email
        const message = `
            <h1>Email Verification</h1>
            <p>Please verify your email address to activate your Legalyze account.</p>
            <a href="${verifyUrl}" clicktracking=off>${verifyUrl}</a>
            <p>This link will expire in 24 hours.</p>
        `;

        await sendEmail({
            email: user.email,
            subject: 'Legalyze Account Verification (Resend)',
            message
        });

        res.status(200).json({
            success: true,
            message: 'Verification email sent'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending verification email'
        });
    }
});
