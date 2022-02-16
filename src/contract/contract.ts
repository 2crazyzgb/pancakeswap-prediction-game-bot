import { predictionsAbi } from "../utils/getMethod";
import { wallet } from "../wallet/wallet";
import { Contract } from "ethers";
import { PancakePredictionV2__factory } from "../types/typechain";

// export const contractWithSigner = new Contract(
//   "0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA",
//   predictionsAbi,
//   wallet
// );


// export const contractWithSigner = new Contract(
//   "0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA",
//   predictionsAbi,
//   wallet
// );

export const contractWithSigner = PancakePredictionV2__factory.connect(
  "0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA",
  wallet
);