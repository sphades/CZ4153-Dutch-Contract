import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json"; //import contract
import getWeb3 from "./getWeb3";
import 'fontsource-roboto';
import Button from '@material-ui/core/Button';
import "./App.css";
import Timer from 'react-compound-timer'

class App extends Component {
  state = { storageValue: 0, web3: null, accounts: null, contract: null, tokenPurchase: 0, currentPrice: 20, tokenRemaining: 100 };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleStorageContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  runCommit = async () => {
    const { accounts, contract } = this.state;
    // call commit() somewhere here

    //////////////////////////////////////////////// (sample code)
    // Stores a given value, 5 by default.
    await contract.methods.commit().send({ from: accounts[0],value: Math.pow(10,18)*this.state.tokenPurchase});

    // Get the value from the contract to prove it worked.
    const response = await contract.methods.get().call();

    // Update state with the result.
    this.setState({ storageValue: response });

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

  deployContract = () => {  //replace with contract deployment function
    const { contract, web3 } = this.state;
    const networkId = web3.eth.net.getId();
    const deployedNetwork = contract.networks[networkId];
    const instance = new web3.eth.Contract(
      contract.abi,
      deployedNetwork && deployedNetwork.address,
    );

    this.setState({ contract: instance });
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return ( //admin page to start contract: start price, reserve price text box
      <div className="App">
        <h1>Dutch Auction for Cypherpunk</h1>
        <Timer
          initialTime={1200000} //20 mins
          direction="backward"
          startImmediately={false}
          onStart={() => this.deployContract}  //make some adjustments to this later
        >
          {({ start, getTimerState, getTime }) => (
            <React.Fragment>
              <h1>
                Time Remaining:  <Timer.Minutes />:<Timer.Seconds />
              </h1>
              <div>
                <button onClick={start}>Start</button>
              </div>
            </React.Fragment>
          )}
        </Timer>
        <h2>Current Price: {this.state.currentPrice}</h2>
        <h3>Tokens Remaining: {this.state.tokenRemaining}</h3>
        <form onSubmit={this.mySubmitHandler}>
          <input type='number' max={this.state.tokenRemaining} onChange={event => this.setState({ tokenPurchase: event.target.value.replace(/\D/, '') })} />
          <input type='submit' />
        </form>
        <div>Total Cost: {this.state.tokenPurchase * this.state.currentPrice}</div>
      </div>
    );
  }
}

export default App;
