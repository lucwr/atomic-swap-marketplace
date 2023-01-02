import React, {  useState } from 'react'
import { ethers } from 'ethers'

const Goerli = ({contract}) => {
    const [hash, setHash] = useState();
    const [secretHash, setSecretHash] = useState();
    const [amountInEth, setAmountInEth] = useState();
    const [amountWanted, setAmountWanted] = useState();
    const [lockTime, setLockTime] = useState();
    const [loading, setLoading] = useState(false);

    const createNewOrder = async () => {
        try {
            setLoading(true)
            const amountWantedInWei = ethers.utils.parseEther(amountWanted.toString());
            const amountInWei = ethers.utils.parseEther(amountInEth.toString());
            const tx = await contract.createOrder(
                hash,
                amountInWei,
                amountWantedInWei,
                lockTime,
                {
                    value: amountInWei
                }
            )
            await tx.wait();
            setLoading(false)
            alert("Created! Please wait for someone to confirm and place an order on the mainnet")
        } catch (error) {
            setLoading(false)
            console.log(error)
        }
    }

    const createHash = async (secret) =>{
        try {
            const tx = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));
            setSecretHash(tx)
        } catch (error) {
            console.log(error)
        }
    }

    const dateConvert = async (dateTime) => {
        try {
            const date = new Date(dateTime);
            const seconds = Math.floor(date.getTime()/1000);
            const currDateTime = Date.now();
            const currSeconds = Math.floor(currDateTime/1000)
            setLockTime(seconds - currSeconds)
        } catch (error) {
            console.log(error)
        }
    }

  return (
    <div>
    
    
<h2 className='text-center mt-5'>Goerli ETH Sellers Portal</h2>
<div className='row mt-5'>
<div className='col-lg-2'></div>
<div className='col-lg-8'>
    <div className='row mb-3'>
    <div className='col-6'>
        <input
        type='text'
        className='form-control'
        placeholder='Hash'
        aria-label='Hash'
        aria-describedby='basic-addon1'
        onChange={e => setHash(e.target.value)}
        />
    </div>
    <div className='col-6'>
        <input
        type='text'
        className='form-control'
        placeholder='Price in MATIC'
        aria-label='Price in MATIC'
        aria-describedby='basic-addon1'
        onChange={e => setAmountWanted(e.target.value)}
        />
    </div>
    </div>
    <div className='row'>
    <div className='col-6'>
        <input
        type='number'
        className='form-control'
        placeholder='GoerliETH to Sell'
        aria-label='GoerliETH to Sell'
        aria-describedby='basic-addon1'
        onChange={e => setAmountInEth(e.target.value)}
        />
    </div>
    <div className='col-6'>
        <input
        type='datetime-local'
        className='form-control'
        placeholder='Lock Time in Seconds'
        aria-label='Lock Time'
        aria-describedby='basic-addon1'
        onChange={e => dateConvert(e.target.value)}
        />
    </div>
    </div>
    <button className='btn btn-primary mt-3' onClick={createNewOrder}>{loading ? <span><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
  <span>Creating...</span></span>: <span>Create a GoETH Sell Order</span>}</button>
</div>
<div className='col-lg-2'></div>
</div>
<div className='mt-5 pt-5'>
    <h4>Instructions on How to Sell Your Goerli ETH</h4>
    <ol>
        <li>Create a keccak256 hash from the form below. Use any secret text that you want and Keep it safe somewhere. Please do not send it to anyone or let anyone see it</li>
        <li><b>Hash</b> - Paste the hash inside the form</li>
        <li><b>Price in MATIC</b> - Input the amount of MATIC that you want to sell your GoerliETH for</li>
        <li><b>GoerliETH to Sell</b> - Input the amount of GoerliETH that you want to sell. (This is the amount that you will be sending to the contract)</li>
        <li><b>Lock Time in Seconds</b> - Time for which the funds will be locked in the contract. Please give a large lock time, preferably 1-2 weeks</li>
    </ol>
</div>
<div className='row mt-5 mb-5'>
    <div className='col-lg-2'></div>
    <div className='col-lg-8'>
        <input type='text' className='form-control' placeholder='Secret' onChange={(e) => createHash(e.target.value)}/>
        <label>Hash:</label>
        <input type='text' className='form-control' value={secretHash} disabled />
        <small className='text-muted'>The secret won't be saved on our servers because the hashing is done on the client side</small>

    </div>
    <div className='col-lg-2'></div>
</div>
    </div>
  )
}

export default Goerli