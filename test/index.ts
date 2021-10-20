/* eslint-disable node/no-extraneous-import */
import { BigNumberish } from "@ethersproject/bignumber";
import { expect } from "chai";
import { ethers } from "hardhat";

// eslint-disable-next-line node/no-missing-import
import { DeepWaifu } from "../typechain";

describe("DeepWaifu", async () => {
  const wallet = ethers.Wallet.createRandom();
  const defaultBeneficiary = await wallet.getAddress();

  it("deploys contract and sets params", async () => {
    const { deepWaifu, beneficiary, mintPrice, maxItems } =
      await deployContract();

    expect((await deepWaifu.mintPrice()).toNumber()).to.equal(mintPrice);
    expect(await deepWaifu.beneficiary()).to.equal(beneficiary);
    expect(await deepWaifu.maxItems()).to.equal(maxItems);
    expect((await deepWaifu.currentId()).toNumber()).to.equal(0);
  });

  it("updates beneficiary", async () => {
    const { deepWaifu } = await deployContract();

    const newBeneficiaryWallet = ethers.Wallet.createRandom();
    const newBeneficiary = await newBeneficiaryWallet.getAddress();

    const setBeneficiaryTx = await deepWaifu.setBeneficiary(newBeneficiary);

    await setBeneficiaryTx.wait();

    // const tx = await ethers.provider.getTransaction(setBeneficiaryTx.hash);

    expect(await deepWaifu.beneficiary()).to.equal(newBeneficiary);
  });

  it("updates mint price", async () => {
    const { deepWaifu } = await deployContract();

    const newMintPrice = 333_444_555;

    const setMintPriceTx = await deepWaifu.setMintPrice(newMintPrice);

    await setMintPriceTx.wait();

    // const tx = await ethers.provider.getTransaction(setBeneficiaryTx.hash);

    expect((await deepWaifu.mintPrice()).toNumber()).to.equal(newMintPrice);
  });

  it("does not allow non owner to update beneficiary", async () => {
    const { deepWaifu } = await deployContract();
    // eslint-disable-next-line no-unused-vars
    const [_, other] = await ethers.getSigners();

    const newBeneficiaryWallet = ethers.Wallet.createRandom();
    const newBeneficiary = await newBeneficiaryWallet.getAddress();

    let errorMsg = "";

    try {
      const setBeneficiaryTx = await deepWaifu
        .connect(other)
        .setBeneficiary(newBeneficiary);

      await setBeneficiaryTx.wait();
    } catch (e) {
      errorMsg = (e as any).message;
    }

    expect(errorMsg).to.contain("Ownable: caller is not the owner");
  });

  it("does not allow non owner to update mint price", async () => {
    const { deepWaifu } = await deployContract();
    // eslint-disable-next-line no-unused-vars
    const [_, other] = await ethers.getSigners();

    const newPrice = 222;

    let errorMsg = "";

    try {
      const setMintPriceTx = await deepWaifu
        .connect(other)
        .setMintPrice(newPrice);

      await setMintPriceTx.wait();
    } catch (e) {
      errorMsg = (e as any).message;
    }

    expect(errorMsg).to.contain("Ownable: caller is not the owner");
  });

  it("accepts payments for mint", async () => {
    const { deepWaifu, mintPrice } = await deployContract();

    // eslint-disable-next-line no-unused-vars
    const [_, other] = await ethers.getSigners();

    const payForMintTx = await deepWaifu.connect(other).payForMint({
      value: mintPrice,
    });

    await payForMintTx.wait();

    const rec = await ethers.provider.getTransactionReceipt(payForMintTx.hash);

    expect(rec.status).to.equal(1);
  });

  it("emits PaidForMint event", async () => {
    const { deepWaifu, mintPrice } = await deployContract();

    // eslint-disable-next-line no-unused-vars
    const [_, other] = await ethers.getSigners();
    const signerAddress = await other.getAddress();

    const payForMintTx = await deepWaifu.connect(other).payForMint({
      value: mintPrice,
    });

    await payForMintTx.wait();

    const rec = await ethers.provider.getTransactionReceipt(payForMintTx.hash);

    expect(rec.logs.length).to.equal(1);

    rec.logs.forEach((log) => {
      const { name, args } = deepWaifu.interface.parseLog(log);
      expect(name).to.equal("PaidForMint");

      const [from, amount, id] = args;

      expect(from).to.equal(signerAddress);
      expect(amount.toNumber()).to.equal(mintPrice);
      expect(id).to.equal(1);
    });
  });

  it("does not allow minting when all items are sold out", async () => {
    const maxItems = 3;

    const { deepWaifu, mintPrice } = await deployContract({ maxItems });

    // eslint-disable-next-line no-unused-vars
    const [_, other] = await ethers.getSigners();

    // buy up all items
    for (let i = 0; i < maxItems; i++) {
      const payForMintTx = await deepWaifu.connect(other).payForMint({
        value: mintPrice,
      });
      await payForMintTx.wait();
    }

    // try to pay for mint now
    let errorMsg = "";
    try {
      const soldOutTx = await deepWaifu.connect(other).payForMint({
        value: mintPrice,
      });

      await soldOutTx.wait();
    } catch (e) {
      errorMsg = (e as any).message;
    }

    expect(errorMsg).to.include("Sold out!");
  });

  async function deployContract({
    beneficiary = defaultBeneficiary,
    mintPrice = 123456,
    maxItems = 10,
  }: {
    beneficiary?: string;
    mintPrice?: BigNumberish;
    maxItems?: BigNumberish;
  } = {}): Promise<{
    deepWaifu: DeepWaifu;
    beneficiary: string;
    mintPrice: BigNumberish;
    maxItems: BigNumberish;
  }> {
    const DeepWaifu = await ethers.getContractFactory("DeepWaifu");

    const deepWaifu = await DeepWaifu.deploy(mintPrice, beneficiary, maxItems);
    await deepWaifu.deployed();

    return { deepWaifu, beneficiary, mintPrice, maxItems };
  }
});
