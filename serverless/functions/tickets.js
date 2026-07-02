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

  // PATCH: Update ticket (when ticketId is provided without subject)
  if (event.ticketId && !event.subject) {
    try {
      const properties = {};
      if (event.hs_pipeline_stage) properties.hs_pipeline_stage = event.hs_pipeline_stage;
      if (event.content !== undefined) properties.content = event.content;
      if (event.hs_ticket_priority) properties.hs_ticket_priority = event.hs_ticket_priority;

      const ticketResponse = await client.crm.tickets.basicApi.update(event.ticketId, {
        properties,
      });

      response.setStatusCode(200);
      response.setBody({
        id: ticketResponse.id,
        subject: ticketResponse.properties.subject,
        content: ticketResponse.properties.content,
        hs_pipeline_stage: ticketResponse.properties.hs_pipeline_stage,
        hs_ticket_priority: ticketResponse.properties.hs_ticket_priority,
        createdate: ticketResponse.properties.createdate,
        hs_lastmodifieddate: ticketResponse.properties.hs_lastmodifieddate,
      });
      return callback(null, response);
    } catch (error) {
      console.error("HubSpot update ticket error:", error.message, error.body);
      response.setStatusCode(500);
      response.setBody({ error: "Failed to update ticket", details: error.message });
      return callback(null, response);
    }
  }

  // POST: Create ticket
  if (event.subject && event.contactId) {
    try {
      const ticketResponse = await client.crm.tickets.basicApi.create({
        properties: {
          subject: event.subject,
          content: event.content || "",
          hs_pipeline_stage: event.hs_pipeline_stage || "1",
          hs_ticket_priority: event.hs_ticket_priority || "MEDIUM",
        },
      });

      // Associate with contact
      await client.crm.associations.v4.basicApi.create(
        "tickets",
        ticketResponse.id,
        "contacts",
        event.contactId,
        [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 16 }]
      );

      response.setStatusCode(201);
      response.setBody({
        id: ticketResponse.id,
        subject: ticketResponse.properties.subject,
        content: ticketResponse.properties.content,
        hs_pipeline_stage: ticketResponse.properties.hs_pipeline_stage,
        hs_ticket_priority: ticketResponse.properties.hs_ticket_priority,
        createdate: ticketResponse.properties.createdate,
      });
      return callback(null, response);
    } catch (error) {
      console.error("HubSpot create ticket error:", error.message, error.body);
      response.setStatusCode(500);
      response.setBody({ error: "Failed to create ticket", details: error.message, body: error.body });
      return callback(null, response);
    }
  }

  // GET: List tickets for contact
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
        "tickets"
      );

    const ticketIds = associationsResponse.results.map((a) => a.toObjectId);

    if (ticketIds.length === 0) {
      response.setStatusCode(200);
      response.setBody({ tickets: [] });
      return callback(null, response);
    }

    const ticketsResponse = await client.crm.tickets.batchApi.read({
      inputs: ticketIds.map((id) => ({ id })),
      properties: [
        "subject",
        "content",
        "hs_pipeline_stage",
        "hs_ticket_priority",
        "createdate",
        "hs_lastmodifieddate",
      ],
    });

    const tickets = ticketsResponse.results.map((t) => ({
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
  } catch (error) {
    console.error("HubSpot list tickets error:", error);
    response.setStatusCode(500);
    response.setBody({ error: "Failed to list tickets", details: error.message });
    return callback(null, response);
  }
};
