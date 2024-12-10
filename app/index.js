import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import yaml from "js-yaml";
import { ethers } from "ethers";

async function main() {
  console.log("Welcome to the Solidity Contract Deployer!");

  // Step 1: Ask for wallet access
  const { walletAccess, privateKey } = await inquirer.prompt([
    {
      type: "list",
      name: "walletAccess",
      message: "Choose wallet access:",
      choices: ["Raw HEX private key"],
    },
    {
      type: "password",
      name: "privateKey",
      message: "Enter raw HEX private key:",
      mask: '*', // Mask input with asterisks
    },
  ]);

  // Step 2: Initialize wallet and provider
  let wallet;
  try {
    wallet = new ethers.Wallet(privateKey);
  } catch (error) {
    console.error("Invalid private key!");
    process.exit(1);
  }
  const provider = ethers.getDefaultProvider("https://rpc-testnet-dev.qanplatform.com"); // Adjust provider URL as needed
  wallet = wallet.connect(provider);

  const balance = await wallet.getBalance();
  console.log(`Wallet address: ${wallet.address}`);
  console.log(`Avail. balance: ${ethers.utils.formatEther(balance)} ETH`);

  // Step 3: Main menu
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: ["Deploy contract", "Interact with contract"],
    },
  ]);

  if (action === "Deploy contract") {
    await deployContract(wallet);
  } else {
    console.log("Interaction feature not implemented yet!");
  }
}

async function deployContract(wallet) {
  console.log("Compiling contracts...");

  // Step 4: Compile Solidity files in the contracts directory
  const contractsPath = path.join("/contracts");
  const contractFiles = fs
    .readdirSync(contractsPath)
    .filter((file) => file.endsWith(".sol"));

  if (contractFiles.length === 0) {
    console.error("No Solidity files found!");
    return;
  }

  const compiledContracts = compileContracts(contractsPath, contractFiles);

  // Step 5: Prompt user to select a contract
  const { contractName } = await inquirer.prompt([
    {
      type: "list",
      name: "contractName",
      message: "Choose contract to deploy:",
      choices: Object.keys(compiledContracts),
    },
  ]);

  const contractData = compiledContracts[contractName];

  // Step 6: Ask for constructor parameters
  const constructorArgs = [];
  for (const input of contractData.abi.find(
    (item) => item.type === "constructor"
  )?.inputs || []) {
    const { value } = await inquirer.prompt([
      {
        type: "input",
        name: "value",
        message: `Constructor value ${input.name} (${input.type}):`,
      },
    ]);
    constructorArgs.push(value);
  }

  // Step 7: Deploy the contract
  console.log("Deploying contract...");
  const factory = new ethers.ContractFactory(
    contractData.abi,
    contractData.bytecode,
    wallet
  );

  try {
    const contract = await factory.deploy(...constructorArgs, {
      gasLimit: 8000000, // Set a manual gas limit
    });
    await contract.deployed();

    console.log(`Contract deployed at address: ${contract.address}`);

    // Step 8: Save the deployed contract address
    saveAddressToAddressBook(contractName, contract.address);

    // Step 9: Start interaction menu
    await interactWithContract(contract, contractData.abi, wallet);
  } catch (error) {
    console.error(`Failed to deploy contract: ${error.message}`);
  }
}

async function interactWithContract(contract, abi, wallet) {
  console.log(`You are now interacting with the contract at ${contract.address}`);

  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Choose an action:",
        choices: [
          "Call a function",
          "Send a transaction",
          "Exit interaction menu",
        ],
      },
    ]);

    if (action === "Exit interaction menu") {
      console.log("Exiting interaction menu...");
      break;
    }

    const functions = abi.filter(
      (item) => item.type === "function" && (action === "Call a function" ? item.stateMutability === "view" || item.stateMutability === "pure" : item.stateMutability === "nonpayable" || item.stateMutability === "payable")
    );

    const { functionName } = await inquirer.prompt([
      {
        type: "list",
        name: "functionName",
        message: "Choose a function to interact with:",
        choices: functions.map((func) => func.name),
      },
    ]);

    const selectedFunction = functions.find((func) => func.name === functionName);

    const args = [];
    for (const input of selectedFunction.inputs) {
      const { value } = await inquirer.prompt([
        {
          type: "input",
          name: "value",
          message: `Enter value for ${input.name} (${input.type}):`,
        },
      ]);
      args.push(value);
    }

    try {
      if (action === "Call a function") {
        // Read-only function call
        const result = await contract[functionName](...args);
        console.log(`Result: ${result}`);
      } else if (action === "Send a transaction") {
        // Send a transaction
        const tx = await contract[functionName](...args);
        await tx.wait();
        console.log(`Transaction successful! TX Hash: ${tx.hash}`);
      }
    } catch (error) {
      console.error(`Failed to interact with contract: ${error.message}`);
    }
  }
}




function compileContracts(contractsPath, contractFiles) {
  const compiledContracts = {};

  for (const file of contractFiles) {
    const filePath = path.join(contractsPath, file);
    console.log(`Compiling ${file}...`);

    try {
      // Run the solc command and capture output
      //const command = `solc --combined-json abi,bin ${filePath}`;
      const command = `solc --optimize --evm-version paris --combined-json abi,bin ${filePath}`;

      const output = execSync(command, { encoding: "utf8" });

      // Parse the JSON output from solc
      const jsonOutput = JSON.parse(output);

      // Debugging output: Inspect the parsed `contracts` field
      //console.log(`Parsed contracts for ${file}:\n${JSON.stringify(jsonOutput.contracts, null, 2)}`);

      // Ensure `contracts` field exists
      if (!jsonOutput.contracts) {
        throw new Error(`Unexpected solc output: 'contracts' field is missing.`);
      }

      // Process each contract in the JSON output
      for (const [key, value] of Object.entries(jsonOutput.contracts)) {
        const contractName = key.split(":")[1]; // Extract the contract name
        compiledContracts[contractName] = {
          abi: value.abi, // Use the ABI directly without JSON.parse
          bytecode: `0x${value.bin}`, // Add the 0x prefix to the bytecode
        };
      }
    } catch (error) {
      // Log errors for debugging
      console.error(`Failed to compile ${file}: ${error.message}`);
      if (error.stdout) {
        console.error(`solc stdout: ${error.stdout}`);
      }
      if (error.stderr) {
        console.error(`solc stderr: ${error.stderr}`);
      }
    }
  }

  // Ensure at least one contract was compiled
  if (Object.keys(compiledContracts).length === 0) {
    throw new Error("No contracts were compiled. Please check your Solidity files.");
  }

  return compiledContracts;
}




function saveAddressToAddressBook(contractName, contractAddress) {
  const addressBookPath = path.join("/contracts", "address-book.yml");
  let addressBook = {};

  // Load existing address book if it exists
  if (fs.existsSync(addressBookPath)) {
    addressBook = yaml.load(fs.readFileSync(addressBookPath, "utf8"));
  }

  // Add the new address
  addressBook[contractName] = contractAddress;

  // Save updated address book
  fs.writeFileSync(addressBookPath, yaml.dump(addressBook));
  console.log(`Saved ${contractName} address to address-book.yml`);
}

// Run the application
main().catch((error) => {
  console.error(error);
  process.exit(1);
});

