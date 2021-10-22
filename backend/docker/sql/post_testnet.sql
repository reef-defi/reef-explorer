DELETE FROM contract WHERE block_height >= 1077077 AND block_height <= 1145000;

UPDATE contract SET name = '', arguments = NULL, verified = false, source = NULL, compiler_version = NULL, optimization = NULL, runs = NULL, target = NULL, abi = NULL, license = NULL, is_erc20 = false, token_name = NULL, token_symbol = NULL, token_decimals = NULL, token_total_supply = NULL, token_validated = false, token_description = NULL, token_icon_url = NULL, token_coingecko_id = NULL, token_coinmarketcap_id = NULL WHERE bytecode = '0x' OR deployment_bytecode = '0x';

UPDATE contract SET name = '', arguments = NULL, verified = false, source = NULL, compiler_version = NULL, optimization = NULL, runs = NULL, target = NULL, abi = NULL, license = NULL, is_erc20 = false, token_name = NULL, token_symbol = NULL, token_decimals = NULL, token_total_supply = NULL, token_validated = false, token_description = NULL, token_icon_url = NULL, token_coingecko_id = NULL, token_coinmarketcap_id = NULL WHERE name = 'IERC20';

UPDATE contract SET token_icon_url = 'https://assets.coingecko.com/coins/images/13504/small/Group_10572.png', token_validated = TRUE WHERE contract_id = '0x0000000000000000000000000000000001000000';

UPDATE contract SET token_icon_url = 'https://assets.coingecko.com/coins/images/16184/small/rUSD-Logo-200.png', token_validated = TRUE WHERE contract_id = '0x0000000000000000000000000000000001000001';