const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Tests for PolygonHTLC', () => {
    let owner;
    let address1;
    let address2;
    let address3;
    let contract;
    beforeEach(async () => {
        [owner, address1, address2, address3] = await ethers.getSigners();
        let Contract = await ethers.getContractFactory('PolygonHTLC');
        contract = await Contract.deploy();
        await contract.deployed();
    });

    describe('Deployment', () => {
        it('Contract will be deployed', () => {
          expect(contract.address).to.not.eq(ethers.constants.AddressZero);
        });
    });

    describe("Order Creation", () => {
        let hash;
        let receipient;
        let amountInWei;
        let locktime;
        let fee;
        beforeEach(async () => {
            // address2 creates an order by using the hash from an order from Goerli. 
            hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('secret'));
            // address1 is the one selling
            receipient = address1.address
            fee = await contract.FEE();
            amountInWei = ethers.utils.parseEther('200');
            locktime = 5000;
        })
        it("Creating an order", async () => {
            let a = ethers.BigNumber.from(amountInWei);
            let b = ethers.BigNumber.from(fee)
            const tx = await contract.connect(address2).createOrder(hash, receipient, amountInWei, locktime, {value: a.add(b)});
            await tx.wait();
            const order = await contract.orders(1);
            expect(order.owner).to.eq(address2.address);
            expect(order.hash).to.eq(hash)
            expect(order.receipient).to.eq(receipient)
            expect(order.amount).to.eq(amountInWei)
            expect(await ethers.provider.getBalance(contract.address)).to.eq(a.add(b));
        })

        it("Should not create order if wrong amount sent", async () => {
            await expect(contract.connect(address2).createOrder(hash, receipient, amountInWei, locktime, {value: amountInWei})).to.be.revertedWith("Please send the correct amount")
        })

        it("Create multiple orders", async () => {
            let a = ethers.BigNumber.from(amountInWei);
            let b = ethers.BigNumber.from(fee)
            const tx = await contract.connect(address2).createOrder(hash, receipient, amountInWei, locktime, {value: a.add(b)});
            await tx.wait();
            let hash1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('hehe'));
            let receipient1 = address2.address
            let amountInWei1 = ethers.utils.parseEther('200');
            let c = ethers.BigNumber.from(amountInWei1)
            let locktime1 = 1000;
            const tx2 = await contract.connect(address1).createOrder(hash1, receipient1, amountInWei1, locktime1, {value: c.add(b)});
            await tx2.wait();
            const tx3 = await contract.connect(address3).createOrder(hash1, receipient1, amountInWei1, locktime1, {value: c.add(b)});
            await tx3.wait();

            const firstOrder = await contract.orders(1);
            expect(firstOrder.owner).to.eq(address2.address);
            const secondOrder = await contract.orders(2);
            expect(secondOrder.owner).to.eq(address1.address);
            const thirdOrder = await contract.orders(3);
            expect(thirdOrder.owner).to.eq(address3.address);
            expect(await contract.totalOrders()).to.eq(3);
        })
    })

    describe("Withdrawals", () => {
        let hash;
        let receipient;
        let amountInWei;
        let locktime;
        let fee;
        beforeEach(async () => {
            hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('secret'));
            receipient = address1.address
            fee = await contract.FEE();
            amountInWei = ethers.utils.parseEther('200');
            locktime = 5000;
            let a = ethers.BigNumber.from(amountInWei);
            let b = ethers.BigNumber.from(fee)
            const tx = await contract.connect(address2).createOrder(hash, receipient, amountInWei, locktime, {value: a.add(b)});
            await tx.wait();
        })

        it("Withdrawing after secret was revealed when address1 withdraws on Goerli", async () => {
            // address1 claiming the reward since they already know the secret
            const beforeBalance = await ethers.provider.getBalance(address1.address)
            await contract.connect(address1).withdraw(1, 'secret');
            const orderDetails = await contract.orders(1);
            expect(await orderDetails.completed).to.eq(true);
            expect(await orderDetails.secret).to.eq('secret');
            expect(await ethers.provider.getBalance(address1.address)).to.gt(beforeBalance);
        });

        it("Withdraw should not occur when wrong secret is entered", async () => {
            await expect(contract.connect(address1).withdraw(1, 'hey')).to.be.revertedWith("You entered the wrong secret");
        })

        it("Only the receipient can withdraw. no one else can", async () => {
            await expect(contract.connect(address2).withdraw(1, 'secret')).to.be.revertedWith("Not Authorized");
            await expect(contract.connect(address3).withdraw(1, 'secret')).to.be.revertedWith("Not Authorized");
        })

        it("Cannot withdraw multiple times", async () => {
            await contract.connect(address1).withdraw(1, 'secret')
            await expect(contract.connect(address1).withdraw(1, 'secret')).to.be.revertedWith("Already transacted");
        })
    })

    describe("Refunding back to the owner", () => {
        let hash;
        let receipient;
        let amountInWei;
        let locktime;
        let fee;
        beforeEach(async () => {
            hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('secret'));
            receipient = address1.address
            fee = await contract.FEE();
            amountInWei = ethers.utils.parseEther('200');
            locktime = 5000;
            let a = ethers.BigNumber.from(amountInWei);
            let b = ethers.BigNumber.from(fee)
            const tx = await contract.connect(address2).createOrder(hash, receipient, amountInWei, locktime, {value: a.add(b)});
            await tx.wait();
        })

        it("Claiming the money back by owner after lockTime", async () => {
            await network.provider.send('evm_increaseTime', [locktime]);
            const beforeBalance = await ethers.provider.getBalance(address2.address)
            await contract.connect(address2).refund(1);
            expect(await ethers.provider.getBalance(address2.address)).to.gt(beforeBalance)
        })
        it("Only the owner who created the order can claim the refund", async () => {
            await network.provider.send('evm_increaseTime', [locktime]);
            await expect(contract.connect(address1).refund(1)).to.be.revertedWith("Not authorized")
            await expect(contract.connect(address3).refund(1)).to.be.revertedWith("Not authorized")
        })
        it("Cannot claim refund if the order was completed", async () => {
            await contract.connect(address1).withdraw(1, 'secret');
            const orderDetails = await contract.orders(1);
            expect(await orderDetails.completed).to.eq(true);
            await network.provider.send('evm_increaseTime', [locktime]);
            await expect(contract.connect(address2).refund(1)).to.be.revertedWith("The order has been completed")
        })
        it("Cannot claim Multiple times", async () => {
            await network.provider.send('evm_increaseTime', [locktime]);
            await contract.connect(address2).refund(1);
            await expect(contract.connect(address2).refund(1)).to.be.revertedWith("The order has been completed")
        })
        it("Cannot claim before the locktime", async () => {
            await network.provider.send('evm_increaseTime', [locktime-1]);
            await expect(contract.connect(address2).refund(1)).to.be.revertedWith("Still locked. please wait")
        })
    })

    describe("Owner collecting the fees", () => {
        let hash;
        let receipient;
        let amountInWei;
        let locktime;
        let fee;
        beforeEach(async () => {
            hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('secret'));
            receipient = address1.address
            fee = await contract.FEE();
            amountInWei = ethers.utils.parseEther('200');
            locktime = 5000;
            let a = ethers.BigNumber.from(amountInWei);
            let b = ethers.BigNumber.from(fee)
            const tx = await contract.connect(address2).createOrder(hash, receipient, amountInWei, locktime, {value: a.add(b)});
            await tx.wait();
            const tx2 = await contract.connect(address3).createOrder(hash, receipient, amountInWei, locktime, {value: a.add(b)});
            await tx2.wait();
        })
        it("Owner claiming the fees", async () => {
            const contractBeforeBalance = await ethers.provider.getBalance(contract.address)
            const ownerBeforeBalance = await ethers.provider.getBalance(owner.address)
            let b = ethers.BigNumber.from(fee)
            expect(await contract.feesAccumulated()).to.eq(b.mul(2))
            await contract.connect(owner).withdrawFees();
            expect(await contract.feesAccumulated()).to.eq(0)
            const contractAfterBalance = await ethers.provider.getBalance(contract.address)
            expect(contractBeforeBalance-contractAfterBalance).to.eq(b.mul(2))
            expect(await ethers.provider.getBalance(owner.address)).to.gt(ownerBeforeBalance)
        })
        it("Only owner can claim the fees", async ()=>{
            await expect(contract.connect(address2).withdrawFees()).to.be.revertedWith("Ownable: caller is not the owner")
            await expect(contract.connect(address3).withdrawFees()).to.be.revertedWith("Ownable: caller is not the owner")
        })
    })
})