#!/usr/bin/env node

import { defineCommand, runMain, type CommandMeta } from "citty";
import { createClient, isSMAResponse } from "./client.js";

const main = defineCommand({
  meta: {
    name: "sma-solar",
    description: "http client for sma solar panel webconnect ui",
  },
  args: {
    hostname: {
      type: "string",
      description: "Hostname or address",
      alias: ["h", "host"],
      required: true,
    },
    password: {
      type: "string",
      description: "Password",
      alias: ["p", "pass"],
      required: true,
    },
    role: {
      type: "string",
      description: "SMA Webconnect role",
      alias: ["r"],
      default: "usr",
      required: false,
    },
  },
  async run({ args, cmd }) {
    const meta = cmd.meta as CommandMeta;
    console.log(`${meta.name}  Copyright (C) 2025  Rick Wong\n`);

    try {
      const client = await createClient(args.hostname, args.role, args.password);

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
