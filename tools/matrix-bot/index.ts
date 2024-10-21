import * as dotenv from "dotenv";
import { MessagesLogger } from "./logger.js";
import { listenToMessages } from "./server.js";

dotenv.config();

const homeserverUrl = "https://matrix.org";
const accessToken = process.env.ACCESS_TOKEN;
const roomId = "!ddsEwXlCWnreEGuqXZ:polkadot.io";

if (!accessToken) {
  throw new Error("Provide .env file or ENV variable `ACCESS_TOKEN`");
}

// Call the function to start listening
const logger = new MessagesLogger(roomId, "output/messages.json");
const client = listenToMessages(homeserverUrl, accessToken, roomId, logger);

const cleanup = () => {
  logger.flush();
  client.stopClient();
};
process.once("SIGTERM", cleanup);
process.once("SIGINT", cleanup);
