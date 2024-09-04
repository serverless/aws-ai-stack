/**
 * This is a simple worker that receives the incoming events from the Event Bus
 * and logs the event details. Use the content of source, details, and
 * detailType to implement the business logic for the event.
 */
export const handler = async (event) => {
  const { source, detail, "detail-type": detailType } = event;

  console.log(`Received event`, { source, detail, detailType });
};
