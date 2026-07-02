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
            { propertyName: "dealstage", operator: "NOT_IN", values: ["closedwon", "closedlost"] },
          ],
        },
      ];
    } else if (status === "closed") {
      filterGroups = [
        {
          filters: [
            { propertyName: "dealstage", operator: "IN", values: ["closedwon", "closedlost"] },
          ],
        },
      ];
    }

    const searchResponse = await client.crm.deals.searchApi.doSearch({
      filterGroups,
      sorts: [{ propertyName: "createdate", direction: "DESCENDING" }],
      properties: ["dealname", "amount", "dealstage", "createdate", "closedate"],
      limit: 50,
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
    response.setBody({ deals, total: searchResponse.total });
    return callback(null, response);
  } catch (error) {
    console.error("HubSpot list deals error:", error.message, error.body);
    response.setStatusCode(500);
    response.setBody({ error: "Failed to list deals", details: error.message });
    return callback(null, response);
  }
};
