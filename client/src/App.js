import React, { Component } from "react";
import CypherpunkCoin from "./contracts/CypherpunkCoin.json"
import Auction from "./contracts/Auction.json"
import getWeb3 from "./getWeb3";
import "./App.css";
import Timer from 'react-compound-timer'

class App extends Component {
  state = { web3: null, accounts: null, auctionContract: null, tokenContract: null, tokenPurchase: 0, currentPrice: 0, phase: 'Auction has not started', currentCommitment:0, timeRemaining:0 };
  
  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      //console.log(web3.givenProvider);
      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      //console.log(accounts);
      // Get the contract instance.
      const deployedNetwork = CypherpunkCoin.networks['5777'];
      //console.log(deployedNetwork.address);
      var tokenContract = await new web3.eth.Contract(
        CypherpunkCoin.abi,
        deployedNetwork.address,
      );

      console.log(tokenContract);
      tokenContract.methods.AUCTION_CREATOR_ROLE().call().then(console.log)
      
      // await tokenContract.methods.createAuction(300,100,200).send({from:accounts[0]});
      // Set web3, accounts, and contract to the state, 
      
      this.setState({ web3, accounts, tokenContract});
      this.deployContract();
      this.loadData();
      setInterval(this.loadData, 3000); //every 30s check information from auction
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  loadData = async() => {
    try {
      const {auctionContract,accounts,timeRemaining} = this.state;
      if (auctionContract != null){
       //const currentPrice = await auctionContract.methods.;
       //const state = await auctionContract.methods.State().call().call();
       //const startPrice = await auctionContract.methods.startPrice().call();
       //const reservedPrice = await auctionContract.methods.reservedPrice().call();
       const currentCommitment = await auctionContract.methods.getCommitments(accounts[0]).call();
      //  console.log(startTime)
      //  console.log(Date.now()/1000)
       
      //  const currentPrice = startPrice - ((startPrice-reservedPrice)/(Date.now()/1000-startTime))
       
       
       //const state = await auctionContract.methods.tokenSupply().call().call();
       var phase;
       if (timeRemaining<0){
         phase='Ended'
       }
       else if (timeRemaining>0){
         phase='Ongoing'
       }

       this.setState({
        //currentPrice: currentPrice,
        currentCommitment: currentCommitment,
        phase: phase, //to be updated
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
    await auctionContract.methods.commit().send({ from: accounts[0],value: Math.pow(10,18)*this.state.tokenPurchase});
    }
    catch (error){
      alert(error)
    }

    //////////////////////////////////////////////// (sample code)
    // Stores a given value, 5 by default.
    // await contract.methods.commit().send({ from: accounts[0],value: Math.pow(10,18)*this.state.tokenPurchase});

    // Get the value from the contract to prove it worked.
    //const response = await contract.methods.get().call();

    // Update state with the result.
    //this.setState({ storageValue: response });

    /////////////////////////////////////////////////
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
    this.setState(this.deployContract)
  }

  deployContract = async () => {  //replace with contract deployment function
    
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
    var startTime = Number(await auction.methods.startTime().call());
    var timeLimit = Number(await auction.methods.timeLimit().call());
    const startPrice = await auction.methods.startPrice().call();
    const reservedPrice = await auction.methods.reservedPrice().call();
    var timeRemaining = (timeLimit+startTime)-Date.now()/1000;
    
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
        <Timer
          initialTime={this.state.timeRemaining} //20 mins
          direction="backward"
          startImmediately={true}
          //onStart={() => this.deployContract}  //make some adjustments to this later
        >
          {({ start, getTime }) => (
            <React.Fragment>
              <h1>
                Time Remaining:  <Timer.Minutes />:<Timer.Seconds />
              </h1>
              <div>
                <button onClick={this.handleContractDeploy}>Refresh</button>
              </div>
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