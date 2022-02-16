import type { BigNumber } from "@ethersproject/bignumber";
import type { BetType } from "../types/bet";

export enum BetPosition {
  BULL = "Bull",
  BEAR = "Bear",
  HOUSE = "House",
}

export interface Market {
  id: string;
  paused: boolean;
  epoch: number;
}

export interface Bet {
  id?: string;
  hash?: string;
  amount: number;
  position: BetPosition;
  claimed: boolean;
  claimedHash: string;
  user?: PredictionUser;
  round: Round;
}

export interface PredictionUser {
  id: string;
  address: string;
  block: number;
  totalBets: number;
  totalBNB: number;
}

export interface Round {
  id: string;
  epoch: number;
  failed?: boolean;
  startBlock: number;
  startAt: number;
  lockAt: number;
  lockBlock: number;
  lockPrice: number;
  endBlock: number;
  closePrice: number;
  totalBets: number;
  totalAmount: number;
  bullBets: number;
  bearBets: number;
  bearAmount: number;
  bullAmount: number;
  position: BetPosition;
  rewardBaseCalAmount?: number;
  rewardAmount?: number;
  bets?: Bet[];
  newPosition?: BetType;
}

export interface RoundV2 {
  epoch: BigNumber;
  startTimestamp: BigNumber;
  lockTimestamp: BigNumber;
  closeTimestamp: BigNumber;
  lockPrice: BigNumber;
  closePrice: BigNumber;
  lockOracleId: BigNumber;
  closeOracleId: BigNumber;
  totalAmount: BigNumber;
  bullAmount: BigNumber;
  bearAmount: BigNumber;
  rewardBaseCalAmount: BigNumber;
  rewardAmount: BigNumber;
  oracleCalled: boolean;
  bets?: Bet[];
}