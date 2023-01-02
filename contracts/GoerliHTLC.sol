// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16; 

contract GoerliHTLC {

    struct Order{
        address receipient;
        address owner;
        uint256 lockTime; // required 
        string secret; // required "word"
        bytes32 hash; // required 
        uint256 amount; // how much you want to sell
        uint256 amountWanted; 
        bool completed;
    }
    mapping(uint256 => Order) public orders;
    uint256 public totalOrders;

    function createOrder(bytes32 _hash, uint256 _amountInWei, uint256 _amountWantedInWei, uint256 _lockTime) external payable{
        require(msg.value >= _amountInWei, "Please send the correct amount");
        totalOrders++;
        Order memory thisOrder = Order(
            address(0),
            msg.sender,
            block.timestamp + _lockTime,
            "",
            _hash,
            _amountInWei,
            _amountWantedInWei,
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

    // if the lock time is finisihed
    function refund(uint256 _orderId) external {
        require(msg.sender == orders[_orderId].owner, "Not authorized");
        require(orders[_orderId].completed == false, "The order has been completed"); 
        require(block.timestamp >= orders[_orderId].lockTime, 'Still locked. please wait');
        orders[_orderId].completed = true;
        (bool sent, ) = orders[_orderId].owner.call{value: orders[_orderId].amount}("");
        require(sent, "Failed to send Ether");
    }

    function confirmOrder(uint256 _orderId) external{
        require(msg.sender != orders[_orderId].owner, "You cannot confirm your own order");
        require(orders[_orderId].receipient == address(0), "Someone has already requested");
        orders[_orderId].receipient = msg.sender;
    }
}