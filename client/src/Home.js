import React from 'react'
import { ethers } from 'ethers'
import { useNetwork } from 'wagmi';
import Goerli from './Goerli';
import Eth from './Eth';

const Home = ({contract}) => {
    const {chain} = useNetwork();
    
    return (
        <div className='container'>
            {chain.name == 'Goerli' && <Goerli contract={contract}/>}
            {/* TODO: CHANGE THIS */}
            {chain.name == 'Polygon Mumbai' && <Eth contract={contract}/>}
        </div>
    )
}

export default Home