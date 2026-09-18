const { google } = require("googleapis");

exports.handler = async (event) => {
  try {
    const code = event.queryStringParameters?.code;

    if (!code) {
      return {
        statusCode: 400,
        body: "Missing authorization code.",
      };
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      "https://autimsy.netlify.app/.netlify/functions/google-auth-callback"
    );

    const { tokens } = await oauth2Client.getToken(code);

    console.log("OAuth authorization successful.");
    console.log("Refresh token received:", !!tokens.refresh_token);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html",
      },
      body: `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Successful</title>
          </head>
          <body>
            <h2>Google authorization successful.</h2>
            <p>You can close this tab.</p>
          </body>
        </html>
      `,
    };
  } catch (error) {
    console.error("OAuth callback error:", error);

    return {
      statusCode: 500,
      body: "Google authorization failed. Check the Netlify function logs.",
    };
  }
};
