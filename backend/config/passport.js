const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/api/auth/google/callback',
            proxy: true
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                    // User exists, update Google ID if not set
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        user.profilePicture = profile.photos[0]?.value;
                        await user.save();
                    }
                    return done(null, user);
                }

                // Create new user
                user = await User.create({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    profilePicture: profile.photos[0]?.value,
                    password: Math.random().toString(36).slice(-8), // Random password for Google users
                    isEmailVerified: true,  // Google emails are verified
                    emailVerified: true
                });

                done(null, user);
            } catch (error) {
                console.error('Google OAuth error:', error);
                done(error, null);
            }
        }
    )
);

module.exports = passport;
