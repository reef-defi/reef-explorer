module.exports = {
  INSERT_CONTRACT_SQL: `INSERT INTO contract (
    contract_id,
    owner,
    name,
    value,
    gas_limit,
    storage_limit,
    deployment_bytecode,
    bytecode_metadata,
    bytecode_arguments,
    block_height,
    timestamp
  ) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11
  )
  ON CONFLICT ON CONSTRAINT contract_pkey
  DO UPDATE SET
    name = EXCLUDED.name,
    deployment_bytecode = EXCLUDED.deployment_bytecode,
    bytecode_metadata = EXCLUDED.bytecode_metadata,
    bytecode_arguments = EXCLUDED.bytecode_arguments
  ;`
};