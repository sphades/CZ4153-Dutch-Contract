import React, { Component } from "react";
import CypherpunkCoin from "./contracts/CypherpunkCoin.json"
import Auction from "./contracts/Auction.json"
import getWeb3 from "./getWeb3";
import "./App.css";
import Timer from 'react-compound-timer'

class App extends Component {
  state = { web3: null, accounts: null, auctionContract: null, tokenContract: null, tokenPurchase: 0, currentPrice: 0, phase: '', currentCommitment:0, timeRemaining:1200000};
  
  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const deployedNetwork = CypherpunkCoin.networks['5777'];
      var tokenContract = await new web3.eth.Contract(
        CypherpunkCoin.abi,
        deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, 
      this.setState({ web3, accounts, tokenContract});
      
      await this.getAuctionContract();
      await this.loadData();
      setInterval(this.loadData, 30000); //every 30s check information from auction
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };
  listenToState(fromBlockNumber) {
    const {auctionContract} = this.state;
    if (auctionContract != null){
    console.log('Listening for State change');
    auctionContract.events.changeState({
      fromBlock: (fromBlockNumber || 0),
    }, this.stateListener).on('data',this.stateListener);
  }}

   stateListener = async (err, contractEvent) => {
    if (err) {
      console.error('state listener error', err);
      return;
    }
    console.log('Heard something!');
    const {
      event,
      returnValues,
      blockNumber,
    } = contractEvent;
    const {
      s
    } = returnValues;
    console.log(`${event}: State changed to ${s} (block #${blockNumber})`)
    var phase;
    switch (s){
      case 0:  
        phase = 'Created'; break;
      case 1: 
        phase = 'ongoing'; break;
      case 2: 
        phase = 'Ended'; break;
      case 3: 
        phase = 'Tokens Released'; break;
      default:
        phase = 'Auction has not started';
    }
    await this.setState({
      phase:phase
    });
  }

  loadData = async() => {
    try {
      const {auctionContract,accounts,timeRemaining} = this.state;
      if (auctionContract != null){
       const currentCommitment = await auctionContract.methods.getCommitments(accounts[0]).call();
       this.setState({
        currentCommitment: currentCommitment,
       })
      }
      
   } catch (e) {
       console.log(e);
   }
 }

  runCommit = async () => {
    try{
      const { accounts, auctionContract, tokenPurchase} = this.state;
      // call commit() somewhere here
    await auctionContract.methods.commit().send({ from: accounts[0],value: Math.pow(10,18)*tokenPurchase});
    }
    catch (error){
      alert(error)
    }
  };

  handleChange(event) {
    const value = event.target.value.replace(/\+|-/ig, ''); //only allow numeric inputs
    this.setState({ tokenPurchase: value });
  }

  mySubmitHandler = (event) => {
    event.preventDefault();
    this.setState(this.runCommit);
  }

  handleContractDeploy = (event) =>{
    event.preventDefault();
    this.setState(this.getAuctionContract)
  }

  // handleStart = () => {
    
  // }

  getAuctionContract = async () => {  
    const { tokenContract,web3,  } = this.state;
    console.log("connecting to auction");
    try{
    const auctionAddress = await tokenContract.methods.auctionAddress().call();
    console.log(auctionAddress);
    const auction = new web3.eth.Contract(
      Auction.abi,
      auctionAddress
    );
    
    this.loadData();
    this.listenToState(0);
    var startTime = Number(await auction.methods.startTime().call());
    var timeLimit = Number(await auction.methods.timeLimit().call());
    const startPrice = await auction.methods.startPrice().call();
    const reservedPrice = await auction.methods.reservedPrice().call();
    var timeRemaining = (timeLimit+startTime)-Date.now()/1000;
    await this.listenToState(0);
    console.log(startTime);
    console.log(timeLimit);
    console.log(timeRemaining);
    this.setState({auctionContract:auction, timeRemaining:timeRemaining});
    }catch(error){
      alert(
        `Failed to connect to auction. Check console for details.`,
      );
      console.error(error);
    }
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return ( //admin page to start contract: start price, reserve price text box
      <div className="App">
        <h1>Dutch Auction for Cypherpunk</h1>
        <button onClick={this.handleContractDeploy}>Refresh</button>
        <Timer
          //start={this.handleStart}
          initialTime={this.state.timeRemaining} //20 mins
          direction="backward"
          startImmediately={false}
          lastUnit="m"
          //onStart={() => this.getAuctionContract}  //make some adjustments to this later
        >
          {(start,reset) => (
            <React.Fragment>
              
              <h1>
                Time Remaining:  <Timer.Minutes />:<Timer.Seconds />
              </h1>
            </React.Fragment>
          )}
        </Timer>
        <h2>Auction Phase: {this.state.phase}</h2>
        <h2>Estimated Current Price: {this.state.currentPrice}</h2>
        {/* <h3>Tokens Remaining: {this.state.tokenRemaining}</h3> */}
        <h3>Your Current Commitment: {this.state.currentCommitment}</h3>
        <form onSubmit={this.mySubmitHandler}>
          <input type='number' 
           onChange={event => this.setState({ tokenPurchase: event.target.value.replace(/\D/, '') })} />
          <input type='submit' />
        </form>
        <h3>Prices and Supply are updated every 30 seconds</h3>
        {/* <div>Total Cost: {this.state.tokenPurchase * this.state.currentPrice}</div> */}
      </div>
    );
  }
}

export default App;
//max={this.state.tokenRemaining*this.state.currentPrice}