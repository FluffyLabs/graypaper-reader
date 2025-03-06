import type { MessagesLogger } from "./logger.js";

export async function listenToMessages(
  homeserverUrl: string,
  accessToken: string,
  userId: string,
  roomId: string,
  msgLog: MessagesLogger,
) {
  const { ClientEvent, RoomEvent, createClient } = await import("matrix-js-sdk");
  // Create a Matrix client
  const client = createClient({
    baseUrl: homeserverUrl,
    accessToken: accessToken,
    userId,
  });

  // Start the client
  client.startClient();

  // Wait for the client to be ready
  client.once(ClientEvent.Sync, (state: string) => {
    if (state === "PREPARED") {
      console.log("Client is ready and synced!");
    }
  });

  // Add an event listener for incoming messages
  client.on(RoomEvent.Timeline, (event, room) => {
    if (event.getType() === "m.room.message") {
      if (room?.roomId === roomId) {
        const sender = event.getSender();
        const messageContent = event.getContent().body;

        msgLog.onMessage(messageContent, sender, event.getId(), event.getDate());
      }
    }
  });

  return client;
}
