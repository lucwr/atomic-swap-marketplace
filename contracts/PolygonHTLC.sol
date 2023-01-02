// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PolygonHTLC is Ownable{

    struct Order{
        address receipient;
        address owner;
        uint256 lockTime;
        string secret;
        bytes32 hash;
        uint256 amount;
        bool completed;
    }
    mapping(uint256 => Order) public orders;
    uint256 public totalOrders;
    // TODO: Change to 2 MATIC ie, 2 ether. Using 0.001 ether for testing
    uint256 public constant FEE = 0.001 ether;
    uint256 public feesAccumulated;

    function createOrder(bytes32 _hash, address _receipient, uint256 _amountInWei, uint256 _lockTime) external payable{
        require(msg.value >= _amountInWei + FEE, "Please send the correct amount");
        feesAccumulated += FEE;
        totalOrders++;
        Order memory thisOrder = Order(
            _receipient,
            msg.sender,
            block.timestamp + _lockTime,
            "",
            _hash,
            _amountInWei,
            false
        );
        orders[totalOrders] = thisOrder;
    }

    function withdraw(uint256 _orderId, string memory _secret) external {
        require(keccak256(abi.encodePacked(_secret)) == orders[_orderId].hash, 'You entered the wrong secret');
        require(msg.sender == orders[_orderId].receipient, "Not Authorized");
        require(orders[_orderId].completed == false, "Already transacted");
        orders[_orderId].secret = _secret;
        orders[_orderId].completed = true;
        (bool sent, ) = orders[_orderId].receipient.call{value: orders[_orderId].amount}("");
        require(sent, "Failed to send Ether");
    } 

    function refund(uint256 _orderId) external {
        require(msg.sender == orders[_orderId].owner, "Not authorized");
        require(orders[_orderId].completed == false, "The order has been completed"); 
        require(block.timestamp >= orders[_orderId].lockTime, 'Still locked. please wait');
        orders[_orderId].completed = true;
        (bool sent, ) = orders[_orderId].owner.call{value: orders[_orderId].amount}("");
        require(sent, "Failed to send Ether");
    }

    function withdrawFees() external onlyOwner{
        uint256 feesToBePaid = feesAccumulated;
        feesAccumulated = 0;
        (bool sent, ) = owner().call{value: feesToBePaid}("");
        require(sent, "Failed to send Ether");
    }

}