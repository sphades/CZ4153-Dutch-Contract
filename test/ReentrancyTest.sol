import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Reentrancy.sol";

contract ReentrancyTest{
    function testForReentrancy(){
        Reentrancy r = DeployedAddresses.Reentrancy();
        r.bid();
        Assert.equal(r.cpc.balanceof(address(r)), r.rightfulCYCAmt,  "Actual CypherpunkCoin balance exceeds rightful amount, re-retrancy test failed");
    }
}
