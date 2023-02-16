// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Misc } from "../lib/filecoin-solidity/contracts/v0.8/utils/Misc.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/* 
Contract Usage
    This contract is solely for the purpose of lending and borrowing BIT tokens 
    to provide loans to Storage providers for there hardware costs.
*/
contract MantleLoanRewarder {
    address public owner;

    struct BorrowerLedger {
        uint borrowedAmount;
        uint interestPercent;
        uint emiAmount;
        uint returnedAmount;
        uint currCreditFactor;
        uint creditScore;
        uint loanPeriod;
    }

    uint public lendPool;
    uint public loanPool;
    uint public lenderCount;
    uint public totalInterestAmount;
    uint public returnedActorId;

    mapping(address => BorrowerLedger) public borrowerData;
    
    struct LentLedger {
        uint lentAmount;
        uint interestAccrued;
    }

    mapping(address => LentLedger) public lenderData;

    constructor() {
        owner = msg.sender;
    }

    
    function fund(address from, uint64 unused) public payable {}

    function lendAmount() public payable {
        IERC20(0xbC43694f435b7F79981D478f50bD022bf90c376A).transferFrom(0xa8E7CCE298F1C2e52DE6920840d80C28Fc787F72, msg.sender, msg.value);
        if(lenderData[msg.sender].lentAmount == 0){
            lenderCount+=1;
        }
        lenderData[msg.sender].lentAmount += msg.value;
        lendPool += msg.value;
        loanPool += msg.value;
    }

    function borrowAmount(uint loanPeriod) public {
        require(borrowerData[msg.sender].borrowedAmount <= 0, "Already pending loan, please clear the emis then request for another loan");
        uint actorScore = borrowerData[msg.sender].creditScore;
        uint creditFactor = uint(actorScore)/100;
        borrowerData[msg.sender].currCreditFactor = creditFactor;
        uint interestPercent;
        if(creditFactor >= 10){
            interestPercent = 0;
        }
        else{
            interestPercent = 10 - creditFactor;
        }
        borrowerData[msg.sender].interestPercent = interestPercent;
        borrowerData[msg.sender].loanPeriod = loanPeriod;
        uint loanAmount = 1000000000000000000 + (100000000000000000*creditFactor);
        require(loanAmount < loanPool, "LoanPool is dry ");
        uint interestAmount = getPercentageOf(loanAmount, interestPercent);
        payable(msg.sender).transfer(loanAmount);
        borrowerData[msg.sender].borrowedAmount += (loanAmount+interestAmount);
        borrowerData[msg.sender].emiAmount = uint(borrowerData[msg.sender].borrowedAmount) / loanPeriod;
        loanPool -= loanAmount;
    }
    
    function payEmi() public payable{
        require(borrowerData[msg.sender].borrowedAmount > 0, "Already paid, now rest or request for another Loan");
        require(borrowerData[msg.sender].emiAmount == msg.value, "Wrong value for paying Emi");
        uint actorScore = borrowerData[msg.sender].creditScore;
        uint newCreditFactor = uint(actorScore)/100;
        uint currCreditFactor = borrowerData[msg.sender].currCreditFactor;
        if(newCreditFactor > currCreditFactor){
            borrowerData[msg.sender].currCreditFactor = newCreditFactor;
        }
        
        uint interestAmount = getPercentageOf(msg.value,borrowerData[msg.sender].interestPercent);
        totalInterestAmount += interestAmount;
        borrowerData[msg.sender].borrowedAmount = borrowerData[msg.sender].borrowedAmount - msg.value;
        borrowerData[msg.sender].returnedAmount += msg.value;
        borrowerData[msg.sender].creditScore += 20;
        loanPool += msg.value;
    }

    function setCloseLoan() public{
        require(borrowerData[msg.sender].borrowedAmount < borrowerData[msg.sender].emiAmount , "Please Pay the remaining Emi");
        borrowerData[msg.sender].borrowedAmount = 0;
    }

    function setCreditScore(address borrowerAddress, uint creditScore) public {
        require(msg.sender == owner, "Only owner will call");
        borrowerData[borrowerAddress].creditScore = creditScore;
    }


    function getEmiData(address borrowerAddress) public view returns(uint,uint){
        return (borrowerData[borrowerAddress].emiAmount, borrowerData[borrowerAddress].borrowedAmount);
    }

    function contractPublicData() public view returns(uint,uint,uint,uint){
        return (lendPool, loanPool, lenderCount, totalInterestAmount);
    }

    function getLenderData(address lender, uint sharePercent) public view returns(uint,uint,uint,uint){
        uint amount = lenderData[lender].lentAmount;
        uint interestAmount = getPercentageOf(totalInterestAmount, sharePercent);
        return (amount, lendPool, loanPool, interestAmount);
    }

    function withdraw() public {
        payable(owner).transfer(address(this).balance);
    }

    function getLenderAmount(address lender) public view returns(uint,uint,uint){
        uint amount = lenderData[lender].lentAmount;
        return (amount, lendPool, loanPool);
    }

    // used in Percentage conversion.
    function getPercentageOf(uint256 _amount, uint256 _basisPoints) internal pure returns (uint256 value) {
        value = uint(_amount * _basisPoints) / 100;
    }

    function revokeLend(uint interestAmount, uint revokeLendAmount) public payable{
        require(lenderData[msg.sender].lentAmount == revokeLendAmount, "Please send the total lent amount");
        require(revokeLendAmount + interestAmount < loanPool, "Loan Pool is Dry");
        require(revokeLendAmount + interestAmount < lendPool, "Lend Pool is Dry");
        require(totalInterestAmount >= interestAmount, "Wrong interest amount entered");
        IERC20(0xbC43694f435b7F79981D478f50bD022bf90c376A).transferFrom(msg.sender, 0xa8E7CCE298F1C2e52DE6920840d80C28Fc787F72, revokeLendAmount);
        payable(msg.sender).transfer(revokeLendAmount + interestAmount);
        lenderData[msg.sender].lentAmount -= revokeLendAmount;
        totalInterestAmount -= interestAmount;
        lendPool -= revokeLendAmount + interestAmount;
        loanPool -= revokeLendAmount + interestAmount;
    }

}
