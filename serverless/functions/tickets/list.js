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

  const client = getHubSpotClient();
  const status = event.status || "open"; // open, closed, all

  try {
    let filterGroups = [];

    if (status === "open") {
      filterGroups = [
        {
          filters: [
            { propertyName: "hs_pipeline_stage", operator: "NEQ", value: "4" },
          ],
        },
      ];
    } else if (status === "closed") {
      filterGroups = [
        {
          filters: [
            { propertyName: "hs_pipeline_stage", operator: "EQ", value: "4" },
          ],
        },
      ];
    }

    const searchResponse = await client.crm.tickets.searchApi.doSearch({
      filterGroups,
      sorts: [{ propertyName: "createdate", direction: "DESCENDING" }],
      properties: ["subject", "content", "hs_pipeline_stage", "hs_ticket_priority", "createdate", "hs_lastmodifieddate"],
      limit: 50,
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
    response.setBody({ tickets, total: searchResponse.total });
    return callback(null, response);
  } catch (error) {
    console.error("HubSpot list tickets error:", error.message, error.body);
    response.setStatusCode(500);
    response.setBody({ error: "Failed to list tickets", details: error.message });
    return callback(null, response);
  }
};
