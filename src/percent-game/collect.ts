import { contractWithSigner } from "../contract/contract";
import { getBSCScan } from "../utils/getBSCScan";


export const collect = (epoch: number) => {
  return contractWithSigner.functions
    .claim(epoch)
    .then((tx: any) => {
      console.log("🎉The recovery is successful, the chain address", getBSCScan(tx.hash), tx.hash);
      return tx.wait();
    })
    .catch((err: any) => console.error("Recycling failed", err));
};
