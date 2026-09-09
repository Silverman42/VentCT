import { Assets } from "../types/misc/Cryptos";

export const Crypto = {
    getAssetIcons: (assets: Assets) => {
          switch (assets) {
            case Assets.USDC:
              return "/img/usdt_icon.svg";
            case Assets.USDT:
              return "/img/usdt_icon.svg";
            case Assets.ETH:
              return "/img/eth_icon.svg";
            case Assets.SOL:
              return "/img/sol_icon.svg";
            case Assets.BTC:
              return "/img/btc_icon.svg";
            default:
              return "/img/usdt_icon.svg";
          }
        }
}