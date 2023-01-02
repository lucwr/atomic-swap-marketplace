import './App.css';
import Navbar from './Navbar';
import { Route, Routes } from 'react-router-dom';
import Home from './Home';
import Orders from './Orders';
import GoerliContract from './contractsData/GoerliHTLC.json'
import GoerliContractAddress from './contractsData/GoerliHTLC-address.json'
import PolygonContract from './contractsData/PolygonHTLC.json'
import PolygonContractAddress from './contractsData/PolygonHTLC-address.json'
import { useNetwork  } from 'wagmi'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react';

function App() {
  const [contract, setContract] = useState();
  const { chain } = useNetwork();

  useEffect(() => {
    loadContracts();
}, [chain])

const loadContracts = () =>{
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        console.log(chain.name);
        if(chain.name === 'Goerli'){
            let contract = new ethers.Contract(
                GoerliContractAddress.address,
                GoerliContract.abi,
                signer
            )
            setContract(contract)
            console.log("contracts loaded on",chain.name)
        } else if(chain.name === 'Polygon Mumbai'){
            let contract = new ethers.Contract(
                PolygonContractAddress.address,
                PolygonContract.abi,
                signer
            )
            setContract(contract)
            console.log("contracts loaded on",chain.name)
        } else{
            alert("Unsupported Network")
        }
    } catch (error) {
        console.log(error)
    }
}

  return (
    <div>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home contract={contract}/>}></Route>
        <Route path='/orders' element={<Orders contract={contract}/>}></Route>
      </Routes>
    </div>
  );
}

export default App;
