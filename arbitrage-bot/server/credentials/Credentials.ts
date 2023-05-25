import { Wallet, ethers } from 'ethers';
import { Exchange, ExchangeAPI, ExchangeClass, ExchangeOptions } from "ccxt";
import dotenv from "dotenv";

export interface ExchangeCredentials {
    apiKey: string;
    secret: string;
    // Add more exchange credential fields here if needed
}

interface CredentialsConfig {
    [exchangeName: string]: ExchangeCredentials;
    // Add more exchanges here if needed
}

class Credentials {
    public readonly exchanges: Record<string, ExchangeAPI> = {};
    public readonly wallet: Wallet;

    private static instance: Credentials;

    private constructor() {
        dotenv.config();
        // Initialize exchanges credentials
        for (const envName in process.env) {
            if (
                envName.startsWith("EXCHANGE_") &&
                envName.endsWith("_API_KEY")
            ) {
                const exchangeName = envName
                    .slice("EXCHANGE_".length, -"_API_KEY".length)
                    .toLowerCase();
                const apiKey = process.env[envName]!;
                const secret = process.env[`EXCHANGE_${exchangeName.toUpperCase()}_API_SECRET`]!;
                this.exchanges[exchangeName] = { apiKey, secret };
            }
        }

        // Initialize wallet credentials
        const privateKey = process.env.WALLET_PRIVATE_KEY!;
        const provider = new ethers.providers.JsonRpcProvider({
            url: process.env.JSON_RPC_URL!,
        });
        this.wallet = new Wallet(privateKey, provider);
        console.log("Using wallet address: " + this.wallet.address)
    }

    public static shared = new Credentials();
}

export default Credentials;
