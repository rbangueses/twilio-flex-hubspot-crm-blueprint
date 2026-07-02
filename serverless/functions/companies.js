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
  response.appendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.appendHeader("Access-Control-Allow-Headers", "Content-Type");

  if (!event.contactId) {
    response.setStatusCode(400);
    response.setBody({ error: "contactId is required" });
    return callback(null, response);
  }

  try {
    const client = getHubSpotClient();

    const associationsResponse =
      await client.crm.associations.v4.basicApi.getPage(
        "contacts",
        event.contactId,
        "companies"
      );

    const companyIds = associationsResponse.results.map((a) => a.toObjectId);

    if (companyIds.length === 0) {
      response.setStatusCode(200);
      response.setBody({ companies: [] });
      return callback(null, response);
    }

    const companiesResponse = await client.crm.companies.batchApi.read({
      inputs: companyIds.map((id) => ({ id })),
      properties: ["name", "domain", "industry", "phone", "city", "country"],
    });

    const companies = companiesResponse.results.map((c) => ({
      id: c.id,
      name: c.properties.name || "",
      domain: c.properties.domain || "",
      industry: c.properties.industry || "",
      phone: c.properties.phone || "",
      city: c.properties.city || "",
      country: c.properties.country || "",
    }));

    response.setStatusCode(200);
    response.setBody({ companies });
    return callback(null, response);
  } catch (error) {
    console.error("HubSpot list companies error:", error);
    response.setStatusCode(500);
    response.setBody({ error: "Failed to list companies" });
    return callback(null, response);
  }
};
