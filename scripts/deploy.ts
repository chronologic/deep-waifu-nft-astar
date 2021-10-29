// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import makePrompt from "prompt-sync";

const prompt = makePrompt();

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();

  const mintPrice = ethers.utils.parseEther("30");
  // const mintPrice = ethers.utils.parseEther("0.1");
  const beneficiary = signerAddress;
  const maxItems = 1000;

  const network = await ethers.provider.getNetwork();

  console.log("network:", network.name, network.chainId);
  console.log("signer:", signerAddress);
  console.log("beneficiary:", beneficiary);
  console.log("mint price:", ethers.utils.formatEther(mintPrice));
  console.log("max items:", maxItems);

  const userInput = prompt("Does the above look good? (Y/n): ", "Y");

  if (userInput !== "Y") {
    console.log("Stopping");
    return;
  }

  const balanceBefore = await ethers.provider.getBalance(signerAddress);

  const DeepWaifu = await ethers.getContractFactory("DeepWaifu");
  const deepWaifu = await DeepWaifu.deploy(mintPrice, beneficiary, maxItems);

  await deepWaifu.deployed();

  const balanceAfter = await ethers.provider.getBalance(signerAddress);

  console.log("DeepWaifu deployed to:", deepWaifu.address);
  console.log(
    "Deployment cost:",
    ethers.utils.formatEther(balanceBefore.sub(balanceAfter))
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
