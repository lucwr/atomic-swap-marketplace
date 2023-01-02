import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";

import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

export const { chains, provider } = configureChains(
	[chain.goerli, chain.polygonMumbai],
	[
		alchemyProvider({ alchemyId: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY }),
		publicProvider(),
	]
);

const { connectors } = getDefaultWallets({
	appName: "AtomicSwap",
	chains,
});

export const wagmiClient = createClient({
	autoConnect: true,
	connectors,
	provider,
});

export { WagmiConfig, RainbowKitProvider };