const { Client } = require("@hubspot/api-client");

let client = null;

function getHubSpotClient() {
  if (!client) {
    const accessToken = process.env.HUBSPOT_API_KEY;
    if (!accessToken) {
      throw new Error("HUBSPOT_API_KEY environment variable not set");
    }
    client = new Client({ accessToken });
  }
  return client;
}

exports.handler = async (context, event, callback) => {
  const response = new Twilio.Response();
  response.appendHeader("Content-Type", "application/json");
  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.appendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.appendHeader("Access-Control-Allow-Headers", "Content-Type");

  if (!event.phone) {
    response.setStatusCode(400);
    response.setBody({ error: "phone is required" });
    return callback(null, response);
  }

  try {
    const client = getHubSpotClient();

    const createResponse = await client.crm.contacts.basicApi.create({
      properties: {
        firstname: event.firstname || "",
        lastname: event.lastname || "",
        email: event.email || "",
        phone: event.phone,
      },
    });

    response.setStatusCode(201);
    response.setBody({
      id: createResponse.id,
      firstname: createResponse.properties.firstname || "",
      lastname: createResponse.properties.lastname || "",
      email: createResponse.properties.email || "",
      phone: createResponse.properties.phone || "",
    });
    return callback(null, response);
  } catch (error) {
    console.error("HubSpot create error:", error.code, error.body);

    // Handle duplicate contact (409 Conflict)
    if (error.code === 409) {
      response.setStatusCode(409);
      response.setBody({ error: "Contact with this phone number already exists" });
      return callback(null, response);
    }

    response.setStatusCode(500);
    response.setBody({ error: "Failed to create contact", details: error.message });
    return callback(null, response);
  }
};
