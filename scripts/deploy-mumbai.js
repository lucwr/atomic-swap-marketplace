const hre = require("hardhat");

async function main() {

  const Contract = await hre.ethers.getContractFactory("PolygonHTLC");
  const contract = await Contract.deploy();

  await contract.deployed();

  console.log(
    `Deployed to ${contract.address} on the ${hre.network.name} network`
  );
  saveFrontendFiles(contract, "PolygonHTLC");
}

function saveFrontendFiles(contract, name) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../client/src/contractsData";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync(name);

  fs.writeFileSync(
    contractsDir + `/${name}.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
