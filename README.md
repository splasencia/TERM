This repo provides a testing environment for Solidity contracts on QANPlatform

**1. Clone the repo:**

```python
git clone https://github.com/splasencia/TERM.git
```

You should have the following folder structure:
```python
.
├── Dockerfile
├── app/
│   ├── index.js         # Main script
│   ├── package.json     # Dependencies for the app
|   ├──contracts/        # contracts folder inside the container
└── contracts/           # contracts folder exposed as volume
    ├── SimpleToken.sol  # Example Solidity contract
    └── address-book.yml # Automatically created after deployment
```

**2. Build the Doker image with:**

```python
sudo docker build -t soltest .
```

**3. Run the docker image with:**

```python
sudo docker run --rm -it -v $(pwd)/contracts:/contracts soltest
```

**4. Provide the deployer private key and choose option to deploy a contract**

```python
Welcome to the Solidity Contract Deployer!
? Choose wallet access: Raw HEX private key
? Enter raw HEX private key: ******************************************************************
Wallet address: 0xXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Avail. balance: 1.00000000000000 ETH
? What would you like to do? (Use arrow keys)
❯ Deploy contract 
  Interact with contract 
```

**5. Deploy a contract providing required constructor parameters**

```python
? What would you like to do? Deploy contract
Compiling contracts...
Compiling sample.sol...
? Choose contract to deploy: SampleToken
? Constructor value _name (string): SToken
? Constructor value _sym (string): STK
? Constructor value _dec (uint256): 18
? Constructor value _ts (uint256): 100000
Deploying contract...
Contract deployed at address: 0x8e021Fffb749861C7aDCa1ed9b36177E38489170
Saved SampleToken address to address-book.yml
You are now interacting with the contract at 0x8e021Fffb749861C7aDCa1ed9b36177E38489170
```

**6. Interact with the contract**

```python
? Choose an action: 
❯ Call a function 
  Send a transaction 
  Exit interaction menu
```

**7. Choose a function**

```python
? Choose a function to interact with:
  allowance
  balanceOf
  decimals
  name
  symbol
  totalSupply
  transfer
  approve
```
**8. Choose a function**

```python
? Choose a function to interact with: balanceOf
? Enter value for owner (address): 0x8e021Fffb749861C7aDCa1ed9b36177E38489170
```