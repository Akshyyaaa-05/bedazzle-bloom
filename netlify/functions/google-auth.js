const { google } = require("googleapis");

exports.handler = async () => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      "https://autimsy.netlify.app/.netlify/functions/google-auth-callback"
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/spreadsheets",
      ],
    });

    return {
      statusCode: 302,
      headers: {
        Location: authUrl,
      },
      body: "",
    };
  } catch (error) {
    console.error("OAuth URL error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Unable to create authorization URL",
      }),
    };
  }
};
