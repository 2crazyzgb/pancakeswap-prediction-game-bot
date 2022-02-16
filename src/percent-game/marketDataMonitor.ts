import { getActiveBetRound } from "./getMarketData";
import type { Market, Round } from "../types/round";
import { BetPosition } from "../types/round";
import { accurateSetTimeout, sleep } from "../utils/promise-utils";
import { calcBalanceTime, calcBalanceTimeMs } from "./round";
import { contractWithSigner } from "../contract/contract";
import { utils } from "ethers";
import type {
  BetListenerEvent,
  CloseRoundListenerType,
  LockRoundListenerType,
  StartRoundListenerType,
} from "../types/predictionListenerType";
import {
  getCoinNumberFromHex,
  getIDFromHex,
  getPriceFromHex,
} from "../utils/money";
import {
  getBSCPending,
  getBSCCompleted,
  bscObservable,
  TransactionType,
} from "./getBSC";

export const numberOrNull = (value: string) => {
  if (value === null) {
    return null;
  }

  const valueNum = Number(value);
  return Number.isNaN(valueNum) ? null : valueNum;
};
const { parseUnits, formatUnits } = utils;

type OnRoundChange = (round: Round) => any;

type OnRoundEnd = (endRound: Round | null, processRound: Round | null) => any;

type OnRoundStart = (round: Round, last: Round) => any;

type OnNearsAnEnd = (round: Round) => boolean;

const getNowSeconds = () => Math.round(Date.now() / 1000);

export class MarketDataMonitor {
  // current match
  currentRound: Round = null;
  // last match
  lastRound: Round = null;
  // polling interval period
  pollingTime = 500;

  _onRoundChange: OnRoundChange;
  _onRoundEnd: OnRoundEnd;
  _onNearsAnEnd: OnNearsAnEnd;
  public nearsAnEndTime: number;
  // game record
  private rounds: { [id: string]: Round } = {};
  private nearsAnEndAlarmMap: { [key: string]: boolean } = {};

  constructor({
    onRoundChange,
    onRoundEnd,
    onNearsAnEnd,
    nearsAnEndTime = 3000,
  }: {
    onRoundChange: OnRoundChange;
    onRoundEnd: OnRoundEnd;
    onNearsAnEnd: OnNearsAnEnd;
    nearsAnEndTime?: number;
  }) {
    this._onRoundChange = onRoundChange;
    this._onRoundEnd = onRoundEnd;
    this._onNearsAnEnd = onNearsAnEnd;
    this.nearsAnEndTime = nearsAnEndTime;
    // Only one of the following three can be selected
    // Build your own listener (recommended)
    this.addBlockChainEvent();
    // poll BSC
    // this.pollingBSC();
    // poll GRT
    // this.pollingGRT();
  }

  /**
   * Betting match data change callback
   * @param curRound
   */
  dataChangeCallback(curRound: Round) {
    if (!this.currentRound) {
      this.currentRound = curRound;
    }

    // if (!this.lastRound) {
    //   this.lastRound = curRound;
    // }

    // game session changes
    // Indicate that the previous game has ended
    if (this.currentRound.id !== curRound.id) {
      this.lastRound = this.currentRound;
      this.currentRound = curRound;
    }

    // 总投注数发生变化
    // if (curRound.totalBets > this.currentRound.totalBets) {
    //   this.currentRound = curRound;
    // Notify Subscription Events
    this._onRoundChange(curRound);
    // }
  }

  /**
   * The match is about to end callback
   */
  // nearsAnEndCallback() {
  //   const round = this.currentRound;
  //   const balanceTime = calcBalanceTimeMs(round);
  //   if (balanceTime < 3000 && !this.nearsAnEndAlarmMap[round.id]) {
  //     // 如果回调返回为true，则同场次不再调用回调
  //     if (this._onNearsAnEnd(round, balanceTime)) {
  //       this.nearsAnEndAlarmMap[round.id] = true;
  //     }
  //   }
  // }

  onChainBetEvent: BetListenerEvent = (
    from,
    roundId,
    value,
    detail,
    position
  ) => {
    const id = typeof roundId === "string" ? roundId : getIDFromHex(roundId);
    const cur = this.rounds[id];
    const num = typeof value === "number" ? value : getCoinNumberFromHex(value);
    // console.log("bet change", id, num, detail.transactionHash, detail.blockHash);
    if (!cur) {
      // No start record yet
      console.log("No local record matched", id);
      return;
    }

    cur.totalBets++;
    cur.totalAmount += num;
    if (position === BetPosition.BULL) {
      cur.bullBets++;
      cur.bullAmount += num;
    } else if (position === BetPosition.BEAR) {
      cur.bearBets++;
      cur.bearAmount += num;
    }
    this.dataChangeCallback(this.currentRound);
  };

  /**
   * Get GRT query time
   */
  async getGRTDateTime(round: Round): Promise<{
    round: Round;
    market: Market;
  }> {
    const res = await getActiveBetRound();
    if (res.round.id !== round.id) {
      await sleep(2000);
      return this.getGRTDateTime(round);
    }
    return res;
  }

