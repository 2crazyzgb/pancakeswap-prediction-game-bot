const config = require("../../project-config.json");
const { privateKey, account, proxy, telegram, totalBettingAmount, bettingStrategies, graphApiPrediction, graphApiProfile } = config;

export default {
  wallet: privateKey as string,
  account: account.toLowerCase(),
  totalAmount: totalBettingAmount,
  strategie: bettingStrategies as string,
  apiPrediction: graphApiPrediction as string,
  apiProfile: graphApiProfile as string,
  proxy: {
    host: proxy.host,
    port: proxy.port,
    auth: proxy.auth,
  },
  telegram: {
    botToken: telegram.botToken,
    receiverId: telegram.receiverId,
  },
};
