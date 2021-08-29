//
// Reef chain errors
// -----------------
//
// Reef chain modules and its indexes:
//
// https://github.com/reef-defi/reef-chain/blob/master/runtime/src/lib.rs#L765
//
//

export const reefChainErrors = [
  // System
  {
    index: 0,
    module: 'System',
    // from https://substrate.dev/rustdocs/latest/frame_system/pallet/enum.Error.html
    errors: [
      {
        index: 0,
        name: 'InvalidSpecName',
        description:
          'The name of specification does not match between the current runtime and the new runtime.',
      },
      {
        index: 1,
        name: 'SpecVersionNeedsToIncrease',
        description:
          'The specification version is not allowed to decrease between the current runtime and the new runtime.',
      },
      {
        index: 2,
        name: 'FailedToExtractRuntimeVersion',
        description:
          'Failed to extract the runtime version from the new runtime.',
      },
      {
        index: 3,
        name: 'FailedToExtractRuntimeVersion',
        description:
          'Either calling Core_version or decoding RuntimeVersion failed.',
      },
      {
        index: 4,
        name: 'NonDefaultComposite',
        description:
          'Suicide called when the account has non-default composite data.',
      },
      {
        index: 5,
        name: 'NonZeroRefCount',
        description:
          'There is a non-zero reference count preventing the account from being purged.',
      },
    ],
  },
  // RandomnessCollectiveFlip (no errors)
  {
    index: 1,
    module: 'RandomnessCollectiveFlip',
    errors: [],
  },
  // Timestamp (no errors)
  {
    index: 2,
    module: 'Timestamp',
    errors: [],
  },
  // Sudo
  {
    index: 3,
    module: 'Sudo',
    // from https://crates.parity.io/pallet_sudo/pallet/enum.Error.html
    errors: [
      {
        index: 0,
        name: 'RequireSudo',
        description: 'Sender must be the Sudo account.',
      },
    ],
  },
  // Scheduler
  {
    index: 4,
    module: 'Scheduler',
    // from https://crates.parity.io/pallet_scheduler/pallet/enum.Error.html
    errors: [
      {
        index: 0,
        name: 'FailedToSchedule',
        description: 'Failed to schedule a call.',
      },
      {
        index: 1,
        name: 'NotFound',
        description: 'Cannot find the scheduled call.',
      },
      {
        index: 2,
        name: 'TargetBlockNumberInPast',
        description: 'Given target block number is in the past.',
      },
      {
        index: 3,
        name: 'RescheduleNoChange',
        description:
          'Reschedule failed because it does not change scheduled time.',
      },
    ],
  },
  // Indices
  {
    index: 5,
    module: 'Indices',
    // from https://crates.parity.io/pallet_indices/pallet/enum.Error.html
    errors: [
      {
        index: 0,
        name: 'NotAssigned',
        description: 'The index was not already assigned.',
      },
      {
        index: 1,
        name: 'NotOwner',
        description: 'The index is assigned to another account.',
      },
      {
        index: 2,
        name: 'InUse',
        description: 'The index was not available.',
      },
      {
        index: 3,
        name: 'NotTransfer',
        description: 'The source and destination accounts are identical.',
      },
      {
        index: 4,
        name: 'Permanent',
        description: 'The index is permanent and may not be freed/changed.',
      },
    ],
  },
  // Balances
  {
    index: 6,
    module: 'Balances',
    // from https://substrate.dev/rustdocs/latest/pallet_balances/pallet/enum.Error.html
    errors: [
      {
        index: 0,
        name: 'VestingBalance',
        description: 'Vesting balance too high to send value.',
      },
      {
        index: 1,
        name: 'LiquidityRestrictions',
        description: 'Account liquidity restrictions prevent withdrawal.',
      },
      {
        index: 2,
        name: 'InsufficientBalance',
        description: 'Balance too low to send value.',
      },
      {
        index: 3,
        name: 'ExistentialDeposit',
        description:
          'Value too low to create account due to existential deposit.',
      },
      {
        index: 4,
        name: 'KeepAlive',
        description: 'Transfer/payment would kill account.',
      },
      {
        index: 5,
        name: 'ExistingVestingSchedule',
        description: 'A vesting schedule already exists for this account.',
      },
      {
        index: 6,
        name: 'DeadAccount',
        description: 'Beneficiary account must pre-exist.',
      },
      {
        index: 7,
        name: 'TooManyReserves',
        description: 'Number of named reserves exceed MaxReserves.',
      },
    ],
  },
  // Currencies
  {
    index: 7,
    module: 'Currencies',
    // from https://github.com/reef-defi/reef-chain/blob/master/modules/currencies/src/lib.rs#L83
    errors: [
      {
        index: 0,
        name: 'AmountIntoBalanceFailed',
        description: 'Unable to convert the Amount type into Balance.',
      },
      {
        index: 1,
        name: 'BalanceTooLow',
        description: 'Balance is too low.',
      },
      {
        index: 2,
        name: 'ERC20InvalidOperation',
        description: 'ERC20 invalid operation.',
      },
      {
        index: 3,
        name: 'EvmAccountNotFound',
        description: 'EVM account not found.',
      },
    ],
  },
  // Tokens
  {
    index: 8,
    module: 'Tokens',
    // from https://github.com/open-web3-stack/open-runtime-module-library/blob/master/tokens/src/lib.rs#L213
    errors: [
      {
        index: 0,
        name: 'BalanceTooLow',
        description: 'The balance is too low.',
      },
      {
        index: 1,
        name: 'AmountIntoBalanceFailed',
        description: 'Cannot convert Amount into Balance type.',
      },
      {
        index: 2,
        name: 'LiquidityRestrictions',
        description: 'Failed because liquidity restrictions due to locking.',
      },
      {
        index: 3,
        name: 'MaxLocksExceeded',
        description: 'Failed because the maximum locks was exceeded.',
      },
      {
        index: 4,
        name: 'KeepAlive',
        description: 'Transfer/payment would kill account.',
      },
      {
        index: 5,
        name: 'ExistentialDeposit',
        description:
          'Value too low to create account due to existential deposit.',
      },
      {
        index: 5,
        name: 'DeadAccount',
        description: 'Beneficiary account must pre-exist.',
      },
    ],
  },
  // TransactionPayment (no errors)
  {
    index: 9,
    module: 'TransactionPayment',
    errors: [],
  },
  // Authority
  {
    index: 10,
    module: 'Authority',
    // from https://github.com/open-web3-stack/open-runtime-module-library/blob/master/authority/src/lib.rs#L165
    errors: [
      {
        index: 0,
        name: 'FailedToSchedule',
        description: 'Failed to schedule a task.',
      },
      {
        index: 1,
        name: 'FailedToCancel',
        description: 'Failed to cancel a task.',
      },
      {
        index: 2,
        name: 'FailedToFastTrack',
        description: 'Failed to fast track a task.',
      },
      {
        index: 3,
        name: 'FailedToDelay',
        description: 'Failed to delay a task.',
      },
    ],
  },
  // EvmAccounts
  {
    index: 20,
    module: 'EvmAccounts',
    // from https://github.com/reef-defi/reef-chain/blob/master/modules/evm-accounts/src/lib.rs#L87
    errors: [
      {
        index: 0,
        name: 'AccountIdHasMapped',
        description: 'AccountId has mapped.',
      },
      {
        index: 1,
        name: 'EthAddressHasMapped',
        description: 'Eth address has mapped.',
      },
      {
        index: 2,
        name: 'BadSignature',
        description: 'Bad signature.',
      },
      {
        index: 3,
        name: 'InvalidSignature',
        description: 'Invalid signature.',
      },
      {
        index: 4,
        name: 'NonZeroRefCount',
        description: 'Account ref count is not zero.',
      },
      {
        index: 5,
        name: 'StillHasActiveReserved',
        description: 'Account still has active reserved.',
      },
    ],
  },
  // Evm
  {
    index: 21,
    module: 'Evm',
    // from https://github.com/reef-defi/reef-chain/blob/master/modules/evm/src/lib.rs#L339
    errors: [
      {
        index: 0,
        name: 'AddressNotMapped',
        description: 'Address not mapped.',
      },
      {
        index: 1,
        name: 'ContractNotFound',
        description: 'Contract not found.',
      },
      {
        index: 2,
        name: 'NoPermission',
        description: 'No permission.',
      },
      {
        index: 3,
        name: 'NumOutOfBound',
        description: 'Number out of bound in calculation.',
      },
      {
        index: 4,
        name: 'StorageExceedsStorageLimit',
        description: 'Storage exceeds max code size.',
      },
      {
        index: 5,
        name: 'ContractDevelopmentNotEnabled',
        description: 'Contract development is not enabled.',
      },
      {
        index: 6,
        name: 'ContractDevelopmentAlreadyEnabled',
        description: 'Contract development is already enabled.',
      },
      {
        index: 7,
        name: 'ContractAlreadyDeployed',
        description: 'Contract already deployed.',
      },
      {
        index: 8,
        name: 'ContractExceedsMaxCodeSize',
        description: 'Contract exceeds max code size.',
      },
      {
        index: 9,
        name: 'OutOfStorage',
        description: 'Storage usage exceeds storage limit.',
      },
      {
        index: 10,
        name: 'ChargeFeeFailed',
        description: 'Charge fee failed.',
      },
      {
        index: 11,
        name: 'ConflictContractAddress',
        description: 'Contract address conflicts with the system contract.',
      },
    ],
  },
  // EVMBridge
  {
    index: 22,
    module: 'EVMBridge',
    // from https://github.com/reef-defi/reef-chain/blob/master/modules/evm-bridge/src/lib.rs#L36
    errors: [
      {
        index: 0,
        name: 'ExecutionFail',
        description: 'ExecutionFail',
      },
      {
        index: 1,
        name: 'ExecutionRevert',
        description: 'ExecutionRevert',
      },
      {
        index: 2,
        name: 'ExecutionFatal',
        description: 'ExecutionFatal',
      },
      {
        index: 3,
        name: 'ExecutionError',
        description: 'ExecutionError',
      },
      {
        index: 4,
        name: 'InvalidReturnValue',
        description: 'InvalidReturnValue',
      },
    ],
  },
  // Authorship
  {
    index: 30,
    module: 'Authorship',
    // from https://github.com/paritytech/substrate/blob/master/frame/authorship/src/lib.rs#L198
    errors: [
      {
        index: 0,
        name: 'InvalidUncleParent',
        description: 'The uncle parent not in the chain.',
      },
      {
        index: 1,
        name: 'UnclesAlreadySet',
        description: 'Uncles already set in the block.',
      },
      {
        index: 2,
        name: 'TooManyUncles',
        description: 'Too many uncles.',
      },
      {
        index: 3,
        name: 'GenesisUncle',
        description: 'The uncle is genesis.',
      },
      {
        index: 4,
        name: 'TooHighUncle',
        description: 'The uncle is too high in chain.',
      },
      {
        index: 5,
        name: 'UncleAlreadyIncluded',
        description: 'The uncle is already included.',
      },
      {
        index: 6,
        name: 'OldUncle',
        description: "The uncle isn't recent enough to be included.",
      },
    ],
  },
  // Babe
  {
    index: 31,
    module: 'Babe',
    // from https://github.com/paritytech/substrate/blob/master/frame/babe/src/lib.rs#L174
    errors: [
      {
        index: 0,
        name: 'InvalidEquivocationProof',
        description:
          'An equivocation proof provided as part of an equivocation report is invalid.',
      },
      {
        index: 1,
        name: 'InvalidKeyOwnershipProof',
        description:
          'A key ownership proof provided as part of an equivocation report is invalid.',
      },
      {
        index: 2,
        name: 'DuplicateOffenceReport',
        description:
          'A given equivocation report is valid but already previously reported.',
      },
    ],
  },
  // Grandpa
  {
    index: 32,
    module: 'Grandpa',
    // from https://github.com/paritytech/substrate/blob/master/frame/grandpa/src/lib.rs#L258
    errors: [
      {
        index: 0,
        name: 'PauseFailed',
        description:
          "Attempt to signal GRANDPA pause when the authority set isn't live (either paused or already pending pause).",
      },
      {
        index: 1,
        name: 'ResumeFailed',
        description:
          "Attempt to signal GRANDPA resume when the authority set isn't paused (either live or already pending resume).",
      },
      {
        index: 2,
        name: 'ChangePending',
        description:
          'Attempt to signal GRANDPA change with one already pending.',
      },
      {
        index: 3,
        name: 'TooSoon',
        description: 'Cannot signal forced change so soon after last.',
      },
      {
        index: 4,
        name: 'InvalidKeyOwnershipProof',
        description:
          'A key ownership proof provided as part of an equivocation report is invalid.',
      },
      {
        index: 5,
        name: 'InvalidEquivocationProof',
        description:
          'An equivocation proof provided as part of an equivocation report is invalid.',
      },
      {
        index: 6,
        name: 'DuplicateOffenceReport',
        description:
          'A given equivocation report is valid but already previously reported.',
      },
    ],
  },
  // Staking
  {
    index: 33,
    module: 'Staking',
    // from https://substrate.dev/rustdocs/latest/pallet_staking/pallet/enum.Error.html
    errors: [
      {
        index: 0,
        name: 'NotController',
        description: 'Not a controller account.',
      },
      {
        index: 1,
        name: 'NotStash',
        description: 'Not a stash account.',
      },
      {
        index: 2,
        name: 'AlreadyBonded',
        description: 'Stash is already bonded.',
      },
      {
        index: 3,
        name: 'AlreadyPaired',
        description: 'Controller is already paired.',
      },
      {
        index: 4,
        name: 'EmptyTargets',
        description: 'Targets cannot be empty.',
      },
      {
        index: 5,
        name: 'DuplicateIndex',
        description: 'Duplicate index.',
      },
      {
        index: 6,
        name: 'InvalidSlashIndex',
        description: 'Slash record index out of bounds.',
      },
      {
        index: 7,
        name: 'InsufficientBond',
        description: 'Can not bond with value less than minimum required.',
      },
      {
        index: 8,
        name: 'NoMoreChunks',
        description: 'Can not schedule more unlock chunks.',
      },
      {
        index: 9,
        name: 'NoUnlockChunk',
        description: 'Can not rebond without unlocking chunks.',
      },
      {
        index: 10,
        name: 'FundedTarget',
        description: 'Attempting to target a stash that still has funds.',
      },
      {
        index: 11,
        name: 'InvalidEraToReward',
        description: 'Invalid era to reward.',
      },
      {
        index: 12,
        name: 'InvalidNumberOfNominations',
        description: 'Invalid number of nominations.',
      },
      {
        index: 13,
        name: 'NotSortedAndUnique',
        description: 'Items are not sorted and unique.',
      },
      {
        index: 14,
        name: 'AlreadyClaimed',
        description:
          'Rewards for this era have already been claimed for this validator.',
      },
      {
        index: 15,
        name: 'IncorrectHistoryDepth',
        description: 'Incorrect previous history depth input provided.',
      },
      {
        index: 16,
        name: 'IncorrectSlashingSpans',
        description: 'Incorrect number of slashing spans provided.',
      },
      {
        index: 17,
        name: 'BadState',
        description:
          'Internal state has become somehow corrupted and the operation cannot continue.',
      },
      {
        index: 18,
        name: 'TooManyTargets',
        description: 'Too many nomination targets supplied.',
      },
      {
        index: 19,
        name: 'BadTarget',
        description:
          'A nomination target was supplied that was blocked or otherwise not a validator.',
      },
      {
        index: 20,
        name: 'CannotChillOther',
        description:
          'The user has enough bond and thus cannot be chilled forcefully by an external person.',
      },
      {
        index: 21,
        name: 'TooManyNominators',
        description:
          'There are too many nominators in the system. Governance needs to adjust the staking settings to keep things safe for the runtime.',
      },
      {
        index: 22,
        name: 'TooManyValidators',
        description:
          'There are too many validators in the system. Governance needs to adjust the staking settings to keep things safe for the runtime.',
      },
    ],
  },
  // Session
  {
    index: 34,
    module: 'Session',
    // from https://substrate.dev/rustdocs/latest/pallet_session/enum.Error.html
    errors: [
      {
        index: 0,
        name: 'InvalidProof',
        description: 'Invalid ownership proof.',
      },
      {
        index: 1,
        name: 'NoAssociatedValidatorId',
        description: 'No associated validator ID for account.',
      },
      {
        index: 2,
        name: 'DuplicatedKey',
        description: 'Registered duplicate key.',
      },
      {
        index: 3,
        name: 'NoKeys',
        description: 'No keys are associated with this account.',
      },
      {
        index: 4,
        name: 'NoAccount',
        description:
          'Key setting account is not live, so it’s impossible to associate keys.',
      },
    ],
  },
  // Historical (no errors)
  {
    index: 35,
    module: 'Historical',
    errors: [],
  },
  // Offences (no errors)
  {
    index: 36,
    module: 'Offences',
    errors: [],
  },
  // ImOnline
  {
    index: 37,
    module: 'ImOnline',
    // from https://github.com/paritytech/substrate/blob/master/frame/im-online/src/lib.rs#L310
    errors: [
      {
        index: 0,
        name: 'InvalidKey',
        description: 'Non existent public key.',
      },
      {
        index: 1,
        name: 'DuplicatedHeartbeat',
        description: 'Duplicated heartbeat.',
      },
    ],
  },
  // AuthorityDiscovery (no errors)
  {
    index: 38,
    module: 'AuthorityDiscovery',
    errors: [],
  },
  // Identity
  {
    index: 40,
    module: 'Identity',
    // from https://github.com/paritytech/substrate/blob/master/frame/identity/src/lib.rs#L205
    errors: [
      {
        index: 0,
        name: 'TooManySubAccounts',
        description: 'Too many subs-accounts.',
      },
      {
        index: 1,
        name: 'NotFound',
        description: "Account isn't found.",
      },
      {
        index: 2,
        name: 'NotNamed',
        description: "Account isn't named.",
      },
      {
        index: 3,
        name: 'EmptyIndex',
        description: 'Empty index.',
      },
      {
        index: 4,
        name: 'FeeChanged',
        description: 'Fee is changed.',
      },
      {
        index: 5,
        name: 'NoIdentity',
        description: 'No identity found.',
      },
      {
        index: 6,
        name: 'StickyJudgement',
        description: 'Sticky judgement.',
      },
      {
        index: 7,
        name: 'JudgementGiven',
        description: 'Judgement given.',
      },
      {
        index: 8,
        name: 'InvalidJudgement',
        description: 'Invalid judgement.',
      },
      {
        index: 9,
        name: 'InvalidIndex',
        description: 'The index is invalid.',
      },
      {
        index: 10,
        name: 'InvalidTarget',
        description: 'The target is invalid.',
      },
      {
        index: 11,
        name: 'TooManyFields',
        description: 'Too many additional fields.',
      },
      {
        index: 12,
        name: 'TooManyRegistrars',
        description:
          'Maximum amount of registrars reached. Cannot add any more.',
      },
      {
        index: 13,
        name: 'AlreadyClaimed',
        description: 'Account ID is already named.',
      },
      {
        index: 14,
        name: 'NotSub',
        description: 'Sender is not a sub-account.',
      },
      {
        index: 15,
        name: 'NotOwned',
        description: "Sub-account isn't owned by sender.",
      },
    ],
  },
  // TechCouncil
  {
    index: 50,
    module: 'TechCouncil',
    // from https://github.com/paritytech/substrate/blob/master/frame/collective/src/lib.rs#L257
    errors: [
      {
        index: 0,
        name: 'NotMember',
        description: 'Account is not a member.',
      },
      {
        index: 1,
        name: 'DuplicateProposal',
        description: 'Duplicate proposals not allowed.',
      },
      {
        index: 2,
        name: 'ProposalMissing',
        description: 'Proposal must exist.',
      },
      {
        index: 3,
        name: 'WrongIndex',
        description: 'Mismatched index.',
      },
      {
        index: 4,
        name: 'DuplicateVote',
        description: 'Duplicate vote ignored.',
      },
      {
        index: 5,
        name: 'AlreadyInitialized',
        description: 'Members are already initialized!.',
      },
      {
        index: 6,
        name: 'TooEarly',
        description:
          'The close call was made too early, before the end of the voting.',
      },
      {
        index: 7,
        name: 'TooManyProposals',
        description:
          'There can only be a maximum of `MaxProposals` active proposals.',
      },
      {
        index: 8,
        name: 'WrongProposalWeight',
        description: 'The given weight bound for the proposal was too low.',
      },
      {
        index: 9,
        name: 'WrongProposalLength',
        description: 'The given length bound for the proposal was too low.',
      },
    ],
  },
  // Poc
  {
    index: 51,
    module: 'Poc',
    // from https://github.com/reef-defi/reef-chain/blob/master/modules/poc/src/lib.rs#L145
    errors: [
      {
        index: 0,
        name: 'AlreadyCandidate',
        description: 'Account is already running as a candidate.',
      },
      {
        index: 1,
        name: 'NotCandidate',
        description: 'Candidate not found.',
      },
      {
        index: 2,
        name: 'CannotLeave',
        description: 'Candidate is a member and cannot withdraw candidacy.',
      },
      {
        index: 3,
        name: 'MaxCandidatesReached',
        description: 'Already have maximum allowed number of candidates.',
      },
      {
        index: 4,
        name: 'AlreadyCommitted',
        description: 'Account already has an active commitment.',
      },
      {
        index: 5,
        name: 'CommitmentNotFound',
        description: 'Cannot operate on a non existing commitment.',
      },
      {
        index: 6,
        name: 'NotCommitted',
        description: 'The commitment is not active.',
      },
      {
        index: 7,
        name: 'CannotWithdrawLocked',
        description: 'Funds are still locked and cannot be withdrawn.',
      },
      {
        index: 8,
        name: 'InsufficientAmount',
        description: 'Bonded amount is too small.',
      },
      {
        index: 9,
        name: 'OverSubscribed',
        description: 'The PoC system already has maximum amount committed.',
      },
    ],
  },
]
