//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract DeepWaifu is ERC721URIStorage, Ownable {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  event PaidForMint(address _from, uint256 _amount, uint16 _id);

  uint256 public mintPrice;
  address payable public beneficiary;
  uint16 public maxItems;

  constructor(
    uint256 _mintPrice,
    address payable _beneficiary,
    uint16 _maxItems
  ) ERC721("DeepWaifu", "DW") {
    mintPrice = _mintPrice;
    beneficiary = _beneficiary;
    maxItems = _maxItems;
  }

  function setBeneficiary(address payable _beneficiary) public onlyOwner {
    beneficiary = _beneficiary;
  }

  function setMintPrice(uint256 _mintPrice) public onlyOwner {
    mintPrice = _mintPrice;
  }

  function payForMint() public payable {
    require(_tokenIds.current() < maxItems, "Sold out!");

    _tokenIds.increment();

    beneficiary.transfer(mintPrice);

    emit PaidForMint(msg.sender, mintPrice, uint16(_tokenIds.current()));
  }

  function mintNFT(
    address recipient,
    uint16 id,
    string memory tokenURI
  ) public onlyOwner returns (uint256) {
    require(_tokenIds.current() < maxItems, "Sold out!");

    _mint(recipient, id);
    _setTokenURI(id, tokenURI);

    return id;
  }

  function currentId() public view returns (uint256) {
    return _tokenIds.current();
  }
}
