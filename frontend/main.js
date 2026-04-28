import {
  isConnected,
  requestAccess,
  signTransaction,
} from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';

const CONTRACT_ID = 'CA42QQ62UQSW3LY7FZ4ZSIXPW4IJX7J5RBW6UZHOMX7YBWPID5LPTR5T';
const TOKEN_ADDRESS = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'; // Testnet XLM
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
const rpcUrl = 'https://soroban-testnet.stellar.org';
const server = new StellarSdk.rpc.Server(rpcUrl, { allowHttp: true });

let userPublicKey = '';

// --- DOM ELEMENTS ---
const connectBtn = document.getElementById('connectBtn');
const connectBtnText = document.getElementById('connectBtnText');
const walletBanner = document.getElementById('walletBanner');

const depositBtn = document.getElementById('depositBtn');
const withdrawBtn = document.getElementById('withdrawBtn');

const depositStatus = document.getElementById('depositStatus');
const withdrawStatus = document.getElementById('withdrawStatus');
const historyList = document.getElementById('historyList');

const walletAddressDisplay = document.getElementById('walletAddressDisplay');
const amountInput = document.getElementById('amountInput');
const unlockDateTimePicker = document.getElementById('unlockDateTimePicker');
const durationSecondsInput = document.getElementById('durationSecondsInput');
const durationError = document.getElementById('durationError');
const quickLockSlider = document.getElementById('quickLockSlider');
const quickLockValue = document.getElementById('quickLockValue');
const lockedUntilDate = document.getElementById('lockedUntilDate');

// --- TABS LOGIC ---
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class from all
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // Add active to clicked
    btn.classList.add('active');
    const targetId = btn.getAttribute('data-tab') + 'Tab';
    document.getElementById(targetId).classList.add('active');
  });
});

// Initialize datetime picker with 0
let currentSelectedUnix = 0;

