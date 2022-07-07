import { ethers } from "ethers";
import abi from "./utils/WavePortal.json";
import React, { useEffect, useState } from "react";
import wavePortal from './utils/WavePortal.json';
import "./App.css";

const App = () => {
  const contractABI = abi.abi;
  const [showModal, setShowModal] = useState(false);
  const [count, setCount] = useState(null);
  const [mining, setMining] = useState(false);
  const [message, setMessage] = useState("");
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const contractAddress = "0x4a400F42d9F94f56f4Da0cb81e614C368CC93dBE";


   
  const handleClose = () => {
    window.location.reload(false);
  }
  
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

    /**
     * Implement your connectWallet method here
     */
    const connectWallet = async () => {
        try {
            const { ethereum } = window;

            if (!ethereum) {
                alert("Get MetaMask!");
                return;
            }

            const accounts = await ethereum.request({ method: "eth_requestAccounts" });

            console.log("Connected", accounts[0]);
            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.log(error);
        }
    }

  const displayCount = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setCount(count.toNumber());
      }
    } catch (error) {
      console.log(error)
    }
  }
  

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        console.log("message", message);
        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 })
        setMining(true);
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        setCount(count.toNumber());
        setMining(false);
        console.log("Retrieved total wave count...", count.toNumber());

        const waves = await wavePortalContract.getAllWaves();
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });
        wavesCleaned.reverse();
        console.log('wavesCleaned', wavesCleaned);
        setAllWaves(wavesCleaned);

        setMessage("");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
      setShowModal(true)
    }
  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();
        

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        /*
         * Store our data in React State
         */
        console.log('wavesCleaned', wavesCleaned);
        wavesCleaned.reverse();
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    displayCount();

    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log('*** NewWave', from, timestamp, message);
      displayCount();
      getAllWaves();
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on('NewWave', onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    };

    
  }, [])

  
  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <div className="count"> 
            Hi! Tusheeeet here <br></br>
            {!count &&
              <span role="img" aria-label="wave">👋</span>
            }
            {count &&
              <> I've recieved {count}  waves <span role="img" aria-label="wave">👋</span>  so far!!!</>
            }
          </div>
        </div>

        <div className="bio">
          I've build this awesome dApp. 
          <br></br> Connect your Ethereum wallet (make sure you're on the Rinkeby test network).  
          <br></br> 
          <br></br> 
          Craft a message, and wave at me!
          <br></br> 
          <br></br>
          <br></br>
        </div>



        {currentAccount && (
        <>
          <input onChange={e => setMessage(e.target.value)} value={message} disabled={mining} className="form-control form-control-lg" type="text" placeholder="Message" name="message" autoComplete="off"></input>

          <button className="waveButton" onClick={wave} disabled={mining}>
            {!mining && `Wave at Me`}
            {mining && ` ⏳ Mining ⏳...`}
          </button>


          <div className="allWaves">
            {allWaves.map((wave, index) => {
              return (
                <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
                  <div>Message: {wave.message}</div>
                  <div>Time: {wave.timestamp.toString()}</div>
                  <div className="address">Address: {wave.address}</div>
                </div>)
            })}
          </div>
        </>
        )}
        

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

      </div>
      
    </div>
  );

}

export default App