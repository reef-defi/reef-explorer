import { ABI } from "../../src/types";
import { ContractStorage } from "../utils";

export default {
  name: "StarWarsVoterErc20",
  filename: "contracts/SWVEERC20.sol",
  arguments: JSON.stringify(["9876546", "hello world"]),
  bytecode: "0x60806040523480156200001157600080fd5b50604051620016f4380380620016f4833981016040819052620000349162000445565b60408051808201825260048152635357564560e01b60208083019182528351808501909452601584527f737461722d776172732d706f7765722d657263323000000000000000000000009084015281519192916200009591600391620002dc565b508051620000ab906004906020840190620002dc565b505050620000c433630aba9500620001f460201b60201c565b60058290558051620000de906006906020840190620002dc565b506040805161012081018252600660e08201908152654b616e6f626960d01b610100830152815281518083018352600e81526d263ab5b29029b5bcbbb0b635b2b960911b6020828101919091528083019190915282518084018452601081526f20b730b5b4b71029b5bcbbb0b635b2b960811b818301528284015282518084018452600480825263596f646160e01b82840152606084019190915283518085018552908152634d61636560e01b818301526080830152825180840184526009815268109bd8984811995d1d60ba1b8183015260a08301528251808401909352600b83526a111a985b99dbc811995d1d60aa1b9083015260c0810191909152620001eb90600790816200036b565b505050620005a1565b6001600160a01b0382166200024f5760405162461bcd60e51b815260206004820152601f60248201527f45524332303a206d696e7420746f20746865207a65726f206164647265737300604482015260640160405180910390fd5b806002600082825462000263919062000529565b90915550506001600160a01b038216600090815260208190526040812080548392906200029290849062000529565b90915550506040518181526001600160a01b038316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a35050565b828054620002ea906200054e565b90600052602060002090601f0160209004810192826200030e576000855562000359565b82601f106200032957805160ff191683800117855562000359565b8280016001018555821562000359579182015b82811115620003595782518255916020019190600101906200033c565b5062000367929150620003cb565b5090565b828054828255906000526020600020908101928215620003bd579160200282015b82811115620003bd5782518051620003ac918491602090910190620002dc565b50916020019190600101906200038c565b5062000367929150620003e2565b5b80821115620003675760008155600101620003cc565b8082111562000367576000620003f9828262000403565b50600101620003e2565b50805462000411906200054e565b6000825580601f1062000422575050565b601f016020900490600052602060002090810190620004429190620003cb565b50565b6000806040838503121562000458578182fd5b8251602080850151919350906001600160401b038082111562000479578384fd5b818601915086601f8301126200048d578384fd5b815181811115620004a257620004a26200058b565b604051601f8201601f19908116603f01168101908382118183101715620004cd57620004cd6200058b565b816040528281528986848701011115620004e5578687fd5b8693505b82841015620005085784840186015181850187015292850192620004e9565b828411156200051957868684830101525b8096505050505050509250929050565b600082198211156200054957634e487b7160e01b81526011600452602481fd5b500190565b600181811c908216806200056357607f821691505b602082108114156200058557634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052604160045260246000fd5b61114380620005b16000396000f3fe6080604052600436106100e85760003560e01c806370a082311161008a578063dd62ed3e11610059578063dd62ed3e1461026e578063e7b3387c146102b4578063ee1ff4db146102d6578063fc36e15b146102f857600080fd5b806370a08231146101e357806395d89b4114610219578063a457c2d71461022e578063a9059cbb1461024e57600080fd5b806323b872dd116100c657806323b872dd14610167578063313ce5671461018757806339509351146101a35780634810bc59146101c357600080fd5b806306fdde03146100ed578063095ea7b31461011857806318160ddd14610148575b600080fd5b3480156100f957600080fd5b5061010261030d565b60405161010f9190611034565b60405180910390f35b34801561012457600080fd5b50610138610133366004610dc1565b61039f565b604051901515815260200161010f565b34801561015457600080fd5b506002545b60405190815260200161010f565b34801561017357600080fd5b50610138610182366004610d86565b6103b5565b34801561019357600080fd5b506040516012815260200161010f565b3480156101af57600080fd5b506101386101be366004610dc1565b610464565b3480156101cf57600080fd5b506101026101de366004610e94565b6104a0565b3480156101ef57600080fd5b506101596101fe366004610d33565b6001600160a01b031660009081526020819052604090205490565b34801561022557600080fd5b5061010261054c565b34801561023a57600080fd5b50610138610249366004610dc1565b61055b565b34801561025a57600080fd5b50610138610269366004610dc1565b6105f4565b34801561027a57600080fd5b50610159610289366004610d54565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b3480156102c057600080fd5b506102c9610601565b60405161010f9190610ff0565b3480156102e257600080fd5b506102eb6106f6565b60405161010f9190610f8f565b61030b610306366004610dea565b6107cf565b005b60606003805461031c9061108b565b80601f01602080910402602001604051908101604052809291908181526020018280546103489061108b565b80156103955780601f1061036a57610100808354040283529160200191610395565b820191906000526020600020905b81548152906001019060200180831161037857829003601f168201915b5050505050905090565b60006103ac3384846108e3565b50600192915050565b60006103c2848484610a07565b6001600160a01b03841660009081526001602090815260408083203384529091529020548281101561044c5760405162461bcd60e51b815260206004820152602860248201527f45524332303a207472616e7366657220616d6f756e74206578636565647320616044820152676c6c6f77616e636560c01b60648201526084015b60405180910390fd5b61045985338584036108e3565b506001949350505050565b3360008181526001602090815260408083206001600160a01b038716845290915281205490916103ac91859061049b908690611047565b6108e3565b600781815481106104b057600080fd5b9060005260206000200160009150905080546104cb9061108b565b80601f01602080910402602001604051908101604052809291908181526020018280546104f79061108b565b80156105445780601f1061051957610100808354040283529160200191610544565b820191906000526020600020905b81548152906001019060200180831161052757829003601f168201915b505050505081565b60606004805461031c9061108b565b3360009081526001602090815260408083206001600160a01b0386168452909152812054828110156105dd5760405162461bcd60e51b815260206004820152602560248201527f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f77604482015264207a65726f60d81b6064820152608401610443565b6105ea33858584036108e3565b5060019392505050565b60006103ac338484610a07565b60075460609060008167ffffffffffffffff81111561063057634e487b7160e01b600052604160045260246000fd5b604051908082528060200260200182016040528015610659578160200160208202803683370190505b50905060005b6007548110156106ef5760086007828154811061068c57634e487b7160e01b600052603260045260246000fd5b906000526020600020016040516106a39190610ef4565b9081526020016040518091039020548282815181106106d257634e487b7160e01b600052603260045260246000fd5b6020908102919091010152806106e7816110c6565b91505061065f565b5092915050565b60606007805480602002602001604051908101604052809291908181526020016000905b828210156107c65783829060005260206000200180546107399061108b565b80601f01602080910402602001604051908101604052809291908181526020018280546107659061108b565b80156107b25780601f10610787576101008083540402835291602001916107b2565b820191906000526020600020905b81548152906001019060200180831161079557829003601f168201915b50505050508152602001906001019061071a565b50505050905090565b3360009081526009602052604090205460ff16156108255760405162461bcd60e51b81526020600482015260136024820152725573657220616c726561647920766f7465642160681b6044820152606401610443565b61082e81610bd7565b61087a5760405162461bcd60e51b815260206004820152601a60248201527f43686172616374657220646f6573206e6f7420657869737473210000000000006044820152606401610443565b3360009081526009602052604090819020805460ff19166001179055516008906108a5908390610ed8565b90815260200160405180910390205460016108c09190611047565b6008826040516108d09190610ed8565b9081526040519081900360200190205550565b6001600160a01b0383166109455760405162461bcd60e51b8152602060048201526024808201527f45524332303a20617070726f76652066726f6d20746865207a65726f206164646044820152637265737360e01b6064820152608401610443565b6001600160a01b0382166109a65760405162461bcd60e51b815260206004820152602260248201527f45524332303a20617070726f766520746f20746865207a65726f206164647265604482015261737360f01b6064820152608401610443565b6001600160a01b0383811660008181526001602090815260408083209487168084529482529182902085905590518481527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a3505050565b6001600160a01b038316610a6b5760405162461bcd60e51b815260206004820152602560248201527f45524332303a207472616e736665722066726f6d20746865207a65726f206164604482015264647265737360d81b6064820152608401610443565b6001600160a01b038216610acd5760405162461bcd60e51b815260206004820152602360248201527f45524332303a207472616e7366657220746f20746865207a65726f206164647260448201526265737360e81b6064820152608401610443565b6001600160a01b03831660009081526020819052604090205481811015610b455760405162461bcd60e51b815260206004820152602660248201527f45524332303a207472616e7366657220616d6f756e7420657863656564732062604482015265616c616e636560d01b6064820152608401610443565b6001600160a01b03808516600090815260208190526040808220858503905591851681529081208054849290610b7c908490611047565b92505081905550826001600160a01b0316846001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef84604051610bc891815260200190565b60405180910390a35b50505050565b6000805b600754811015610d0e57600060078281548110610c0857634e487b7160e01b600052603260045260246000fd5b906000526020600020018054610c1d9061108b565b80601f0160208091040260200160405190810160405280929190818152602001828054610c499061108b565b8015610c965780601f10610c6b57610100808354040283529160200191610c96565b820191906000526020600020905b815481529060010190602001808311610c7957829003601f168201915b5050505050905083604051602001610cae9190610ed8565b6040516020818303038152906040528051906020012081604051602001610cd59190610ed8565b604051602081830303815290604052805190602001201415610cfb575060019392505050565b5080610d06816110c6565b915050610bdb565b50600092915050565b80356001600160a01b0381168114610d2e57600080fd5b919050565b600060208284031215610d44578081fd5b610d4d82610d17565b9392505050565b60008060408385031215610d66578081fd5b610d6f83610d17565b9150610d7d60208401610d17565b90509250929050565b600080600060608486031215610d9a578081fd5b610da384610d17565b9250610db160208501610d17565b9150604084013590509250925092565b60008060408385031215610dd3578182fd5b610ddc83610d17565b946020939093013593505050565b600060208284031215610dfb578081fd5b813567ffffffffffffffff80821115610e12578283fd5b818401915084601f830112610e25578283fd5b813581811115610e3757610e376110f7565b604051601f8201601f19908116603f01168101908382118183101715610e5f57610e5f6110f7565b81604052828152876020848701011115610e77578586fd5b826020860160208301379182016020019490945295945050505050565b600060208284031215610ea5578081fd5b5035919050565b60008151808452610ec481602086016020860161105f565b601f01601f19169290920160200192915050565b60008251610eea81846020870161105f565b9190910192915050565b600080835482600182811c915080831680610f1057607f831692505b6020808410821415610f3057634e487b7160e01b87526022600452602487fd5b818015610f445760018114610f5557610f81565b60ff19861689528489019650610f81565b60008a815260209020885b86811015610f795781548b820152908501908301610f60565b505084890196505b509498975050505050505050565b6000602080830181845280855180835260408601915060408160051b8701019250838701855b82811015610fe357603f19888603018452610fd1858351610eac565b94509285019290850190600101610fb5565b5092979650505050505050565b6020808252825182820181905260009190848201906040850190845b818110156110285783518352928401929184019160010161100c565b50909695505050505050565b602081526000610d4d6020830184610eac565b6000821982111561105a5761105a6110e1565b500190565b60005b8381101561107a578181015183820152602001611062565b83811115610bd15750506000910152565b600181811c9082168061109f57607f821691505b602082108114156110c057634e487b7160e01b600052602260045260246000fd5b50919050565b60006000198214156110da576110da6110e1565b5060010190565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052604160045260246000fdfea2646970667358221220ce4c3b49f2b6bf47ad6ef6a4d0a37b9c15987d2b6392547db950ab027dbd807b64736f6c63430008040033000000000000000000000000000000000000000000000000000000000096b4420000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000b68656c6c6f20776f726c64000000000000000000000000000000000000000000",
  abi: [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "v",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "test",
          "type": "string"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "allowance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "characters",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "subtractedValue",
          "type": "uint256"
        }
      ],
      "name": "decreaseAllowance",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getCharacters",
      "outputs": [
        {
          "internalType": "string[]",
          "name": "",
          "type": "string[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getVoteCount",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "addedValue",
          "type": "uint256"
        }
      ],
      "name": "increaseAllowance",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "character",
          "type": "string"
        }
      ],
      "name": "vote",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    }
  ] as ABI,
  sources: JSON.stringify({
    "@openzeppelin/contracts/token/ERC20/ERC20.sol": "// SPDX-License-Identifier: MIT\n\npragma solidity ^0.8.0;\n\nimport \"./IERC20.sol\";\nimport \"./extensions/IERC20Metadata.sol\";\nimport \"../../utils/Context.sol\";\n\n/**\n * @dev Implementation of the {IERC20} interface.\n *\n * This implementation is agnostic to the way tokens are created. This means\n * that a supply mechanism has to be added in a derived contract using {_mint}.\n * For a generic mechanism see {ERC20PresetMinterPauser}.\n *\n * TIP: For a detailed writeup see our guide\n * https://forum.zeppelin.solutions/t/how-to-implement-erc20-supply-mechanisms/226[How\n * to implement supply mechanisms].\n *\n * We have followed general OpenZeppelin Contracts guidelines: functions revert\n * instead returning `false` on failure. This behavior is nonetheless\n * conventional and does not conflict with the expectations of ERC20\n * applications.\n *\n * Additionally, an {Approval} event is emitted on calls to {transferFrom}.\n * This allows applications to reconstruct the allowance for all accounts just\n * by listening to said events. Other implementations of the EIP may not emit\n * these events, as it isn't required by the specification.\n *\n * Finally, the non-standard {decreaseAllowance} and {increaseAllowance}\n * functions have been added to mitigate the well-known issues around setting\n * allowances. See {IERC20-approve}.\n */\ncontract ERC20 is Context, IERC20, IERC20Metadata {\n    mapping(address => uint256) private _balances;\n\n    mapping(address => mapping(address => uint256)) private _allowances;\n\n    uint256 private _totalSupply;\n\n    string private _name;\n    string private _symbol;\n\n    /**\n     * @dev Sets the values for {name} and {symbol}.\n     *\n     * The default value of {decimals} is 18. To select a different value for\n     * {decimals} you should overload it.\n     *\n     * All two of these values are immutable: they can only be set once during\n     * construction.\n     */\n    constructor(string memory name_, string memory symbol_) {\n        _name = name_;\n        _symbol = symbol_;\n    }\n\n    /**\n     * @dev Returns the name of the token.\n     */\n    function name() public view virtual override returns (string memory) {\n        return _name;\n    }\n\n    /**\n     * @dev Returns the symbol of the token, usually a shorter version of the\n     * name.\n     */\n    function symbol() public view virtual override returns (string memory) {\n        return _symbol;\n    }\n\n    /**\n     * @dev Returns the number of decimals used to get its user representation.\n     * For example, if `decimals` equals `2`, a balance of `505` tokens should\n     * be displayed to a user as `5.05` (`505 / 10 ** 2`).\n     *\n     * Tokens usually opt for a value of 18, imitating the relationship between\n     * Ether and Wei. This is the value {ERC20} uses, unless this function is\n     * overridden;\n     *\n     * NOTE: This information is only used for _display_ purposes: it in\n     * no way affects any of the arithmetic of the contract, including\n     * {IERC20-balanceOf} and {IERC20-transfer}.\n     */\n    function decimals() public view virtual override returns (uint8) {\n        return 18;\n    }\n\n    /**\n     * @dev See {IERC20-totalSupply}.\n     */\n    function totalSupply() public view virtual override returns (uint256) {\n        return _totalSupply;\n    }\n\n    /**\n     * @dev See {IERC20-balanceOf}.\n     */\n    function balanceOf(address account) public view virtual override returns (uint256) {\n        return _balances[account];\n    }\n\n    /**\n     * @dev See {IERC20-transfer}.\n     *\n     * Requirements:\n     *\n     * - `recipient` cannot be the zero address.\n     * - the caller must have a balance of at least `amount`.\n     */\n    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {\n        _transfer(_msgSender(), recipient, amount);\n        return true;\n    }\n\n    /**\n     * @dev See {IERC20-allowance}.\n     */\n    function allowance(address owner, address spender) public view virtual override returns (uint256) {\n        return _allowances[owner][spender];\n    }\n\n    /**\n     * @dev See {IERC20-approve}.\n     *\n     * Requirements:\n     *\n     * - `spender` cannot be the zero address.\n     */\n    function approve(address spender, uint256 amount) public virtual override returns (bool) {\n        _approve(_msgSender(), spender, amount);\n        return true;\n    }\n\n    /**\n     * @dev See {IERC20-transferFrom}.\n     *\n     * Emits an {Approval} event indicating the updated allowance. This is not\n     * required by the EIP. See the note at the beginning of {ERC20}.\n     *\n     * Requirements:\n     *\n     * - `sender` and `recipient` cannot be the zero address.\n     * - `sender` must have a balance of at least `amount`.\n     * - the caller must have allowance for ``sender``'s tokens of at least\n     * `amount`.\n     */\n    function transferFrom(\n        address sender,\n        address recipient,\n        uint256 amount\n    ) public virtual override returns (bool) {\n        _transfer(sender, recipient, amount);\n\n        uint256 currentAllowance = _allowances[sender][_msgSender()];\n        require(currentAllowance >= amount, \"ERC20: transfer amount exceeds allowance\");\n        unchecked {\n            _approve(sender, _msgSender(), currentAllowance - amount);\n        }\n\n        return true;\n    }\n\n    /**\n     * @dev Atomically increases the allowance granted to `spender` by the caller.\n     *\n     * This is an alternative to {approve} that can be used as a mitigation for\n     * problems described in {IERC20-approve}.\n     *\n     * Emits an {Approval} event indicating the updated allowance.\n     *\n     * Requirements:\n     *\n     * - `spender` cannot be the zero address.\n     */\n    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {\n        _approve(_msgSender(), spender, _allowances[_msgSender()][spender] + addedValue);\n        return true;\n    }\n\n    /**\n     * @dev Atomically decreases the allowance granted to `spender` by the caller.\n     *\n     * This is an alternative to {approve} that can be used as a mitigation for\n     * problems described in {IERC20-approve}.\n     *\n     * Emits an {Approval} event indicating the updated allowance.\n     *\n     * Requirements:\n     *\n     * - `spender` cannot be the zero address.\n     * - `spender` must have allowance for the caller of at least\n     * `subtractedValue`.\n     */\n    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {\n        uint256 currentAllowance = _allowances[_msgSender()][spender];\n        require(currentAllowance >= subtractedValue, \"ERC20: decreased allowance below zero\");\n        unchecked {\n            _approve(_msgSender(), spender, currentAllowance - subtractedValue);\n        }\n\n        return true;\n    }\n\n    /**\n     * @dev Moves `amount` of tokens from `sender` to `recipient`.\n     *\n     * This internal function is equivalent to {transfer}, and can be used to\n     * e.g. implement automatic token fees, slashing mechanisms, etc.\n     *\n     * Emits a {Transfer} event.\n     *\n     * Requirements:\n     *\n     * - `sender` cannot be the zero address.\n     * - `recipient` cannot be the zero address.\n     * - `sender` must have a balance of at least `amount`.\n     */\n    function _transfer(\n        address sender,\n        address recipient,\n        uint256 amount\n    ) internal virtual {\n        require(sender != address(0), \"ERC20: transfer from the zero address\");\n        require(recipient != address(0), \"ERC20: transfer to the zero address\");\n\n        _beforeTokenTransfer(sender, recipient, amount);\n\n        uint256 senderBalance = _balances[sender];\n        require(senderBalance >= amount, \"ERC20: transfer amount exceeds balance\");\n        unchecked {\n            _balances[sender] = senderBalance - amount;\n        }\n        _balances[recipient] += amount;\n\n        emit Transfer(sender, recipient, amount);\n\n        _afterTokenTransfer(sender, recipient, amount);\n    }\n\n    /** @dev Creates `amount` tokens and assigns them to `account`, increasing\n     * the total supply.\n     *\n     * Emits a {Transfer} event with `from` set to the zero address.\n     *\n     * Requirements:\n     *\n     * - `account` cannot be the zero address.\n     */\n    function _mint(address account, uint256 amount) internal virtual {\n        require(account != address(0), \"ERC20: mint to the zero address\");\n\n        _beforeTokenTransfer(address(0), account, amount);\n\n        _totalSupply += amount;\n        _balances[account] += amount;\n        emit Transfer(address(0), account, amount);\n\n        _afterTokenTransfer(address(0), account, amount);\n    }\n\n    /**\n     * @dev Destroys `amount` tokens from `account`, reducing the\n     * total supply.\n     *\n     * Emits a {Transfer} event with `to` set to the zero address.\n     *\n     * Requirements:\n     *\n     * - `account` cannot be the zero address.\n     * - `account` must have at least `amount` tokens.\n     */\n    function _burn(address account, uint256 amount) internal virtual {\n        require(account != address(0), \"ERC20: burn from the zero address\");\n\n        _beforeTokenTransfer(account, address(0), amount);\n\n        uint256 accountBalance = _balances[account];\n        require(accountBalance >= amount, \"ERC20: burn amount exceeds balance\");\n        unchecked {\n            _balances[account] = accountBalance - amount;\n        }\n        _totalSupply -= amount;\n\n        emit Transfer(account, address(0), amount);\n\n        _afterTokenTransfer(account, address(0), amount);\n    }\n\n    /**\n     * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.\n     *\n     * This internal function is equivalent to `approve`, and can be used to\n     * e.g. set automatic allowances for certain subsystems, etc.\n     *\n     * Emits an {Approval} event.\n     *\n     * Requirements:\n     *\n     * - `owner` cannot be the zero address.\n     * - `spender` cannot be the zero address.\n     */\n    function _approve(\n        address owner,\n        address spender,\n        uint256 amount\n    ) internal virtual {\n        require(owner != address(0), \"ERC20: approve from the zero address\");\n        require(spender != address(0), \"ERC20: approve to the zero address\");\n\n        _allowances[owner][spender] = amount;\n        emit Approval(owner, spender, amount);\n    }\n\n    /**\n     * @dev Hook that is called before any transfer of tokens. This includes\n     * minting and burning.\n     *\n     * Calling conditions:\n     *\n     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens\n     * will be transferred to `to`.\n     * - when `from` is zero, `amount` tokens will be minted for `to`.\n     * - when `to` is zero, `amount` of ``from``'s tokens will be burned.\n     * - `from` and `to` are never both zero.\n     *\n     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].\n     */\n    function _beforeTokenTransfer(\n        address from,\n        address to,\n        uint256 amount\n    ) internal virtual {}\n\n    /**\n     * @dev Hook that is called after any transfer of tokens. This includes\n     * minting and burning.\n     *\n     * Calling conditions:\n     *\n     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens\n     * has been transferred to `to`.\n     * - when `from` is zero, `amount` tokens have been minted for `to`.\n     * - when `to` is zero, `amount` of ``from``'s tokens have been burned.\n     * - `from` and `to` are never both zero.\n     *\n     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].\n     */\n    function _afterTokenTransfer(\n        address from,\n        address to,\n        uint256 amount\n    ) internal virtual {}\n}\n",
    "@openzeppelin/contracts/token/ERC20/IERC20.sol": "// SPDX-License-Identifier: MIT\n\npragma solidity ^0.8.0;\n\n/**\n * @dev Interface of the ERC20 standard as defined in the EIP.\n */\ninterface IERC20 {\n    /**\n     * @dev Returns the amount of tokens in existence.\n     */\n    function totalSupply() external view returns (uint256);\n\n    /**\n     * @dev Returns the amount of tokens owned by `account`.\n     */\n    function balanceOf(address account) external view returns (uint256);\n\n    /**\n     * @dev Moves `amount` tokens from the caller's account to `recipient`.\n     *\n     * Returns a boolean value indicating whether the operation succeeded.\n     *\n     * Emits a {Transfer} event.\n     */\n    function transfer(address recipient, uint256 amount) external returns (bool);\n\n    /**\n     * @dev Returns the remaining number of tokens that `spender` will be\n     * allowed to spend on behalf of `owner` through {transferFrom}. This is\n     * zero by default.\n     *\n     * This value changes when {approve} or {transferFrom} are called.\n     */\n    function allowance(address owner, address spender) external view returns (uint256);\n\n    /**\n     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.\n     *\n     * Returns a boolean value indicating whether the operation succeeded.\n     *\n     * IMPORTANT: Beware that changing an allowance with this method brings the risk\n     * that someone may use both the old and the new allowance by unfortunate\n     * transaction ordering. One possible solution to mitigate this race\n     * condition is to first reduce the spender's allowance to 0 and set the\n     * desired value afterwards:\n     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729\n     *\n     * Emits an {Approval} event.\n     */\n    function approve(address spender, uint256 amount) external returns (bool);\n\n    /**\n     * @dev Moves `amount` tokens from `sender` to `recipient` using the\n     * allowance mechanism. `amount` is then deducted from the caller's\n     * allowance.\n     *\n     * Returns a boolean value indicating whether the operation succeeded.\n     *\n     * Emits a {Transfer} event.\n     */\n    function transferFrom(\n        address sender,\n        address recipient,\n        uint256 amount\n    ) external returns (bool);\n\n    /**\n     * @dev Emitted when `value` tokens are moved from one account (`from`) to\n     * another (`to`).\n     *\n     * Note that `value` may be zero.\n     */\n    event Transfer(address indexed from, address indexed to, uint256 value);\n\n    /**\n     * @dev Emitted when the allowance of a `spender` for an `owner` is set by\n     * a call to {approve}. `value` is the new allowance.\n     */\n    event Approval(address indexed owner, address indexed spender, uint256 value);\n}\n",
    "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol":  "// SPDX-License-Identifier: MIT\n\npragma solidity ^0.8.0;\n\nimport \"../IERC20.sol\";\n\n/**\n * @dev Interface for the optional metadata functions from the ERC20 standard.\n *\n * _Available since v4.1._\n */\ninterface IERC20Metadata is IERC20 {\n    /**\n     * @dev Returns the name of the token.\n     */\n    function name() external view returns (string memory);\n\n    /**\n     * @dev Returns the symbol of the token.\n     */\n    function symbol() external view returns (string memory);\n\n    /**\n     * @dev Returns the decimals places of the token.\n     */\n    function decimals() external view returns (uint8);\n}\n",
    "@openzeppelin/contracts/utils/Context.sol": "// SPDX-License-Identifier: MIT\n\npragma solidity ^0.8.0;\n\n/**\n * @dev Provides information about the current execution context, including the\n * sender of the transaction and its data. While these are generally available\n * via msg.sender and msg.data, they should not be accessed in such a direct\n * manner, since when dealing with meta-transactions the account sending and\n * paying for execution may not be the actual sender (as far as an application\n * is concerned).\n *\n * This contract is only required for intermediate, library-like contracts.\n */\nabstract contract Context {\n    function _msgSender() internal view virtual returns (address) {\n        return msg.sender;\n    }\n\n    function _msgData() internal view virtual returns (bytes calldata) {\n        return msg.data;\n    }\n}\n",
    "contracts/SWVEERC20.sol": `
    pragma solidity ^0.8.0;
  
    import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
    
    contract StarWarsVoterErc20 is ERC20 {
    
      uint value;
      string greeting;
      string[] public characters;
      mapping (string => uint) votes;
      mapping (address => bool) voters;
    
      constructor(uint v, string memory test) ERC20("SWVE", "star-wars-power-erc20") {
        _mint(msg.sender, 10000000*18);
        value = v;
        greeting = test;
        characters = [
          "Kanobi", 
          "Luke Skywalker",
          "Anakin Skywalker",
          "Yoda",
          "Mace",
          "Boba Fett",
          "Django Fett"
        ];
      }
    
      function characterExists(string memory character) private view returns (bool) {
        for (uint256 index = 0; index < characters.length; index++) {
            string memory c = characters[index];
            if (keccak256(abi.encodePacked(c)) == keccak256(abi.encodePacked(character))) {
                return true;
            }
        }
        return false;
      }
    
      function getCharacters() public view returns (string[] memory) {
        return characters;
      }
    
      function getVoteCount() public view returns (uint[] memory) {
        uint len = characters.length;
        uint[] memory count = new uint[](len);
    
        for (uint256 index = 0; index < characters.length; index++) {
          count[index] = votes[characters[index]];
        }
        return count;
      }
    
      function vote(string memory character) public payable {
        require(!voters[msg.sender], "User already voted!");
        require(characterExists(character), "Character does not exists!");
    
        voters[msg.sender] = true;
        votes[character] = votes[character] + 1;
      }
    }
    `
  })
} as ContractStorage;