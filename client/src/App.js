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
import { FormControl, Input, InputAdornment, Button } from '@material-ui/core';

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
    width: 128,
    height: 128,
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
      web3: null, accounts: null, auctionContract: null, tokenContract: null, tokenPurchase: 0, currentPrice: 0, phase: '', currentCommitment: 0, endTime: 1200000, left: "calculating...",
      isPositive: false
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

  listenToState(fromBlockNumber) {
    const { auctionContract } = this.state;
    if (auctionContract != null) {
      console.log('Listening for State change');
      auctionContract.events.changeState({
        fromBlock: (fromBlockNumber || 0),
      }, this.stateListener);
      auctionContract.events.closeAndSendBackMoney({
        fromBlock: (fromBlockNumber || 0),
      }, this.moneyListener);
      auctionContract.events.newCommit({
        fromBlock: (fromBlockNumber || 0),
      }, this.commitListener);
    }
  }

  commitListener = async (err, contractEvent) => {
    if (err) {
      console.error('commit listener error', err);
      return;
    }
    console.log('Heard commit!');
  }

  moneyListener = async (err, contractEvent) => {
    if (err) {
      console.error('money listener error', err);
      return;
    }
    console.log('Heard money!');

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
        const s  = Number(await auctionContract.methods.currState().call());
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
        phase = 'default';
    }
        this.setState({
          currentCommitment: currentCommitment,
          phase:phase
        })
      }

    } catch (e) {
      console.log(e);
    }
  }

  runCommit = async () => {
    try {
      const { accounts, auctionContract, tokenPurchase } = this.state;
      // call commit() somewhere here
      await auctionContract.methods.commit().send({ from: accounts[0], value: Math.pow(10, 18) * tokenPurchase });
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
    const { auctionContract,accounts } = this.state;
    event.preventDefault();
    try {
    auctionContract.methods.releaseTokens().send({from: accounts[0]});
    //alert("Token Released")
    }catch (error) {
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
      
      this.loadData();
      var startTime = Number(await auction.methods.startTime().call());
      var timeLimit = Number(await auction.methods.timeLimit().call());
      const startPrice = await auction.methods.startPrice().call();
      const reservedPrice = await auction.methods.reservedPrice().call();
      var endTime = timeLimit + startTime
      this.setState(this.listenToState(0))
      this.setState({ auctionContract: auction, endTime: endTime });
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
    let left = this.state.endTime * 1000 - new Date();
    let isPositive = left > 0
    if (this.state.isPositive && !isPositive && localStorage.getItem("webNotify") === "true") {
      this.webNotify()
    }

    let text = this.getTimedeltaText(left)
    if (text !== "") {
      if (isPositive) {
        text += " left"
      } else {
        text += " since expiration"
      }
    }

    this.setState(
      {
        left: text,
        isPositive: isPositive
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
    const fixedHeightPaper = clsx(classes.paper, classes.fixedHeight);
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
                <Paper className={fixedHeightPaper}>
                  <Typography component="h1" variant="h6" color="inherit" noWrap>
                    Time Remaining:
                    </Typography>
                  <span className="lefttext">{this.state.left}</span>
                  <h3>Auction Phase: {this.state.phase}</h3>
                  <h3>Estimated Current Price: {this.state.currentPrice}</h3>
                  {/* <h3>Tokens Remaining: {this.state.tokenRemaining}</h3> */}
                  
                  <form onSubmit={this.mySubmitHandler} autoComplete="off">
                    <FormControl className={clsx(classes.margin, classes.withoutLabel, classes.textField)}>
                      <Input

                        required
                        type='number'
                        onChange={event => this.setState({ tokenPurchase: event.target.value.replace(/\D/, '') })}
                        endAdornment={<InputAdornment position="end">ETH</InputAdornment>}
                      />
                    </FormControl>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                    >Submit</Button>
                  </form>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4} lg={3}>
              <Paper className={fixedHeightPaper}>
                <h3>Your Current Commitment: {this.state.currentCommitment} Wei</h3>
                <Button onClick={this.handleTokenRelease}>Release Tokens</Button>
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