function updateDateDisplay(unixTimestamp) {
  if (unixTimestamp === 0) {
    lockedUntilDate.textContent = '--';
    return;
  }
  const date = new Date(unixTimestamp * 1000);
  const options = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true };
  lockedUntilDate.textContent = date.toLocaleString('en-US', options);
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds} seconds`;
  const m = Math.floor(seconds / 60) % 60;
  const h = Math.floor(seconds / 3600) % 24;
  const d = Math.floor(seconds / 86400);

  let parts = [];
  if (d > 0) parts.push(`${d} day${d !== 1 ? 's' : ''}`);
  if (h > 0) parts.push(`${h} hour${h !== 1 ? 's' : ''}`);
  if (m > 0) parts.push(`${m} minute${m !== 1 ? 's' : ''}`);
  
  return parts.join(' ') || '0 minutes';
}

function syncSliderToDate() {
  const seconds = parseInt(quickLockSlider.value) || 0;
  quickLockValue.textContent = formatDuration(seconds);
  
  if (document.activeElement !== durationSecondsInput) {
    durationSecondsInput.value = seconds;
    durationSecondsInput.style.borderColor = '';
    durationError.style.display = 'none';
  }
  
  const currentUnix = Math.floor(Date.now() / 1000);
  currentSelectedUnix = currentUnix + seconds;
  
  const targetDate = new Date(currentSelectedUnix * 1000);
  const tzOffset = targetDate.getTimezoneOffset() * 60000;
  const localIso = new Date(targetDate.getTime() - tzOffset).toISOString().slice(0, 16);
  unlockDateTimePicker.value = localIso;
  
  updateDateDisplay(currentSelectedUnix);
}

function syncDateToSlider() {
  const val = unlockDateTimePicker.value;
  if (!val) return;
  const targetDate = new Date(val);
  const currentUnix = Math.floor(Date.now() / 1000);
  let selectedUnix = Math.floor(targetDate.getTime() / 1000);
  
  let diffSeconds = selectedUnix - currentUnix;
  
  if (diffSeconds < 1) diffSeconds = 1;
  if (diffSeconds > 31536000) diffSeconds = 31536000;
  
  currentSelectedUnix = currentUnix + diffSeconds;
  
  const adjustedTargetDate = new Date(currentSelectedUnix * 1000);
  const tzOffset = adjustedTargetDate.getTimezoneOffset() * 60000;
  const localIso = new Date(adjustedTargetDate.getTime() - tzOffset).toISOString().slice(0, 16);
  if (unlockDateTimePicker.value !== localIso) {
    unlockDateTimePicker.value = localIso;
  }
  
  quickLockSlider.value = diffSeconds;
  quickLockValue.textContent = formatDuration(diffSeconds);
  
  durationSecondsInput.value = diffSeconds;
  durationSecondsInput.style.borderColor = '';
  durationError.style.display = 'none';
  
  updateDateDisplay(currentSelectedUnix);
}

function syncInputToOthers() {
  const valInfo = durationSecondsInput.value;
  if (valInfo === '') {
     durationSecondsInput.style.borderColor = 'red';
     durationError.style.display = 'block';
     return;
  }
  const seconds = parseInt(valInfo);
  if (isNaN(seconds) || seconds < 1 || seconds > 31536000) {
    durationSecondsInput.style.borderColor = 'red';
    durationError.style.display = 'block';
    return;
  }
  
  durationSecondsInput.style.borderColor = '';
  durationError.style.display = 'none';
  quickLockSlider.value = seconds;
  
  syncSliderToDate();
}

quickLockSlider.addEventListener('input', syncSliderToDate);
unlockDateTimePicker.addEventListener('change', syncDateToSlider);
durationSecondsInput.addEventListener('input', syncInputToOthers);

quickLockSlider.value = 1;
syncSliderToDate();
// ensure the input starts properly synced since activeElement check might skip it
durationSecondsInput.value = 1;

// --- HELPER FUNCTIONS ---
function setStatus(element, msg, type = 'loading') {
  element.textContent = msg;
  element.className = `status-message ${type}`;
}

function renderHistory() {
  if (!userPublicKey) {
    if (historyList) historyList.innerHTML = '<p class="info-text">Connect your wallet to view history.</p>';
    return;
  }
  const history = JSON.parse(localStorage.getItem('vaultHistory_' + userPublicKey) || '[]');
  if (history.length === 0) {
    if (historyList) historyList.innerHTML = '<p class="info-text">No history found for this wallet.</p>';
    return;
  }
  
  if (historyList) historyList.innerHTML = '';
  history.slice().reverse().forEach((item) => {
    const el = document.createElement('div');
    el.className = 'history-item';
    
    const dateStr = new Date(item.timestamp * 1000).toLocaleString();
    let typeClass = item.type === 'Deposit' ? 'history-type-deposit' : 'history-type-withdraw';
    
    let timerHtml = '';
    if (item.type === 'Deposit' && item.unlockTime) {
      const isWithdrawn = history.some(h => h.type === 'Withdraw' && h.timestamp > item.timestamp);
      if (isWithdrawn) {
        timerHtml = `<div style="font-size: 0.9rem; margin-top: 4px;">Status: <span style="color: #34d399; font-weight: bold;">Withdrawn</span></div>`;
      } else {
        timerHtml = `<div style="font-size: 0.9rem; margin-top: 4px;">Status: <span class="timer-countdown" data-unlock="${item.unlockTime}">Calculating...</span></div>`;
      }
    }
    
    el.innerHTML = `
      <div class="history-item-header">
        <span class="${typeClass}">${item.type}</span>
        <span>${item.amount ? item.amount + ' XLM' : ''}</span>
      </div>
      <div style="font-size: 0.85rem; color: #666;">Date: ${dateStr}</div>
      ${timerHtml}
    `;
    if (historyList) historyList.appendChild(el);
  });
}

setInterval(() => {
  const timers = document.querySelectorAll('.timer-countdown');
  const now = Math.floor(Date.now() / 1000);
  timers.forEach(t => {
    const unlockTime = parseInt(t.getAttribute('data-unlock'));
    const diff = unlockTime - now;
    if (diff > 0) {
      const d = Math.floor(diff / 86400);
      const h = Math.floor((diff % 86400) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      let timeStr = '';
      if (d > 0) timeStr += `${d}d `;
      if (h > 0 || d > 0) timeStr += `${h}h `;
      timeStr += `${m}m ${s}s`;
      
      t.textContent = `Locked (${timeStr})`;
      t.className = 'timer-countdown timer-active';
    } else {
      t.textContent = 'Unlocked & Ready';
      t.className = 'timer-countdown timer-ready';
    }
  });
}, 1000);

// --- WALLET CONNECTION ---
async function connectWallet() {
  try {
    connectBtnText.textContent = 'Connecting...';
    const connectedStatus = await isConnected();
    
    const hasFreighter = connectedStatus === true || (connectedStatus && connectedStatus.isConnected === true);
    
    if (hasFreighter) {
      const access = await requestAccess();
      let pubKey = null;
      if (typeof access === 'string') {
        pubKey = access;
      } else if (access && access.address) {
        pubKey = access.address;
      } else if (access && access.publicKey) {
        pubKey = access.publicKey;
      }
      
      if (pubKey) {
        userPublicKey = pubKey;
        const shortAddress = `${userPublicKey.substring(0, 5)}...${userPublicKey.substring(userPublicKey.length - 4)}`;
        connectBtnText.textContent = shortAddress;
        walletBanner.innerHTML = `<div class="banner-icon">✅</div><p>Wallet connected! Ready to interact with the Vault.</p>`;
        walletAddressDisplay.value = userPublicKey;
        renderHistory();
      } else {
        connectBtnText.textContent = 'Connect Freighter';
        alert('Failed to get public key.');
      }
    } else {
      alert('Freighter extension not found. Please install it.');
      connectBtnText.textContent = 'Connect Freighter';
    }
  } catch (error) {
    console.error("Connection error:", error);
    connectBtnText.textContent = 'Connect Freighter';
    alert(`Connection error: ${error.message}`);
  }
}

connectBtn.addEventListener('click', connectWallet);

// --- TRANSACTION SUBMISSION ---
async function submitTransaction(tx, submitter, statusElem) {
  try {
    const signResult = await signTransaction(tx.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE });
    if (signResult.error) throw new Error(signResult.error);
    const transactionToSubmit = StellarSdk.TransactionBuilder.fromXDR(signResult.signedTxXdr, NETWORK_PASSPHRASE);
    
    setStatus(statusElem, 'Sending transaction to network...', 'loading');
    const sendResponse = await server.sendTransaction(transactionToSubmit);
    
    if (sendResponse.errorResultXdr) {
      throw new Error('Transaction failed on network.');
    }

    setStatus(statusElem, 'Waiting for network confirmation...', 'loading');
    
    let txResponse;
    let retries = 0;
    while (retries < 15) {
      txResponse = await server.getTransaction(sendResponse.hash);
      if (txResponse.status !== 'NOT_FOUND') {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      retries++;
    }

    if (txResponse.status === 'SUCCESS') {
      setStatus(statusElem, 'Transaction Successful!', 'success');
      return true;
    } else {
      setStatus(statusElem, `Transaction Failed: ${txResponse.status}`, 'error');
      return false;
    }
  } catch (e) {
    console.error(e);
    setStatus(statusElem, `Error: ${e.message}`, 'error');
    return false;
  }
}

// --- DEPOSIT ---
depositBtn.addEventListener('click', async () => {
  if (!userPublicKey) {
    setStatus(depositStatus, 'Please connect your wallet first.', 'error');
    return;
  }
  const amt = amountInput.value.trim();
  if (!amt) {
    setStatus(depositStatus, 'Please enter an amount.', 'error');
    return;
  }
  
  const amtNum = parseFloat(amt);
  if (isNaN(amtNum) || amtNum <= 0) {
    setStatus(depositStatus, 'Please enter a valid positive amount.', 'error');
    return;
  }

  if (currentSelectedUnix <= Math.floor(Date.now() / 1000)) {
    setStatus(depositStatus, 'Unlock time must be in the future.', 'error');
    return;
  }

  const inputSeconds = parseInt(durationSecondsInput.value);
  if (isNaN(inputSeconds) || inputSeconds < 1 || inputSeconds > 31536000) {
    setStatus(depositStatus, 'Lock duration must be between 1 and 31,536,000 seconds.', 'error');
    return;
  }

  try {
    setStatus(depositStatus, 'Preparing deposit transaction...', 'loading');
    const sourceAccountInfo = await server.getAccount(userPublicKey);
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    
    const userScVal = new StellarSdk.Address(userPublicKey).toScVal();
    const tokenScVal = new StellarSdk.Address(TOKEN_ADDRESS).toScVal();
    const stroops = Math.floor(amtNum * 10000000);
    const amountScVal = StellarSdk.nativeToScVal(BigInt(stroops), { type: 'i128' });
    const unlockTimeScVal = StellarSdk.nativeToScVal(BigInt(currentSelectedUnix), { type: 'u64' });

    const operation = contract.call("deposit", userScVal, tokenScVal, amountScVal, unlockTimeScVal);

    const tx = new StellarSdk.TransactionBuilder(sourceAccountInfo, { 
      fee: '150000', 
      networkPassphrase: NETWORK_PASSPHRASE 
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);
    const success = await submitTransaction(preparedTx, userPublicKey, depositStatus);
    if (success) {
      const history = JSON.parse(localStorage.getItem('vaultHistory_' + userPublicKey) || '[]');
      history.push({
         type: 'Deposit',
         amount: amt,
         unlockTime: currentSelectedUnix,
         timestamp: Math.floor(Date.now() / 1000)
      });
      localStorage.setItem('vaultHistory_' + userPublicKey, JSON.stringify(history));
      renderHistory();
    }
  } catch (error) {
    console.error(error);
    if (error.message && error.message.includes("UnreachableCodeReached")) {
      setStatus(depositStatus, `Contract panicked! Check if you already have a deposit.`, 'error');
    } else {
      setStatus(depositStatus, `Deposit error: ${error.message}`, 'error');
    }
  }
});

// --- WITHDRAW ---
withdrawBtn.addEventListener('click', async () => {
  if (!userPublicKey) {
    setStatus(withdrawStatus, 'Please connect your wallet first.', 'error');
    return;
  }

  try {
    setStatus(withdrawStatus, 'Preparing withdraw transaction...', 'loading');
    const sourceAccountInfo = await server.getAccount(userPublicKey);
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    
    const userScVal = new StellarSdk.Address(userPublicKey).toScVal();
    const operation = contract.call("withdraw", userScVal);

    const tx = new StellarSdk.TransactionBuilder(sourceAccountInfo, { 
      fee: '150000', 
      networkPassphrase: NETWORK_PASSPHRASE 
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const preparedTx = await server.prepareTransaction(tx);
    const success = await submitTransaction(preparedTx, userPublicKey, withdrawStatus);
    if (success) {
      const history = JSON.parse(localStorage.getItem('vaultHistory_' + userPublicKey) || '[]');
      history.push({
         type: 'Withdraw',
         timestamp: Math.floor(Date.now() / 1000)
      });
      localStorage.setItem('vaultHistory_' + userPublicKey, JSON.stringify(history));
      renderHistory();
    }
  } catch (error) {
    console.error(error);
    if (error.message && error.message.includes("UnreachableCodeReached") || error.message.includes("WasmVm")) {
      setStatus(withdrawStatus, `Withdrawal denied! Funds are likely still locked or you have no active deposit.`, 'error');
    } else {
      setStatus(withdrawStatus, `Withdraw error: ${error.message}`, 'error');
    }
  }
});

// View Deposit removed as requested.
