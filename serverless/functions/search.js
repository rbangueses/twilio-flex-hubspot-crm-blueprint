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

  const { query, type } = event;

  if (!query || query.length < 2) {
    response.setStatusCode(400);
    response.setBody({ error: "Query must be at least 2 characters" });
    return callback(null, response);
  }

  try {
    if (type === "tickets") {
      const searchResponse = await client.crm.tickets.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              { propertyName: "subject", operator: "CONTAINS_TOKEN", value: `*${query}*` },
            ],
          },
        ],
        properties: ["subject", "content", "hs_pipeline_stage", "hs_ticket_priority", "createdate", "hs_lastmodifieddate"],
        limit: 20,
      });

      const tickets = searchResponse.results.map((t) => ({
        id: t.id,
        subject: t.properties.subject || "",
        content: t.properties.content || "",
        hs_pipeline_stage: t.properties.hs_pipeline_stage || "",
        hs_ticket_priority: t.properties.hs_ticket_priority || "",
        createdate: t.properties.createdate || "",
        hs_lastmodifieddate: t.properties.hs_lastmodifieddate || "",
      }));

      response.setStatusCode(200);
      response.setBody({ tickets });
      return callback(null, response);
    }

    if (type === "deals") {
      const searchResponse = await client.crm.deals.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              { propertyName: "dealname", operator: "CONTAINS_TOKEN", value: `*${query}*` },
            ],
          },
        ],
        properties: ["dealname", "amount", "dealstage", "createdate", "closedate"],
        limit: 20,
      });

      const deals = searchResponse.results.map((d) => ({
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
    }

    // Default: search contacts
    const searchResponse = await client.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            { propertyName: "firstname", operator: "CONTAINS_TOKEN", value: `*${query}*` },
          ],
        },
        {
          filters: [
            { propertyName: "lastname", operator: "CONTAINS_TOKEN", value: `*${query}*` },
          ],
        },
        {
          filters: [
            { propertyName: "email", operator: "CONTAINS_TOKEN", value: `*${query}*` },
          ],
        },
        {
          filters: [
            { propertyName: "phone", operator: "CONTAINS_TOKEN", value: `*${query}*` },
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
      limit: 20,
    });

    const contacts = searchResponse.results.map((c) => ({
      id: c.id,
      firstname: c.properties.firstname || "",
      lastname: c.properties.lastname || "",
      email: c.properties.email || "",
      phone: c.properties.phone || "",
      company: c.properties.company || "",
      jobtitle: c.properties.jobtitle || "",
      lifecyclestage: c.properties.lifecyclestage || "",
      hubspot_owner_id: c.properties.hubspot_owner_id || "",
      hs_lead_status: c.properties.hs_lead_status || "",
      lastmodifieddate: c.properties.lastmodifieddate || "",
    }));

    response.setStatusCode(200);
    response.setBody({ contacts });
    return callback(null, response);
  } catch (error) {
    console.error("HubSpot search error:", error.message, error.body);
    response.setStatusCode(500);
    response.setBody({ error: "Search failed", details: error.message });
    return callback(null, response);
  }
};
