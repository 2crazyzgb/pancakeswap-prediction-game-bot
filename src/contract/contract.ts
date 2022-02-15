import { predictionsAbi } from "../utils/getMethod";
import { wallet } from "../wallet/wallet";
import { Contract } from "ethers";

export const contractWithSigner = new Contract(
  "0x813ae7f8d46894A8866F7358DbaDc184f4400428",
  predictionsAbi,
  wallet
);
