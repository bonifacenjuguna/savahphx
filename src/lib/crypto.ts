export type Net = { id: string; name: string; tick: string; color: string; re?: RegExp; memo?: string };
const EVM = /^0x[a-fA-F0-9]{40}$/;
const TRON = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

export const NETS: Net[] = [
  { id: "btc", name: "Bitcoin", tick: "BTC", color: "#F7931A", re: /^(bc1[a-z0-9]{25,60}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/ },
  { id: "eth", name: "Ethereum", tick: "ETH", color: "#627EEA", re: EVM },
  { id: "sol", name: "Solana", tick: "SOL", color: "#9945FF", re: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ },
  { id: "usdt-trc20", name: "USDT on TRON (TRC20)", tick: "USDT", color: "#26A17B", re: TRON },
  { id: "usdt-erc20", name: "USDT on Ethereum (ERC20)", tick: "USDT", color: "#26A17B", re: EVM },
  { id: "usdt-bep20", name: "USDT on BNB Chain (BEP20)", tick: "USDT", color: "#26A17B", re: EVM },
  { id: "usdc", name: "USDC on Ethereum", tick: "USDC", color: "#2775CA", re: EVM },
  { id: "bnb", name: "BNB Chain", tick: "BNB", color: "#F0B90B", re: EVM },
  { id: "trx", name: "TRON", tick: "TRX", color: "#EB0029", re: TRON },
  { id: "xrp", name: "XRP Ledger", tick: "XRP", color: "#3b4350", re: /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/, memo: "Destination tag" },
  { id: "ltc", name: "Litecoin", tick: "LTC", color: "#A6A9AA", re: /^(ltc1[a-z0-9]{25,60}|[LM3][a-km-zA-HJ-NP-Z1-9]{26,33})$/ },
  { id: "doge", name: "Dogecoin", tick: "DOGE", color: "#C2A633", re: /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/ },
  { id: "ton", name: "TON", tick: "TON", color: "#0098EA", re: /^(EQ|UQ)[A-Za-z0-9_-]{46}$/, memo: "Memo / comment" },
  { id: "ada", name: "Cardano", tick: "ADA", color: "#3468D1", re: /^addr1[0-9a-z]{50,110}$/ },
  { id: "matic", name: "Polygon", tick: "POL", color: "#8247E5", re: EVM },
  { id: "xmr", name: "Monero", tick: "XMR", color: "#FF6600", re: /^[48][0-9A-Za-z]{94}$/ },
  { id: "custom", name: "Other network", tick: "COIN", color: "#8a93a8" },
];
export const netById = (id: string) => NETS.find((n) => n.id === id);
export const shortAddr = (a: string) => (a.length > 18 ? `${a.slice(0, 8)}...${a.slice(-6)}` : a);
export const walletWarn = (net: Net | undefined, a: string) =>
  a.trim() && net?.re && !net.re.test(a.trim()) ? `This does not look like a valid ${net.name} address. Double-check it, since funds sent to a wrong address are lost.` : undefined;
