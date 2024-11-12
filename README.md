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

**4. Interact with the menu**

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
