/** Gains / GNS trading contract — Arbitrum Sepolia */
export const CONTRACT_GAINS_ARBITRUM_SEPOLIA =
  "0xd659a15812064C79E189fd950A189b15c75d3186" as const;

export const gnsTradeAbi = [                                                                                                                                                             
  {                                                                                                                                                                             
    inputs: [                                                                                                                                                                   
      {                                                                                                                                                                         
        components: [                                                                                                                                                         
          { name: "user", type: "address" },
          { name: "index", type: "uint32" },                                                                                                                                    
          { name: "pairIndex", type: "uint16" },
          { name: "leverage", type: "uint24" },                                                                                                                                 
          { name: "long", type: "bool" },                                                                                                                                       
          { name: "isOpen", type: "bool" },
          { name: "collateralIndex", type: "uint8" },                                                                                                                           
          { name: "tradeType", type: "uint8" },                                                                                                                               
          { name: "collateralAmount", type: "uint120" },                                                                                                                        
          { name: "openPrice", type: "uint64" },
          { name: "tp", type: "uint64" },                                                                                                                                       
          { name: "sl", type: "uint64" },                                                                                                                                     
          { name: "__placeholder", type: "uint192" },                                                                                                                           
        ],
        name: "_trade",                                                                                                                                                         
        type: "tuple",                                                                                                                                                        
      },
      { name: "_maxSlippageP", type: "uint16" },
      { name: "_referrer", type: "address" },                                                                                                                                   
    ],
    name: "openTrade",                                                                                                                                                          
    outputs: [],                                                                                                                                                              
    stateMutability: "nonpayable",
    type: "function",
  },
  {                                                                                                                                                                             
    inputs: [
      { name: "_index", type: "uint32" },                                                                                                                                       
      { name: "_expectedPrice", type: "uint64" },                                                                                                                             
    ],
    name: "closeTradeMarket",
    outputs: [],                                                                                                                                                                
    stateMutability: "nonpayable",
    type: "function",                                                                                                                                                           
  },                                                                                                                                                                          
] as const;
