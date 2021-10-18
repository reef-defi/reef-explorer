DELETE FROM contract WHERE block_height >= 1077077 AND block_height <= 1145000;
UPDATE contract SET name = '', arguments = NULL, verified = false, source = NULL, compiler_version = NULL, optimization = NULL, runs = NULL, target = NULL, abi = NULL, license = NULL, is_erc20 = false, token_name = NULL, token_symbol = NULL, token_decimals = NULL, token_total_supply = NULL, token_validated = false, token_description = NULL, token_icon_url = NULL, token_coingecko_id = NULL, token_coinmarketcap_id = NULL WHERE bytecode = '0x'

