import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying DocumentRegistry with account:', deployer.address);
  console.log('Account balance:', (await ethers.provider.getBalance(deployer.address)).toString());

  const DocumentRegistry = await ethers.getContractFactory('DocumentRegistry');
  const contract = await DocumentRegistry.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log('DocumentRegistry deployed to:', address);

  // Save address and ABI for the Next.js app
  const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'DocumentRegistry.sol', 'DocumentRegistry.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));

  const deploymentInfo = {
    address,
    network: 'polygon-amoy',
    chainId: 80002,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  const outputPath = path.join(__dirname, '..', 'deployment.json');
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('Deployment info saved to contracts/deployment.json');
  console.log('\nAdd this to your .env.local:');
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
