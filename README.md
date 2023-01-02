# Atomic Swap

## Overview

We have 2 identical contracts which will be deployed on Goerli and Polygon respectively. Once done, Anyone can start swapping.
The flow is as follows:
1. Bob wants 100 GoerliETH and Alice is willing to sell it 1 ETH(Mumbai for now)
2. Alice generates a random secret and generates its keccak256 hash. Alice gives that hash to Bob.
3. Alice deposits 100 GoerliETH into the GoerliHTLC contract and designate Bob as the beneficiary, the tokens are locked with the hash
4. Bob responds by depositing 1 ETH into the PolygonHTLC and designate Alice as the beneficiary, the tokens are also locked with the same hash Bob has obtained from Alice
5. Alice has the original secret that was used to produce the hash (called a pre-image), so Alice uses it to call the withdraw() function on the HTLC contract to withdraw the order payment and fully receive the 1 ETH from Bob. By doing so, Alice necessarily reveals the pre-image in the transaction output, which becomes visible to Bob.
6. Bob uses the pre-image to finalize his payment from Alice

The frontend has been developed in way following the above steps. Detailed info on how to do an atomic swap is explained below

## How to run the App

1. Clone Repo and npm install both inside this folder and the client folder.

2. (optional) You may can deploy your own version of the contracts. Just setup all the keys listed in the .env.example file and then run both the below commands
```
npx hardhat run scripts/deploy-goerli.js --network goerli
```
```
npx hardhat run scripts/deploy-mumbai.js --network mumbai
```

3. cd into client folder and ```npm start```

4. Switch to goerli and from home, you can create a new order by filling all the info. This order is for sellers who want to sell their Goerli ETH. They may fill the form according to the instructions prvided on the page.


5. Once the order is submitted you can view it on Orders tab. Now, those people who want to buy Goerli ETH can use this orders page to find good deals. Once they find a good deal, they can simply click on confirm and confirm the transaction. Then copy the hash of that particular order, switch to Mainnet(for testing Mumbai) and then go to home. You can now create an order by giving the same hash and also specifying the exact amount of ETH that the seller stated. You should also specify the correct address of the seller and also give a lock time. Make sure the lock time is about half given by the seller. This is done to prevent a vulnerability that exists on Atomic Swap

6. After the buy order has been placed by the buyer. The seller may use his secret to withdraw Ether to his wallet by going to the Orders tab and clicking on withdraw. 

7. After he withdraws, the secret will be visible from the transaction hash. And the buyer can switch the network back to goerli and withdraw the Goerli eth from the contract.