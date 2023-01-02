import { ethers } from 'ethers';
import React, { useState } from 'react'

const Eth = ({contract}) => {
    const [hash, setHash] = useState();
    const [amountInEth, setAmountInEth] = useState();
    const [receipient, setReceipient] = useState();
    const [lockTime, setLockTime] = useState();
    const [loading, setLoading] = useState(false);

    const createBuyOrder = async () => {
        try {
            setLoading(true);
            const amountInWei = ethers.utils.parseEther(amountInEth.toString());
            const fee = await contract.FEE();
            const totalAmount = ethers.BigNumber.from(amountInWei).add(ethers.BigNumber.from(fee))
            const tx = await contract.createOrder(
                hash,
                receipient,
                amountInWei,
                lockTime,
                {
                    value: totalAmount
                }
            )
            await tx.wait();
            setLoading(false);
            alert("Created! Once the seller cashes out the matic you deposited, the secret will be revealed in the transaction hash. You can use that to get the Goerli ETH the seller deposited")
        } catch (error) {
            setLoading(false);
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
        <h2 className='text-center mt-5'>Goerli ETH Buyers Portal</h2>
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
        placeholder='Receipient'
        aria-label='Receipient'
        aria-describedby='basic-addon1'
        onChange={e => setReceipient(e.target.value)}
        />
    </div>
    </div>
    <div className='row'>
    <div className='col-6'>
        <input
        type='number'
        className='form-control'
        placeholder='MATIC to send'
        aria-label='MATIC to send'
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
    <button className='btn btn-primary mt-3' onClick={createBuyOrder}>{loading ? <span><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
  <span>Creating...</span></span>: <span>Create a Buy Order</span>}</button>
</div>
<div className='col-lg-2'></div>
</div>
<div className='mt-5 pt-5'>
    <h4>Instructions on How to Buy Goerli ETH</h4>
    <p className='text-muted'><b>IMPORTANT! Please make sure you are doing this after You have confirmed a sell order on Goerli Network</b></p>
    <ol>
        <li><b>Hash</b> - Paste the hash copied from the confirmed order inside the above form</li>
        <li><b>Receipient</b> - Receipient address. This will be the address of the seller from whom you confirmed</li>
        <li><b>MATIC to send</b> - Input the exact amount of MATIC stated by the seller (This is the amount that you will be sending to the contract)</li>
        <li><b>Lock Time in Seconds</b> - <b>IMPORTANT</b> - The lock time should almost be half of that given by the seller.</li>
    </ol>
</div>
    </div>
  )
}

export default Eth