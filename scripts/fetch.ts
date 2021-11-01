// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

import deepWaifuAbi from "../artifacts/contracts/DeepWaifu.sol/DeepWaifu.json";
// eslint-disable-next-line node/no-missing-import
import { DeepWaifu } from "../typechain";

async function main() {
  const network = await ethers.provider.getNetwork();
  // const contractAddress = "0x114a77E482d6B1b8730894E0BF8586a1aB2EE7D6";
  const contractAddress = "0x8d374696a0598f4DF7869d76687aa09407985ACA";

  const contract = new ethers.Contract(
    contractAddress,
    deepWaifuAbi.abi,
    ethers.provider
  ) as DeepWaifu;

  await fetchNfts();

  // /////////////

  async function fetchNfts() {
    console.log("network:", network.name, network.chainId);
    console.log("contract address:", contractAddress);

    const maxItems = await contract.maxItems();

    for (let i = 1; i <= maxItems; i++) {
      const url = await contract.tokenURI(i);

      if (url) {
        console.log(i, url);
      } else {
        break;
      }
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
