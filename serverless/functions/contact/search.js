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

  if (!event.phone) {
    response.setStatusCode(400);
    response.setBody({ error: "phone parameter required" });
    return callback(null, response);
  }

  try {
    const client = getHubSpotClient();
    const phone = event.phone.replace(/\s/g, "");

    const searchResponse = await client.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "phone",
              operator: "EQ",
              value: phone,
            },
          ],
        },
      ],
      properties: [
        "firstname",
        "lastname",
        "email",
        "phone",
        "company",
        "jobtitle",
        "lifecyclestage",
        "hubspot_owner_id",
        "hs_lead_status",
        "lastmodifieddate",
      ],
      limit: 1,
    });

    if (searchResponse.results.length === 0) {
      response.setStatusCode(404);
      response.setBody({ error: "Contact not found" });
      return callback(null, response);
    }

    const contact = searchResponse.results[0];
    const result = {
      id: contact.id,
      firstname: contact.properties.firstname || "",
      lastname: contact.properties.lastname || "",
      email: contact.properties.email || "",
      phone: contact.properties.phone || "",
      company: contact.properties.company || "",
      jobtitle: contact.properties.jobtitle || "",
      lifecyclestage: contact.properties.lifecyclestage || "",
      hubspot_owner_id: contact.properties.hubspot_owner_id || "",
      hs_lead_status: contact.properties.hs_lead_status || "",
      lastmodifieddate: contact.properties.lastmodifieddate || "",
    };

    response.setStatusCode(200);
    response.setBody(result);
    return callback(null, response);
  } catch (error) {
    console.error("HubSpot search error:", error);
    response.setStatusCode(500);
    response.setBody({ error: "Failed to search contacts" });
    return callback(null, response);
  }
};
