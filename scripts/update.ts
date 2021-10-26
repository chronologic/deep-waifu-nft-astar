// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import makePrompt from "prompt-sync";

import deepWaifuAbi from "../artifacts/contracts/DeepWaifu.sol/DeepWaifu.json";
// eslint-disable-next-line node/no-missing-import
import { DeepWaifu } from "../typechain";

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

  const network = await ethers.provider.getNetwork();
  const contractAddress = "0x114a77E482d6B1b8730894E0BF8586a1aB2EE7D6";

  const contract = new ethers.Contract(
    contractAddress,
    deepWaifuAbi.abi,
    ethers.provider
  ) as DeepWaifu;

  await updatePrice();

  // /////////////

  async function updatePrice() {
    const mintPrice = ethers.utils.parseEther("30");

    console.log("network:", network.name, network.chainId);
    console.log("contract address:", contractAddress);
    console.log("signer:", signerAddress);
    console.log("mint price:", ethers.utils.formatEther(mintPrice));

    const userInput = prompt("Does the above look good? (Y/n): ", "Y");

    if (userInput !== "Y") {
      console.log("Stopping");
      return;
    }

    const res = await contract.connect(signer).setMintPrice(mintPrice);

    console.log("waiting for confirmations...");
    await ethers.provider.waitForTransaction(res.hash, 3);

    console.log("Updated mint price to:", ethers.utils.formatEther(mintPrice));
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
