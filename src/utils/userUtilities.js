const {
  User
} = require('../models/userModel'); // Adjust the path to your models if needed
const passport = require('passport');
const {
  OAuth2Strategy
} = require('passport-google-oauth');


const loginWithGoogle = passport.use(new OAuth2Strategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists in the database by email
    let user = await User.findOne({
      where: { email: profile.emails[0].value }
    });

    // If the user does not exist, create a new user
    if (!user) {
      user = await User.create({
        email: profile.emails[0].value,
        username: profile.displayName,
        name: profile.displayName,
        // Add any additional fields if necessary, such as `googleId` or `avatar`
      });

      return done(null, user); // Successfully created a new user, pass user to done callback
    } else if (user.status === 'active') {
      // User exists and is active
      return done(null, user); // Successfully found an active user, pass user to done callback
    } else {
      // User exists but is inactive/deleted
      return done(null, false, { message: 'This email is associated with an inactive or deleted user.' });
    }
  } catch (error) {
    // Catch and handle any errors during the authentication process
    return done(error, null);
  }
}
));

module.exports = {
  loginWithGoogle
}