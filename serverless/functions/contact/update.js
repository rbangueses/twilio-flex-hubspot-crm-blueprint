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
  response.appendHeader("Access-Control-Allow-Methods", "PATCH, OPTIONS");
  response.appendHeader("Access-Control-Allow-Headers", "Content-Type");

  if (!event.contactId) {
    response.setStatusCode(400);
    response.setBody({ error: "contactId is required" });
    return callback(null, response);
  }

  try {
    const client = getHubSpotClient();

    const properties = {};
    if (event.firstname !== undefined) properties.firstname = event.firstname;
    if (event.lastname !== undefined) properties.lastname = event.lastname;
    if (event.email !== undefined) properties.email = event.email;
    if (event.phone !== undefined) properties.phone = event.phone;
    if (event.company !== undefined) properties.company = event.company;
    if (event.jobtitle !== undefined) properties.jobtitle = event.jobtitle;

    const updateResponse = await client.crm.contacts.basicApi.update(
      event.contactId,
      { properties }
    );

    response.setStatusCode(200);
    response.setBody({
      id: updateResponse.id,
      ...updateResponse.properties,
    });
    return callback(null, response);
  } catch (error) {
    console.error("HubSpot update error:", error);
    response.setStatusCode(500);
    response.setBody({ error: "Failed to update contact" });
    return callback(null, response);
  }
};
