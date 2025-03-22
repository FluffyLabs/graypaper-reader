import * as dotenv from "dotenv";
import { MessagesLogger } from "./logger";
import { listenToMessages } from "./server";
dotenv.config();

const homeserverUrl = "https://matrix.org";
const accessToken = process.env.ACCESS_TOKEN;
const userId = process.env.USER_ID;
const notesLabel = process.env.NOTES_LABEL;
const roomId = "!ddsEwXlCWnreEGuqXZ:polkadot.io";

if (!accessToken || !userId) {
  throw new Error("Provide .env file or ENV variables `ACCESS_TOKEN` and `USER_ID`");
}

async function main(accessToken: string, userId: string, notesLabel?: string) {
  const logger = new MessagesLogger(roomId, notesLabel ? [notesLabel] : []);
  const client = await listenToMessages(homeserverUrl, accessToken, userId, roomId, logger);

  const cleanup = () => {
    client.stopClient();
  };
  process.once("SIGTERM", cleanup);
  process.once("SIGINT", cleanup);
}

main(accessToken, userId, notesLabel);
