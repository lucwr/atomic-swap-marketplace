import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react'
import { useAccount, useNetwork} from 'wagmi'

const Orders = ({contract}) => {

    const {chain} = useNetwork()
    const {address} = useAccount()
    const [orderListings, setOrderListings] = useState([]);
    const [secret, setSecret] = useState();
    const [withdrawing, setWithdrawing] = useState(false);
    const [refunding, setRefunding] = useState(false)
    const [confirming, setConfirming] = useState(false)

    useEffect(() => {
        getAllOpenOrders();
    }, [contract, chain, withdrawing, refunding, confirming])

    const getAllOpenOrders = async () => {
        try {
            const totalOrderListings = await contract.totalOrders();
            let arr = []
            for(let i=1; i<=totalOrderListings;i++){
                const tx = await contract.orders(i);
                arr.push(tx);
            }
            console.log(arr)
            setOrderListings(arr)
        } catch (error) {
            console.log(error)
        }
    }

    const confirmOrder = async (orderId) => {
        try {
            setConfirming(true)
            const tx = await contract.confirmOrder(orderId);
            await tx.wait();
            setConfirming(false)
            alert("Great!")
        } catch (error) {
            setConfirming(false)
            console.log(error)
        }
    }

    const withdraw = async (orderId) =>{
        try {
            setWithdrawing(true)
            const tx = await contract.withdraw(orderId, secret);
            await tx.wait();
            setWithdrawing(false)
            alert("Transaction Successful! You will see your balance updated shortly")
        } catch (error) {
            setWithdrawing(false)
            console.log(error)
        }
    }

    const refund = async (orderId) => {
        try {
            setRefunding(true)
            const tx = await contract.refund(orderId);
            await tx.wait()
            setRefunding(false)
            alert("You have been refunded")
        } catch (error) {
            setRefunding(false)
            alert(error.error.message)
            console.log(error.error.message)
        }
    }

    const calculateTimeRemaining = (deadlineTime) =>{
        try {
            const currentTime = Math.floor(Date.now()/1000);
            const secondsRemaining = deadlineTime - currentTime;
            var d = Math.floor(secondsRemaining / (3600*24));
            var h = Math.floor(secondsRemaining % (3600*24) / 3600);
            var m = Math.floor(secondsRemaining % 3600 / 60);
            var s = Math.floor(secondsRemaining % 60);
            
            return <span>{d} days, {h} hours, {m} minutes, {s} seconds </span>;
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className='container mt-5'>
            <h2 className='text-center'>Open Orders</h2>
            <div className="row">
            {orderListings?.map((eachListing, i) => {
            if(eachListing.completed == false){ return <div className="col-sm-6 mt-3" key={i+1}>
            <div className="card">
              <div className="card-body">
                {eachListing.receipient != ethers.constants.AddressZero && <p className="card-text"><b>Recepient:</b> {eachListing.receipient}</p>}
                <p className="card-text"><b>Amount:</b> {eachListing.amount/10**18} {chain.name == 'Goerli' ? `GoETH` : 'MATIC'} </p>
                {chain.name == 'Goerli' && <p className="card-text"><b>Price:</b> {eachListing.amountWanted/10**18} {chain.name == 'Goerli' ? `MATIC` : 'GoETH'}</p>}
                <p className="card-text"><b>Hash:</b> {eachListing.hash}</p>
                <p className="card-text"><b>Time Remaining:</b> {calculateTimeRemaining(eachListing.lockTime.toString())}</p>
                <p className="card-text text-muted">From(owner): {eachListing.owner}</p>
                {/* <p className="card-text"><b>Timenow:</b> {Math.floor((Date.now()/1000))}</p> */}
                {/* <div className="progress">
                    <div className="progress-bar" role="progressbar" aria-label="Basic example" style={{ "width": Math.floor((Date.now()/1000)) }} aria-valuenow={Math.floor((Date.now()/1000))} aria-valuemin="0" aria-valuemax={eachListing.lockTime.toString()}></div>
                </div> */}
                {eachListing.receipient == ethers.constants.AddressZero && eachListing.owner != address && <a onClick={() => confirmOrder(i+1)} className="btn btn-primary">{confirming ? <span><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
  <span>Confirming...</span></span>: <span>Confirm</span>}</a>}
                {eachListing.receipient == address && <div className="input-group mb-3">
                    <input type="text" className="form-control" placeholder="Secret" aria-label="Secret" aria-describedby="button-addon2" onChange={e => setSecret(e.target.value)}/>
                    <button className="btn btn-outline-danger" type="button" id="button-addon2" onClick={() => withdraw(i+1)}>{withdrawing ? <span><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
  <span>Withdrawing...</span></span> : <span>Withdraw</span>}</button>
                </div> }
                {eachListing.owner == address && <button className="btn btn-danger" type="button" onClick={() => refund(i+1)}>{refunding ? <span><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
  <span>Claiming Back...</span></span> : <span>Claim the Funds Back</span>}</button>}
              </div>
            </div>
          </div>
}})}
            </div>
        </div>
    )
}

export default Orders