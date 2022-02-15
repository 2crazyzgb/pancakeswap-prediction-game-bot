import { MarketDataMonitor } from "./marketDataMonitor";
import { betSmall } from "./bet";
import { getUnCollectHistory } from "./getBetHistory";
import { collect } from "./collect";
import { getMultiplier } from "../utils/getMultiplier";
import { numberFixed, zeroFill } from "../utils/number";
import type { Round } from "../types/round";
import { calcBalanceTime, calcBalanceTimeMs } from "./round";
import * as chalk from "chalk";
import { log, color } from "../utils/log";
import BetManager from "./betManager";
import { getBalance } from "../wallet/wallet";

import {
  getActiveBetRound,
  getProcessingRound,
} from "./getMarketData";


const calculateResult = (round: Round) => {
  const cur = round;
  const id = cur.id;
  // positive for growth
  const isUp = cur.closePrice - cur.lockPrice > 0;

  const bull = getMultiplier(cur.totalAmount, cur.bullAmount);
  const bear = getMultiplier(cur.totalAmount, cur.bearAmount);

  console.log(
    `The settlement result of the session ${id} is ${chalk.red(isUp ? "Big" : "Small")} odds ${chalk.blue(
      isUp ? bull : bear
    )}`
  );
};

const onRoundBetsChang = (round: Round) => {
  const { totalAmount, id } = round;

  const decimalLen = 2;
  const bullMultiplier = getMultiplier(
    round.totalAmount,
    round.bullAmount,
    decimalLen
  );
  const bearMultiplier = getMultiplier(
    round.totalAmount,
    round.bearAmount,
    decimalLen
  );
  // const balanceTime = calcBalanceTimeMs(round);
  const isUpSmall = bullMultiplier - bearMultiplier < 0;

  // if (balanceTime < 10000) {
  console.log(
    `#${id} Data changes, total${round.totalBets}Second-rate$${zeroFill(
      numberFixed(totalAmount, 3),
      3
    )}`,
    `| Odds are big`,
    color(isUpSmall, zeroFill(bullMultiplier, decimalLen)),
    "-",
    color(!isUpSmall, zeroFill(bearMultiplier, decimalLen)),
    `small`,
    `| ${calcBalanceTime(round)}s`
  );
  // }
};

getBalance().then((INITIAL_MONEY) => {
  // Change the initial amount here for testing
  INITIAL_MONEY = 0.001;
  console.log(`====1====`);
  const betManager = new BetManager({
    initialMoney: INITIAL_MONEY,
    betEvent: async ({ betManager, round, counterparty }) => {
      if (betManager.currentBalance < 0 || round.totalAmount < 20) {
        return null;
      }

      let amount = INITIAL_MONEY / 10;

      if (counterparty && !counterparty.isWin) {
        amount = counterparty.amount * 2.75;
      }

      if (amount > INITIAL_MONEY / 1.35) {
        amount = INITIAL_MONEY / 1.35;
      }

      if (amount > betManager.currentBalance) {
        amount = betManager.currentBalance;
      }
      console.log(`====2====`);
      // Only keep 8 bits of mantissa
      amount = numberFixed(amount, 8);

      // Real betting behavior! will use the money in the wallet
      // ⚠️ This will use the balance in your wallet!

       betSmall({ round, amount });
      console.log(`====3====`);
      return {
        amount,
        id: round.id,
        position: betManager.getSmallPosition(round),
      };
    },
  });

  console.log(`====4====`);
  // console.log(JSON.stringify(betManager.));
  // console.log(JSON.stringify(betManager.betEvent()));
  new MarketDataMonitor({
    nearsAnEndTime: 3000,
    onRoundChange: onRoundBetsChang,

    onRoundEnd: (endRound, processRound) => {
      if (!endRound) {
        return;
      }
      console.log(`====3====`);
      console.log(
        `========game over,${endRound ? endRound.id : "NaN"}Billing stopped, ${
          processRound ? processRound.id : "NaN"
        }start calculating========`
      );

      if (endRound) {
        betManager.roundEndEvent(endRound);
        if (betManager.betHistory[endRound.id]) {
          log(
            `betting settlement ${endRound.id} , bet amount ${
              betManager.betHistory[endRound.id]
                ? betManager.betHistory[endRound.id].amount
                : "none"
            }, current amount: ${betManager.currentBalance}`
          );
        }
      }

      calculateResult(endRound);
      console.log(`====5====`);
      getUnCollectHistory().then((res) => {
        if (res.length > 0) {
          for (let i = 0; i < res.length; i++) {
            const cur = res[i];

            collect(Number(cur.round.id))
              .then(() => {
                // Recycle if you win
                console.log("🤩🤩🤩🤩🤩🤩🤩 Recycled successfully!");
              })
              .catch(() => {
                console.error("😥 Failed to recycle");
              });
          }
        }
      });
    },

    onNearsAnEnd: (round) => {
      betManager.betEvent(round).then((res) => {
        if (res) {
          const { id, amount, position } = res;
          log(`bet ${id} , bet amount ${amount}, ${position}`);
        }
      });
      return true;
    },
  });
});
// getActiveBetRound().then((round) => console.log("Currently available for betting", round));
collect(10087);