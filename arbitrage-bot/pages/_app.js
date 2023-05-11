import '../styles/globals.css'

import { WagmiConfig, createClient } from "wagmi";
import { ConnectKitProvider, getDefaultClient } from "connectkit";

const client = createClient(
    getDefaultClient({
        appName: "Your App Name",
        // alchemyId,
    }),
);

function MyApp({ Component, pageProps }) {
    return <WagmiConfig client={client}>
        <ConnectKitProvider>
            <Component {...pageProps} />
        </ConnectKitProvider>
    </WagmiConfig>
}

export default MyApp
