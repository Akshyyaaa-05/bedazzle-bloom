const { google } = require("googleapis");
const Busboy = require("busboy");
const { Readable } = require("stream");

exports.handler = async (event) => {
  // Only accept POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Parse the uploaded multipart/form-data
    const contentType =
      event.headers["content-type"] || event.headers["Content-Type"];

    if (!contentType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing content type" }),
      };
    }

    const fields = {};
    let proofFile = null;

    await new Promise((resolve, reject) => {
      const busboy = Busboy({ headers: { "content-type": contentType } });

      busboy.on("field", (name, value) => {
        fields[name] = value;
      });

      busboy.on("file", (name, file, info) => {
        if (name !== "proof") {
          file.resume();
          return;
        }

        const chunks = [];

        file.on("data", (chunk) => chunks.push(chunk));

        file.on("end", () => {
          proofFile = {
            buffer: Buffer.concat(chunks),
            filename: info.filename,
            mimeType: info.mimeType || "application/octet-stream",
          };
        });
      });

      busboy.on("finish", resolve);
      busboy.on("error", reject);

      const body = event.isBase64Encoded
        ? Buffer.from(event.body, "base64")
        : Buffer.from(event.body || "", "utf8");

      busboy.end(body);
    });

    // Basic validation
    if (
      !fields.name ||
      !fields.phone ||
      !fields.email ||
      !fields.items ||
      !fields.total ||
      !proofFile
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing registration information or payment proof",
        }),
      };
    }

    // Authenticate with Google
    const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  "https://autimsy.netlify.app/.netlify/functions/google-auth-callback"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const sheets = google.sheets({
  version: "v4",
  auth: oauth2Client,
});

const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

    // Parse the selected items
    let items;

    try {
      items = JSON.parse(fields.items);
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid items data" }),
      };
    }

    // Give the uploaded screenshot a useful filename
    const safeName = fields.name
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "_");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const filename =
      `${safeName || "registration"}_${timestamp}_payment` +
      (proofFile.filename.includes(".")
        ? "." + proofFile.filename.split(".").pop()
        : "");

    // Upload payment screenshot to Google Drive
    const uploadedFile = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: proofFile.mimeType,
        body: Readable.from(proofFile.buffer),
      },
      fields: "id,name,webViewLink",
    });

    const screenshotUrl =
      uploadedFile.data.webViewLink ||
      `https://drive.google.com/file/d/${uploadedFile.data.id}/view`;

    // Add registration to Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Registrations!A:I",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            new Date().toISOString(),
            fields.name.trim(),
            fields.phone.trim(),
            fields.email.trim(),
            JSON.stringify(items),
            Number(fields.total),
            screenshotUrl,
            "Pending",
            "No",
          ],
        ],
      },
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        message: "Registration received",
      }),
    };
  } catch (error) {
    console.error("Registration error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Unable to process registration",
      }),
    };
  }
};
