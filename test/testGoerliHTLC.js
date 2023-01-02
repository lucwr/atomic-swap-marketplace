const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Tests for GoerliHTLC', () => {
    let owner;
    let address1;
    let address2;
    let address3;
    let contract;
    beforeEach(async () => {
        [owner, address1, address2, address3] = await ethers.getSigners();
        let Contract = await ethers.getContractFactory('GoerliHTLC');
        contract = await Contract.deploy();
        await contract.deployed();
    });

    describe('Deployment', () => {
        it('contract should be deployed', () => {
          expect(contract.address).to.not.eq(ethers.constants.AddressZero);
        });
    });

    describe('Creating Orders',  () => {
        let hash
        let amountInWei
        let amountWantedInWei
        let locktime
        beforeEach(() => {
            hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('secret'));
            amountInWei = ethers.utils.parseEther('100');
            amountWantedInWei = ethers.utils.parseEther('1');
            locktime = 100000;
        })
        it('An order should be created', async () => {
            const tx = await contract.connect(address1).createOrder(hash, amountInWei, amountWantedInWei, locktime, {value: amountInWei});
            await tx.wait();
            expect(await ethers.provider.getBalance(contract.address)).to.eq(amountInWei);
            const order = await contract.orders(1);
            expect(order.owner).to.eq(address1.address);
            expect(order.hash).to.eq(hash)
            expect(order.amount).to.eq(amountInWei)
            expect(order.amountWanted).to.eq(amountWantedInWei)
        });

        it("Should error out when the wrong amount is sent", async () => {
            await expect(contract.connect(address1).createOrder(hash, amountInWei, amountWantedInWei, locktime, {value: 100000})).to.be.revertedWith("Please send the correct amount")
        })

        it("Create multiple orders", async () => {
            const tx = await contract.connect(address1).createOrder(hash, amountInWei, amountWantedInWei, locktime, {value: amountInWei});
            await tx.wait();
            let hash1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('hehe'));
            let amountInWei1 = ethers.utils.parseEther('200');
            let amountWantedInWei1 = ethers.utils.parseEther('5');
            let locktime1 = 1000;
            const tx2 = await contract.connect(address2).createOrder(hash1, amountInWei1, amountWantedInWei1, locktime1, {value: amountInWei1});
            await tx2.wait();
            const tx3 = await contract.connect(address3).createOrder(hash1, amountInWei1, amountWantedInWei1, locktime1, {value: amountInWei1});
            await tx3.wait();

            const firstOrder = await contract.orders(1);
            expect(firstOrder.owner).to.eq(address1.address);
            const secondOrder = await contract.orders(2);
            expect(secondOrder.owner).to.eq(address2.address);
            const thirdOrder = await contract.orders(3);
            expect(thirdOrder.owner).to.eq(address3.address);
            expect(await contract.totalOrders()).to.eq(3);
        })
    })
    
    describe("Withdrawing", () => {
        let hash
        let amountInWei
        let amountWantedInWei
        let locktime
        beforeEach(async () => {
            // address1 creates a sell order for Goerli ETH. 
            hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('hello'));
            amountInWei = ethers.utils.parseEther('150');
            amountWantedInWei = ethers.utils.parseEther('2');
            locktime = 200000;
            const tx = await contract.connect(address1).createOrder(hash, amountInWei, amountWantedInWei, locktime, {value: amountInWei});
            await tx.wait();
        })
        it("Withdraw after secret is revealed", async () => {
            // assume address2 is the one buying. Also assume address2 had created a buy order on Eth Mainnet with the same hash and also address1 has already claimed their money from the mainnet
            await contract.connect(address2).confirmOrder(1)
            const beforeBalance = await ethers.provider.getBalance(address2.address)
            await contract.connect(address2).withdraw(1, 'hello');
            const orderDetails = await contract.orders(1);
            expect(await orderDetails.completed).to.eq(true)
            expect(await ethers.provider.getBalance(address2.address)).to.gt(beforeBalance);
        });
        it("Withdraw should not occur when wrong secret is entered", async () => {
            await contract.connect(address2).confirmOrder(1);
            await expect(contract.connect(address2).withdraw(1, 'helloo')).to.be.revertedWith("You entered the wrong secret");
        })
        it("Cannot Withdraw twice", async () => {
            await contract.connect(address2).confirmOrder(1)
            await contract.connect(address2).withdraw(1, 'hello');
            const orderDetails = await contract.orders(1);
            expect(await orderDetails.completed).to.eq(true);
            await expect(contract.connect(address2).withdraw(1, 'hello')).to.be.revertedWith("Already transacted");
        })
        it("Anyone cannot withdraw. Only the receipient can", async () => {
            await contract.connect(address2).confirmOrder(1);
            await expect(contract.connect(address3).withdraw(1, 'hello')).to.be.revertedWith("Not Authorized");
        })
        it("Cannot withdraw if order not confirmed", async ()=> {
            await expect(contract.connect(address2).withdraw(1, 'hello')).to.be.revertedWith("Not Authorized");
        })
        it("Owner cannot confirm self order", async () => {
            await expect(contract.connect(address1).confirmOrder(1)).to.be.revertedWith("You cannot confirm your own order");
        })
    })

    describe("Refunding", () => {
        let hash
        let amountInWei
        let amountWantedInWei
        let locktime
        beforeEach(async () => {
            hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('hey'));
            amountInWei = ethers.utils.parseEther('250');
            amountWantedInWei = ethers.utils.parseEther('3');
            locktime = 10000;
            const tx = await contract.connect(address1).createOrder(hash, amountInWei, amountWantedInWei, locktime, {value: amountInWei});
            await tx.wait();
        })

        it("Owner can claim their funds after the locktime has finished", async () => {
            await network.provider.send('evm_increaseTime', [locktime]);
            const beforeBalance = await ethers.provider.getBalance(address1.address)
            await contract.connect(address1).refund(1);
            expect(await ethers.provider.getBalance(address1.address)).to.gt(beforeBalance)
        })
        it("Owner Cannot claim before locktime has finished", async () => {
            await network.provider.send('evm_increaseTime', [9999]);
            await expect(contract.connect(address1).refund(1)).to.be.revertedWith("Still locked. please wait");
        });
        it("Cannot claim refund if not the owner", async ()=> {
            await network.provider.send('evm_increaseTime', [locktime]);
            await expect(contract.connect(address2).refund(1)).to.be.revertedWith("Not authorized");
        })
        it("Owner Cannot claim if the order has been completed", async () => {
            await network.provider.send('evm_increaseTime', [locktime]);
            await contract.connect(address2).confirmOrder(1)
            await contract.connect(address2).withdraw(1, 'hey');
            const orderDetails = await contract.orders(1);
            expect(await orderDetails.completed).to.eq(true);
            await expect(contract.connect(address1).refund(1)).to.be.revertedWith("The order has been completed");
        })
        it("Owner cannot claim multiple times", async () => {
            await network.provider.send('evm_increaseTime', [locktime]);
            await contract.connect(address1).refund(1);
            const orderDetails = await contract.orders(1);
            expect(await orderDetails.completed).to.eq(true);
            await expect(contract.connect(address1).refund(1)).to.be.revertedWith("The order has been completed");

        })
    })
})