  /**
   * The game starts, you can bet
   */
  onChainRoundStart: StartRoundListenerType = (
    roundId,
    blockNumber,
    detail
  ) => {
    const id = getIDFromHex(roundId);
    console.log(new Date().toISOString(), "Games start", id);
    console.log(`onChainRoundStart: StartRoundListenerType #1`);
    const round: Round = {
      bearBets: 0,
      bearAmount: 0,
      bullAmount: 0,
      bullBets: 0,
      id: id.toString(),
      totalAmount: 0,
      startAt: getNowSeconds(),
      totalBets: 0,
      lockPrice: null,
      closePrice: null,
      bets: [],
      endBlock: null,
      epoch: id,
      failed: false,
      lockAt: null,
      startBlock: null,
      position: BetPosition.HOUSE,
      lockBlock: null,
      rewardBaseCalAmount: null,
      rewardAmount: null
    };
    this.rounds[id] = round;
    console.log(`onChainRoundStart: StartRoundListenerType #2`);
    this.dataChangeCallback(round);
    console.log(`onChainRoundStart: StartRoundListenerType #3`);
    this.getGRTDateTime(round).then((res) => {
      console.log(
        `local record time ${round.startAt} with GRT time ${res.round.startAt},Deviation${round.startAt - res.round.startAt
        }s`
      );
      console.log(`onChainRoundStart: StartRoundListenerType 3.1`);
      console.log((round.startAt + 5 * 60) * 1000 - Date.now() - this.nearsAnEndTime);
      // Correction time
      round.startAt = res.round.startAt;
      // Trigger a callback when the end is near
      accurateSetTimeout(
        () => this._onNearsAnEnd(round),
        (round.startAt + 5 * 60) * 1000 - Date.now() - this.nearsAnEndTime
      );
    });
    console.log(`onChainRoundStart: StartRoundListenerType #4`);
  };

  /**
   * Game locked, no betting allowed
   */
  onChainRoundLock: LockRoundListenerType = (
    roundId,
    blockNumber,
    lockPrice,
    detail
  ) => {
    const id = getIDFromHex(roundId);
    const block = getIDFromHex(blockNumber);
    const price = getPriceFromHex(lockPrice);
    console.log(new Date().toISOString(), "game lock", id, "locking", price);

    const cur = this.rounds[id];
    if (cur) {
      cur.lockPrice = price;
      cur.lockBlock = block;
      cur.lockAt = getNowSeconds();
    }
  };

  /**
   * The game is over, see the results
   */
  onChainRoundEnd: CloseRoundListenerType = (
    roundId,
    blockNumber,
    closePrice,
    detail
  ) => {
    const id = getIDFromHex(roundId);
    const block = getIDFromHex(blockNumber);
    const price = getPriceFromHex(closePrice);
    const cur = this.rounds[id];
    console.log(
      new Date().toISOString(),
      "game over",
      id,
      "end price",
      price,
      cur ? `lock in price${cur.lockPrice}` : ""
    );

    if (cur) {
      cur.endBlock = block;
      cur.closePrice = price;
    }

    // first return the last session record
    // At the same time, the current session record will be returned as the next session
    this._onRoundEnd(cur || null, this.rounds[id + 1] || null);
  };

  addBlockChainEvent() {
    contractWithSigner
      .on("BetBull", (from, roundId, value, detail) =>
        this.onChainBetEvent(from, roundId, value, detail, BetPosition.BULL)
      )
      .on("BetBear", (from, roundId, value, detail) =>
        this.onChainBetEvent(from, roundId, value, detail, BetPosition.BEAR)
      )
      .on("EndRound", this.onChainRoundEnd)
      .on("LockRound", this.onChainRoundLock)
      .on("StartRound", this.onChainRoundStart);
  }

  pollingCallback(data: TransactionType) {
    if (this.currentRound) {
      this.onChainBetEvent(
        "",
        this.currentRound.id,
        data.value,
        null,
        data.position
      );
    }
  }

  async pollingBSC(): Promise<any> {
    bscObservable().subscribe((cur) => this.pollingCallback(cur));
  }

  /**
   * 设定
   * @param market
   */
  setPollingTime(market: Market) {
    // 市场暂停，减缓请求频率
    if (market.paused) {
      return 10000;
    }

    const balanceTime = calcBalanceTime(this.currentRound);

    if (balanceTime > 100) {
      return 5000;
    }

    if (balanceTime > 20) {
      return 2000;
    }

    if (balanceTime >= 5) {
      return 300;
    }

    if (balanceTime < 5 && balanceTime > -10) {
      return 100;
    }

    // 常规情况下
    return 300;
  }

  async pollingGRT(): Promise<any> {
    getActiveBetRound().then(({ round, market }) => {
      this.dataChangeCallback(round);
      this.pollingTime = this.setPollingTime(market);
    });
    // poller interval
    // Speed up the number of concurrent requests, so you don't need to wait for the last time to end
    await sleep(this.pollingTime);
    return this.pollingGRT();
  }
}

export default MarketDataMonitor;
