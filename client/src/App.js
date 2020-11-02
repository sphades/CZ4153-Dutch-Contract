import React, { Component } from "react";
import CypherpunkCoin from "./contracts/CypherpunkCoin.json";
import Auction from "./contracts/Auction.json";
import getWeb3 from "./getWeb3";
import 'fontsource-roboto';
import "./App.css";
import AppBar from '@material-ui/core/AppBar';
import { withStyles } from "@material-ui/core/styles";
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Toolbar from '@material-ui/core/Toolbar';
import clsx from 'clsx';
import RefreshIcon from '@material-ui/icons/Refresh';
import IconButton from '@material-ui/core/IconButton';
import { FormControl, Input, InputAdornment, Button, ButtonBase, TextField } from '@material-ui/core';
import pic from './images/Dutch-Auction-small.jpg'

const useStyles = theme => ({
  root: {
    display: 'flex',
  },
  // toolbar: {
  //   paddingRight: 24, // keep right padding when drawer closed
  // },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  appBar: {
    // zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  margin: {
    margin: theme.spacing(1),
  },
  withoutLabel: {
    marginTop: theme.spacing(3),
  },
  textField: {
    width: '25ch',
  },

  title: {
    flexGrow: 1,
  },

  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
    margins: 'auto'
  },
  fixedHeight: {
    height: 400,
  },
  image: {
    width: 480,
    height: 270,
  },
  img: {
    margin: 'auto',
    display: 'block',
    maxWidth: '100%',
    maxHeight: '100%',
  },
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: null, accounts: null, auctionContract: null, tokenContract: null, tokenPurchase: '', currentPrice: 'calculating...,' ,phase: '', currentCommitment: 0, endTime: 1200000, left: 'calculating...,', isPositive: false, demand: 'calculating...,', endTime: null
    };
  }
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
      this.setState({ web3, accounts, tokenContract });

      this.setState(await this.getAuctionContract());
      this.setState(await this.loadData());
      //setInterval(this.loadData, 3000); //every 3s check information from auction
      this.updateTime()
      let intervalId = setInterval(() => {
        this.updateTime();
        this.loadData()
        //this.listenToState(0);
      }, 1000);
      this.setState({ intervalId: intervalId })

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  async listenToState(fromBlockNumber) {
    const { auctionContract } = this.state;
    if (auctionContract != null) {
      console.log('Listening for State change');
      // auctionContract.events.allEvents({}, console.log())
      // auctionContract.events.changeState({
      //   fromBlock: (fromBlockNumber || 0),
      // }, this.stateListener);
      auctionContract.events.closeAndSendBackMoney({
        fromBlock: (fromBlockNumber || 0),
      }, this.moneyListener);
      // auctionContract.events.newCommit({
      //   fromBlock: (fromBlockNumber || 0),
      // }, this.commitListener);
    }
  }

  commitListener = async (err, contractEvent) => {
    const{prevNum}= this.state
    if (err) {
      console.error('commit listener error', err);
      return;
    }
    console.log('Heard commit!');
    const {
      event,
      returnValues,
      blockNumber,
    } = contractEvent;
    const {
      tEther
    } = returnValues;
    if (prevNum !== blockNumber){
      console.log(`${event}: Commit suceeded (block #${blockNumber}), ${tEther} transferred`)
      alert('Accepted transaction')
    this.setState({prevNum:blockNumber,})
    }
  }

  moneyListener = async (err, contractEvent) => {
    const{prevNum}= this.state
    if (err) {
      console.error('money listener error', err);
      return;
    }
    console.log('Heard money!');
    const {
      event,
      blockNumber,
    } = contractEvent;
    if (prevNum !== blockNumber){
    console.log(`${event}: Money changed (block #${blockNumber})`)
    alert('Rejected transaction')
    this.setState({prevNum:blockNumber,})
    }
  }
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
    switch (s) {
      case 0:
        phase = 'Created'; break;
      case 1:
        phase = 'Ongoing'; break;
      case 2:
        phase = 'Ended'; break;
      case 3:
        phase = 'Tokens Released'; break;
      // default:
      //   phase = 'default';
    }
    await this.setState({
      phase: phase
    });
  }

    
  loadData = async () => {
    try {
      const { auctionContract, accounts } = this.state;
      if (auctionContract != null) {
        const currentCommitment = await auctionContract.methods.getCommitments(accounts[0]).call();
        const s = Number(await auctionContract.methods.currState().call());
        
        var phase;
        switch (s) {
          case 0:
            phase = 'Created'; break;
          case 1:
            phase = 'Ongoing'; break;
          case 2:
            phase = 'Ended'; break;
          case 3:
            phase = 'Tokens Released'; break;
          default:
            phase = 'Auction has not started';
        }
        this.setState({
          currentCommitment: currentCommitment,
          phase: phase
        })
      }

    } catch (e) {
      console.log(e);
    }
  }

  runCommit = async () => {
    try {
      const { web3, accounts, auctionContract, tokenPurchase } = this.state;
      // call commit() somewhere here
      var blocknumber = Number(await web3.eth.getBlockNumber())+1;
      await auctionContract.methods.commit().send({ from: accounts[0], value: Math.pow(10, 18) * tokenPurchase }); //send in wei
      await auctionContract.events.closeAndSendBackMoney({
        fromBlock: (blocknumber),
      }, this.moneyListener);
      await auctionContract.events.newCommit({
        fromBlock: (blocknumber),
      }, this.commitListener);
    }
    catch (error) {
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
    this.setState(this.loadData);
  }

  handleContractDeploy = (event) => {
    event.preventDefault();
    this.setState(this.getAuctionContract)
  }
  handleTokenRelease = (event) => {
    const { auctionContract, accounts } = this.state;
    event.preventDefault();
    try {
      auctionContract.methods.releaseTokens().send({ from: accounts[0] });
      //alert("Token Released")
    } catch (error) {
      alert(
        `Failed to release token. Check console for details.`)
      console.error(error);
    }
  }

  getAuctionContract = async () => {
    const { tokenContract, web3, } = this.state;
    console.log("connecting to auction");
    try {
      const auctionAddress = await tokenContract.methods.auctionAddress().call();
      console.log(auctionAddress);
      const auction = new web3.eth.Contract(
        Auction.abi,
        auctionAddress
      );
      const startPrice = Number(await auction.methods.startPrice().call()); //what unit? microether
      const reservedPrice = Number(await auction.methods.reservedPrice().call()); //what unit? microether
      this.loadData();
      var startTime = Number(await auction.methods.startTime().call());
      var timeLimit = Number(await auction.methods.timeLimit().call());
      var endTime = timeLimit + startTime
      var priceDiff = (reservedPrice-startPrice)/timeLimit; 
      var totalEther = Number(await auction.methods.totalEther().call());
      var tokenSupply = Number(await auction.methods.tokenSupply().call());
      await this.listenToState(0)
      this.setState({ auctionContract: auction, endTime: endTime, priceDiff:priceDiff, startPrice:startPrice, timeLimit:timeLimit, totalEther:totalEther , tokenSupply:tokenSupply});
    } catch (error) {
      alert(
        `Failed to connect to auction. Check console for details.`,
      );
      console.error(error);
    }
  };

  getTimedeltaText(src_timedelta) {
    let timedelta_seconds_left = parseInt(src_timedelta / 1000, 10);
    if (timedelta_seconds_left < 0) {
      timedelta_seconds_left *= -1
    }
    const timeunits = [
      { name: "minute", name_plural: "minutes", seconds: 60 },
      { name: "second", name_plural: "seconds", seconds: 1 },
    ]
    let text = ""
    for (let timeunit of timeunits) {
      let units_count = parseInt(timedelta_seconds_left / timeunit.seconds, 10)
      if (units_count !== 0) {
        let timeunit_text = units_count === 1 ? timeunit.name : timeunit.name_plural
        text += units_count + " " + timeunit_text + " "
        timedelta_seconds_left -= units_count * timeunit.seconds
      }
    }
    return text
  }

  updateTime() {
    const {priceDiff, startPrice,endTime,timeLimit,totalEther} = this.state;
    let left = endTime * 1000 - new Date();
    let isPositive = left > 0
    if (this.state.isPositive && !isPositive && localStorage.getItem("webNotify") === "true") {
      this.webNotify()
    }
    
   
    let text = this.getTimedeltaText(left)
    console.log((left/1000))
    var currentPrice;
    if (text !== "") {
      if (isPositive) {
        text += " left"
         currentPrice = (timeLimit-left/1000)*priceDiff+startPrice; //y=(x1-x)*m+y0 
      } else {
        text += " since auction ended"
         currentPrice = (timeLimit)*priceDiff+startPrice; //(600*-0.15)+100
      }
    }
    var demand = (totalEther/Math.pow(10, 12))/currentPrice //total ether is in wei, currentprice is in microether?
    
    this.setState(
      {
        left: text,
        isPositive: isPositive,
        currentPrice: currentPrice,
        demand:demand
      }
    )
  }

  webNotify() {
    //let title = this.props.card.title
    Notification.requestPermission(function (result) { //change this to modal popup?
      if (result === "granted") {
        new Notification("Auction has expired!");
      }
    });
  }

  //demand = total ether/current price
  //current price graph


  render() {
    const { classes } = this.props;
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return ( //admin page to start contract: start price, reserve price text box

      <div className={classes.root}>
        <CssBaseline />
        <AppBar position="absolute" className={clsx(classes.appBar, classes.appBarShift)}>
          <Toolbar className={classes.toolbar}>
            <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
              Dutch Auction for Cypherpunk
          </Typography>
            <IconButton color="inherit" onClick={this.handleContractDeploy}>
              <RefreshIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <main className={classes.content}>
          <div className={classes.appBarSpacer} />
          <Container maxWidth="lg" className={classes.container}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8} lg={9}>
                <Paper className={classes.paper}>
                  <Grid container spacing={2}>
                    <Grid item>
                      <ButtonBase className={classes.image}>
                        <img className={classes.img} alt="complex" src={pic} />
                      </ButtonBase>
                    </Grid>
                    <Grid item xs={12} sm container>
                      <Grid item xs container direction="column" spacing={2}>
                        <Grid item xs>
                          <Typography component="h1" variant="h6" color="inherit" noWrap>
                            Time Remaining:
                    </Typography>
                    {/* //if (this.state.auctionContract) */}
                          <span className="lefttext">{this.state.left}</span>
                          <h3>Auction Phase: {this.state.phase}</h3>
                          <h3>Total Supply: {this.state.tokenSupply}</h3>
                          <h3>Estimated Current Price: {this.state.currentPrice} mEth</h3>
                          <h3>Current Demand: {this.state.demand} tokens</h3>
                          {/* <h3>Tokens Remaining: {this.state.tokenRemaining}</h3> */}

                          <form onSubmit={this.mySubmitHandler} autoComplete="off">
                            <FormControl className={clsx(classes.margin, classes.withoutLabel, classes.textField)}>
                              <TextField
                                required
                                margin='dense'
                                step={0.0000000001}
                                type='number'
                                onChange={event => this.setState({ tokenPurchase: event.target.value.replace(/\D/, '') })}
                                endAdornment={<InputAdornment position="end">ETH</InputAdornment>}
                              />
                              <Button
                              type="submit"
                              variant="contained"
                              color="primary"
                            >Submit</Button>
                            </FormControl>
                            
                          </form>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4} lg={3}>
                <Paper className={classes.paper}>
                  <h3>Your Current Commitment: {this.state.currentCommitment/Math.pow(10,12)} mEth</h3>
                  <h3>Current Token Allocation: {(this.state.currentCommitment/Math.pow(10,12))/ this.state.currentPrice} Cypherpunk tokens</h3>
                  <Button variant="contained"
                    color="primary" onClick={this.handleTokenRelease}>Release Tokens</Button>
                </Paper>
              </Grid>
            </Grid>

          </Container>
        </main>

        {/* <div>Total Cost: {this.state.tokenPurchase * this.state.currentPrice}</div> */}
      </div>
    );
  }
}

export default withStyles(useStyles)(App);
//max={this.state.tokenRemaining*this.state.currentPrice}
