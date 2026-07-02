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
  response.appendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.appendHeader("Access-Control-Allow-Headers", "Content-Type");

  const client = getHubSpotClient();

  // PATCH: Update deal
  if (event.dealId && !event.contactId) {
    try {
      const properties = {};
      if (event.dealname) properties.dealname = event.dealname;
      if (event.amount !== undefined) properties.amount = event.amount;
      if (event.dealstage) properties.dealstage = event.dealstage;
      if (event.closedate !== undefined) properties.closedate = event.closedate;

      const dealResponse = await client.crm.deals.basicApi.update(event.dealId, {
        properties,
      });

      response.setStatusCode(200);
      response.setBody({
        id: dealResponse.id,
        dealname: dealResponse.properties.dealname,
        amount: dealResponse.properties.amount,
        dealstage: dealResponse.properties.dealstage,
        createdate: dealResponse.properties.createdate,
        closedate: dealResponse.properties.closedate,
      });
      return callback(null, response);
    } catch (error) {
      console.error("HubSpot update deal error:", error.message, error.body);
      response.setStatusCode(500);
      response.setBody({ error: "Failed to update deal", details: error.message });
      return callback(null, response);
    }
  }

  // POST: Create deal
  if (event.dealname && event.contactId) {
    try {
      const dealResponse = await client.crm.deals.basicApi.create({
        properties: {
          dealname: event.dealname,
          amount: event.amount || "",
          dealstage: event.dealstage || "appointmentscheduled",
        },
      });

      // Associate with contact
      await client.crm.associations.v4.basicApi.create(
        "deals",
        dealResponse.id,
        "contacts",
        event.contactId,
        [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }]
      );

      response.setStatusCode(201);
      response.setBody({
        id: dealResponse.id,
        dealname: dealResponse.properties.dealname,
        amount: dealResponse.properties.amount,
        dealstage: dealResponse.properties.dealstage,
        createdate: dealResponse.properties.createdate,
      });
      return callback(null, response);
    } catch (error) {
      console.error("HubSpot create deal error:", error);
      response.setStatusCode(500);
      response.setBody({ error: "Failed to create deal" });
      return callback(null, response);
    }
  }

  // GET: List deals for contact
  if (!event.contactId) {
    response.setStatusCode(400);
    response.setBody({ error: "contactId is required" });
    return callback(null, response);
  }

  try {
    const associationsResponse =
      await client.crm.associations.v4.basicApi.getPage(
        "contacts",
        event.contactId,
        "deals"
      );

    const dealIds = associationsResponse.results.map((a) => a.toObjectId);

    if (dealIds.length === 0) {
      response.setStatusCode(200);
      response.setBody({ deals: [] });
      return callback(null, response);
    }

    const dealsResponse = await client.crm.deals.batchApi.read({
      inputs: dealIds.map((id) => ({ id })),
      properties: [
        "dealname",
        "amount",
        "dealstage",
        "createdate",
        "closedate",
      ],
    });

    const deals = dealsResponse.results.map((d) => ({
      id: d.id,
      dealname: d.properties.dealname || "",
      amount: d.properties.amount || "",
      dealstage: d.properties.dealstage || "",
      createdate: d.properties.createdate || "",
      closedate: d.properties.closedate || "",
    }));

    response.setStatusCode(200);
    response.setBody({ deals });
    return callback(null, response);
  } catch (error) {
    console.error("HubSpot list deals error:", error);
    response.setStatusCode(500);
    response.setBody({ error: "Failed to list deals" });
    return callback(null, response);
  }
};
