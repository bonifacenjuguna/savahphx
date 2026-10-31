export type Net = { id: string; name: string; tick: string; color: string; g?: string; re?: RegExp; memo?: string; slugs?: string[] };
export const NET_GROUPS = ["Popular", "Stablecoins", "EVM networks", "More coins", "Other"] as const;

const EVM = /^0x[a-fA-F0-9]{40}$/;
const TRON = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const N = (id: string, name: string, tick: string, color: string, g: string, slugs?: string[], re?: RegExp, memo?: string): Net => ({ id, name, tick, color, g, slugs, re, memo });

export const NETS: Net[] = [
  N("btc", "Bitcoin", "BTC", "#F7931A", "Popular", ["bitcoin"], /^(bc1[a-z0-9]{25,60}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/),
  N("eth", "Ethereum", "ETH", "#627EEA", "Popular", ["ethereum"], EVM),
  N("sol", "Solana", "SOL", "#9945FF", "Popular", ["solana"], B58),
  N("bnb", "BNB Chain", "BNB", "#F0B90B", "Popular", ["bnbchain", "binance"], EVM),
  N("xrp", "XRP Ledger", "XRP", "#3b4350", "Popular", ["xrp", "ripple"], /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/, "Destination tag"),
  N("ton", "TON", "TON", "#0098EA", "Popular", ["ton", "toncoin"], /^(EQ|UQ)[A-Za-z0-9_-]{46}$/, "Memo / comment"),
  N("ltc", "Litecoin", "LTC", "#A6A9AA", "Popular", ["litecoin"], /^(ltc1[a-z0-9]{25,60}|[LM3][a-km-zA-HJ-NP-Z1-9]{26,33})$/),
  N("doge", "Dogecoin", "DOGE", "#C2A633", "Popular", ["dogecoin"], /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/),
  N("trx", "TRON", "TRX", "#EB0029", "Popular", ["tron"], TRON),
  N("ada", "Cardano", "ADA", "#3468D1", "Popular", ["cardano"], /^addr1[0-9a-z]{50,110}$/),
  N("usdt-trc20", "USDT on TRON (TRC20)", "USDT", "#26A17B", "Stablecoins", ["tether"], TRON),
  N("usdt-erc20", "USDT on Ethereum (ERC20)", "USDT", "#26A17B", "Stablecoins", ["tether"], EVM),
  N("usdt-bep20", "USDT on BNB Chain (BEP20)", "USDT", "#26A17B", "Stablecoins", ["tether"], EVM),
  N("usdt-sol", "USDT on Solana", "USDT", "#26A17B", "Stablecoins", ["tether"], B58),
  N("usdt-polygon", "USDT on Polygon", "USDT", "#26A17B", "Stablecoins", ["tether"], EVM),
  N("usdt-arb", "USDT on Arbitrum", "USDT", "#26A17B", "Stablecoins", ["tether"], EVM),
  N("usdt-ton", "USDT on TON", "USDT", "#26A17B", "Stablecoins", ["tether"], /^(EQ|UQ)[A-Za-z0-9_-]{46}$/, "Memo / comment"),
  N("usdc", "USDC on Ethereum", "USDC", "#2775CA", "Stablecoins", ["usdc", "usdcoin"], EVM),
  N("usdc-sol", "USDC on Solana", "USDC", "#2775CA", "Stablecoins", ["usdc", "usdcoin"], B58),
  N("usdc-base", "USDC on Base", "USDC", "#2775CA", "Stablecoins", ["usdc", "usdcoin"], EVM),
  N("usdc-polygon", "USDC on Polygon", "USDC", "#2775CA", "Stablecoins", ["usdc", "usdcoin"], EVM),
  N("dai", "DAI", "DAI", "#F5AC37", "Stablecoins", ["dai"], EVM),
  N("matic", "Polygon", "POL", "#8247E5", "EVM networks", ["polygon"], EVM),
  N("avax", "Avalanche C-Chain", "AVAX", "#E84142", "EVM networks", ["avalanche"], EVM),
  N("arb", "Arbitrum", "ARB", "#28A0F0", "EVM networks", ["arbitrum"], EVM),
  N("op", "Optimism", "OP", "#FF0420", "EVM networks", ["optimism"], EVM),
  N("base", "Base", "BASE", "#0052FF", "EVM networks", ["base", "coinbase"], EVM),
  N("etc", "Ethereum Classic", "ETC", "#3AB83A", "EVM networks", ["ethereumclassic", "ethereum"], EVM),
  N("link", "Chainlink", "LINK", "#375BD2", "EVM networks", ["chainlink"], EVM),
  N("shib", "Shiba Inu", "SHIB", "#E5322B", "EVM networks", ["shibainu"], EVM),
  N("vet", "VeChain", "VET", "#15BDFF", "EVM networks", ["vechain"], EVM),
  N("bch", "Bitcoin Cash", "BCH", "#8DC351", "More coins", ["bitcoincash"], /^((bitcoincash:)?[qp][a-z0-9]{41}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/i),
  N("dot", "Polkadot", "DOT", "#E6007A", "More coins", ["polkadot"], /^1[a-km-zA-HJ-NP-Z1-9]{46,47}$/),
  N("atom", "Cosmos", "ATOM", "#2E3148", "More coins", ["cosmos"], /^cosmos1[a-z0-9]{38}$/),
  N("near", "NEAR", "NEAR", "#2b2f3a", "More coins", ["near"], /^(([a-z0-9_-]+\.)+near|[a-f0-9]{64})$/),
  N("algo", "Algorand", "ALGO", "#2b2f3a", "More coins", ["algorand"], /^[A-Z2-7]{58}$/),
  N("xlm", "Stellar", "XLM", "#14B6E7", "More coins", ["stellar"], /^G[A-Z2-7]{55}$/, "Memo"),
  N("hbar", "Hedera", "HBAR", "#2b2f3a", "More coins", ["hedera"], /^0\.0\.\d+$/, "Memo"),
  N("fil", "Filecoin", "FIL", "#0090FF", "More coins", ["filecoin"], /^f[0-4][a-z0-9]{10,}$/),
  N("apt", "Aptos", "APT", "#2b2f3a", "More coins", ["aptos"], /^0x[a-fA-F0-9]{1,64}$/),
  N("sui", "Sui", "SUI", "#4DA2FF", "More coins", ["sui"], /^0x[a-fA-F0-9]{64}$/),
  N("zec", "Zcash", "ZEC", "#F4B728", "More coins", ["zcash"], /^(t1|t3)[a-zA-Z0-9]{33}$/),
  N("dash", "Dash", "DASH", "#008DE4", "More coins", ["dash"], /^X[1-9A-HJ-NP-Za-km-z]{33}$/),
  N("xmr", "Monero", "XMR", "#FF6600", "More coins", ["monero"], /^[48][0-9A-Za-z]{94}$/),
  N("xtz", "Tezos", "XTZ", "#2C7DF7", "More coins", ["tezos"], /^(tz[123]|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/),
  N("kas", "Kaspa", "KAS", "#2b6f68", "More coins", ["kaspa"], /^kaspa:[a-z0-9]{61,63}$/),
  N("icp", "Internet Computer", "ICP", "#29ABE2", "More coins", ["internetcomputer"]),
  N("ln", "Bitcoin Lightning", "LN", "#792EE5", "More coins", ["lightning"]),
  N("custom", "Other network", "COIN", "#8a93a8", "Other"),
];
export const netById = (id: string) => NETS.find((n) => n.id === id);
export const shortAddr = (a: string) => (a.length > 18 ? `${a.slice(0, 8)}...${a.slice(-6)}` : a);
export const walletWarn = (net: Net | undefined, a: string) =>
  a.trim() && net?.re && !net.re.test(a.trim()) ? `This does not look like a valid ${net.name} address. Double-check it, since funds sent to a wrong address are lost.` : undefined;
