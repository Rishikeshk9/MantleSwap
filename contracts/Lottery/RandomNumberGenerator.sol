//SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "./ILottery.sol";

contract RandomNumberGenerator{
    
    uint256 public currentLotteryId;
    address internal requester;

    address public lottery;
    
    modifier onlyLottery() {
        require(
            msg.sender == lottery,
            "Only Lottery can call function"
        );
        _;
    }

    constructor(
        address _lottery
    ) public {
        lottery = _lottery;
    }
    
    /** 
     * Requests randomness from a user-provided seed
     */
    function getRandomNumber(
        uint256 lotteryId
    ) 
        public 
        onlyLottery()
        returns (uint256 randomness) 
    {
        requester = msg.sender;
        currentLotteryId = lotteryId;
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
        ILottery(requester).numbersDrawn(
            currentLotteryId,
            random
        );
        return (random);
    }

}