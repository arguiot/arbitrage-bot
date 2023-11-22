#!/usr/bin/env python3

import requests
import json

# GraphQL query to get top pairs
query = """
query pairs($first: Int!) {
	pairs(first: $first, orderBy: reserveUSD, orderDirection: desc) {
		id
		token0 {
			id
			symbol
			decimals
		}
		token1 {
			id
			symbol
			decimals
		}
	}
}
"""

# Function to retrieve top N pairs
def get_top_pairs(n):
	url = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2'
	variables = {'first': n}
	response = requests.post(url, json={'query': query, 'variables': variables})
	data = response.json()['data']['pairs']
	return data

def get_unsupported_tokens():
	url = 'https://unsupportedtokens.uniswap.org'
	response = None
	try:
		response = requests.get(url)
		data = response.json()
		return {token["address"].lower(): token for token in data["tokens"]}
	except Exception as e:
		print(f"Error while fetching unsupported tokens: {str(e)}")
		return {}

def create_bot_config(pairs):
	bot_config = {
		"headless": True,
		"testingMode": True,
		"environment": "production",
		"active": True,
		"queries": []
	}

	unsupported_tokens = get_unsupported_tokens()

	# WETH Address
	WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'

	for pair in pairs:
		token0 = pair["token0"]
		token1 = pair["token1"]

		if token0['id'].lower() in unsupported_tokens or token1['id'].lower() in unsupported_tokens:
			continue

		if token0['id'].lower() == WETH_ADDRESS:
			token0['symbol'] = 'ETH'
			token0['id'] = '0x0000000000000000000000000000000000000000'
		if token1['id'].lower() == WETH_ADDRESS:
			token1['symbol'] = 'ETH'
			token1['id'] = '0x0000000000000000000000000000000000000000'

		query = {
			"name": f"Uniswap {token0['symbol']}/{token1['symbol']}",
			"exchange": "uniswap",
			"type": "dex",
			"tokenA": {
				"name": token0['symbol'],
				"address": token0['id'],
				"decimals": int(token0['decimals'])
			},
			"tokenB": {
				"name": token1['symbol'],
				"address": token1['id'],
				"decimals": int(token1['decimals'])
			}
		}
		bot_config["queries"].append(query)

	return bot_config

# Generate config for top 10 pairs
pairs = get_top_pairs(100)
bot_config = create_bot_config(pairs)

# Write config to file
with open('botconfig.json', 'w') as f:
	json.dump(bot_config, f, indent=4)
