import "truffle/Assert.sol";
import "../contracts/Reentrancy.sol";

contract ReentrancyTest{
    function testForReentrancy(){
        Reentrancy r = Reentrancy();
        r.bid();
        Assert.equal(actualBalance, r.rightfulCYCAmt,  "Actual CypherpunkCoin balance exceeds rightful amount, re-retrancy test failed");
        //Currently no way to check CypherpunkCoin balance of an address, to request for feature.
    }
}
