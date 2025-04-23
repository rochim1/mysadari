const { getApps } = require("firebase-admin/app");

const initializeAppFirebase = async (admin) => {
  const firebaseConfig = {
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    // Replace the line breaks in the private key
    private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI, // Fixed variable name
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
    universe_domain: process.env.UNIVERSE_DOMAIN
  };

  console.log("Firebase configuration:", firebaseConfig);

  const alreadyCreatedApps = getApps();

  if (alreadyCreatedApps.length === 0) {
    console.log("No existing Firebase apps found. Initializing a new app...");
    const App = admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig)
    });
    console.log("Firebase app initialized.");
    return App;
  } else {
    console.log("Firebase app already initialized. Reusing the existing app.");
    return alreadyCreatedApps[0];
  }
}

module.exports = {
  initializeAppFirebase
};
