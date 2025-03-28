import { defineCommand, runMain, type CommandMeta } from "citty";
import { createClient, isSMAResponse } from "./client";

const main = defineCommand({
  meta: {
    name: "sma-solar",
    version: "1.0.0",
    description: "http client for sma solar panel webconnect ui",
  },
  args: {
    host: {
      type: "string",
      description: "Host name or address",
      alias: ["h", "hostname"],
      required: true,
    },
    role: {
      type: "string",
      description: "Webconnect role",
      alias: ["r"],
      default: "usr",
      required: false,
    },
    password: {
      type: "string",
      description: "Password",
      alias: ["p", "pass"],
      required: true,
    },
  },
  async run({ args, cmd }) {
    const meta = cmd.meta as CommandMeta;
    console.log(`${meta.name} ${meta.version}  Copyright (C) 2025  Rick Wong\n`);

    try {
      const client = await createClient(args.host, args.role, args.password);

      while (1) {
        const sleepP = new Promise((resolve) => setTimeout(resolve, 5000));
        const OnlValues = await client.getAllOnlValues();
        const firstDevice = OnlValues[Object.keys(OnlValues)[0]!];
        const firstMetricID = Object.keys(firstDevice)[0]!;
        const firstMetricEntry = firstDevice[firstMetricID]["1"];

        console.log(
          `> ${new Date().toISOString().replace("T", " ").split(".")[0]}  Current power: ${
            firstMetricEntry[0].val
          } ${client.codes[String(client.metadata[firstMetricID]?.Unit)]}`
        );

        await sleepP;
      }
    } catch (error) {
      if (isSMAResponse(error)) {
        switch (error.err) {
          case 401:
            console.error("Client Error:", "Incorrect password");
            break;
          case 503:
            console.error("Client Error:", "Rate limited");
            break;
          default:
            console.error("Server Error:", error);
        }
      } else {
        console.error("User Error:", error);
      }
    }
  },
});

runMain(main);
