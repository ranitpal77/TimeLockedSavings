import {
  isConnected,
  requestAccess,
  signTransaction,
} from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/themes/dark.css';

const CONTRACT_ID = 'CB7325I7Q2ZX3TQFJSVSDYR5PJUNA5MR3CG4LPEDLHHXTWWWNM6RBYSD';
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

const checkBalanceBtn = document.getElementById('checkBalanceBtn');
const balanceDisplay = document.getElementById('balanceDisplay');

const walletAddressDisplay = document.getElementById('walletAddressDisplay');
const amountInput = document.getElementById('amountInput');
const unlockDateTimePicker = document.getElementById('unlockDateTimePicker');
const durationSecondsInput = document.getElementById('durationSecondsInput');
const durationError = document.getElementById('durationError');
const quickLockSlider = document.getElementById('quickLockSlider');
const quickLockValue = document.getElementById('quickLockValue');
const lockedUntilDate = document.getElementById('lockedUntilDate');

let fp = flatpickr(unlockDateTimePicker, {
  enableTime: true,
  dateFormat: "Y-m-d\\TH:i",
  time_24hr: false,
  minDate: "today",
  onChange: function() {
    syncDateToSlider();
  }
});

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
  if (fp) {
    fp.setDate(localIso, false);
  } else {
    unlockDateTimePicker.value = localIso;
  }
  
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
    if (fp) {
      fp.setDate(localIso, false);
    } else {
      unlockDateTimePicker.value = localIso;
    }
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
    if (historyList) historyList.innerHTML = '<div class="info-box" style="text-align: center; padding: 32px;"><p class="info-text" style="margin:0; color: var(--text-main); font-weight: bold;">Connect your wallet to view history.</p></div>';
    return;
  }
  const history = JSON.parse(localStorage.getItem('vaultHistory_' + userPublicKey) || '[]');
  if (history.length === 0) {
    if (historyList) historyList.innerHTML = '<div class="info-box" style="text-align: center; padding: 32px;"><p class="info-text" style="margin:0; color: var(--text-main); font-weight: bold;">No transactions yet.</p></div>';
    return;
  }
  
  if (historyList) historyList.innerHTML = '';
  history.slice().reverse().forEach((item) => {
    const el = document.createElement('div');
    el.className = 'history-item';
    
    const dateStr = new Date(item.timestamp * 1000).toLocaleString();
    let typeClass = item.type === 'Deposit' ? 'history-type-deposit' : 'history-type-withdraw';
    
    let typeText = item.type;
    let amountText = item.amount ? item.amount + ' XLM' : '';
    
    if (item.type === 'Deposit') {
      typeText = `Deposit ${item.id || ''}`;
    } else if (item.type === 'Withdraw') {
      typeText = item.depositId ? `Withdraw (${item.depositId})` : 'Withdraw (Legacy)';
    }
    
    let timerHtml = '';
    if (item.type === 'Deposit' && item.unlockTime) {
      let isWithdrawn = false;
      if (item.id) {
         isWithdrawn = history.some(h => h.type === 'Withdraw' && h.depositId === item.id);
      } else {
         isWithdrawn = history.some(h => h.type === 'Withdraw' && h.timestamp >= item.unlockTime && h.timestamp > item.timestamp);
      }
      
      if (isWithdrawn) {
        timerHtml = `<div style="font-size: 0.9rem; margin-top: 4px;">Status: <span style="color: #34d399; font-weight: bold;">Withdrawn</span></div>`;
      } else {
        timerHtml = `<div style="font-size: 0.9rem; margin-top: 4px;">Status: <span class="timer-countdown" data-unlock="${item.unlockTime}">Calculating...</span></div>`;
      }
    }
    
    el.innerHTML = `
      <div class="history-item-header">
        <span class="${typeClass}">${typeText}</span>
        <span>${amountText}</span>
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
        walletBanner.innerHTML = `<div class="banner-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg></div><p>Wallet connected! Ready to interact with the Vault.</p>`;
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

// --- BALANCE CHECK ---
if (checkBalanceBtn) {
  checkBalanceBtn.addEventListener('click', async () => {
    if (!userPublicKey) {
      alert("Please connect your wallet first.");
      return;
    }
    
    checkBalanceBtn.textContent = 'Checking...';
    try {
      const horizonServer = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      const account = await horizonServer.loadAccount(userPublicKey);
      const xlmBalance = account.balances.find(b => b.asset_type === 'native');
      const xlmAmount = xlmBalance ? xlmBalance.balance : '0';
      
      balanceDisplay.textContent = `Balance: ${xlmAmount} XLM`;
      balanceDisplay.classList.remove('hidden');
    } catch (err) {
      console.error(err);
      balanceDisplay.textContent = 'Error fetching balance. Make sure account is funded on testnet.';
      balanceDisplay.classList.remove('hidden');
    } finally {
      checkBalanceBtn.textContent = 'Check Balance';
    }
  });
}

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
      const uniqueId = '#' + Math.random().toString(36).substring(2, 6).toUpperCase();
      history.push({
         type: 'Deposit',
         id: uniqueId,
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
      const now = Math.floor(Date.now() / 1000);
      
      history.forEach((h, idx) => {
        if (h.type === 'Deposit' && !h.id) h.id = '#OLD' + idx;
      });

      const unlockedDeposits = history.filter(h => {
        if (h.type !== 'Deposit') return false;
        if (h.unlockTime > now) return false;
        
        let isWithdrawn = false;
        if (h.id && history.some(w => w.type === 'Withdraw' && w.depositId === h.id)) {
          isWithdrawn = true;
        } else if (!h.id && history.some(w => w.type === 'Withdraw' && w.timestamp >= h.unlockTime && w.timestamp > h.timestamp)) {
          isWithdrawn = true;
        }
        return !isWithdrawn;
      });

      if (unlockedDeposits.length > 0) {
        unlockedDeposits.forEach(dep => {
          history.push({
             type: 'Withdraw',
             depositId: dep.id,
             amount: dep.amount,
             timestamp: now
          });
        });
      } else {
        // Fallback if the contract allowed a withdraw but we don't have matching local deposits
        history.push({
           type: 'Withdraw',
           timestamp: now
        });
      }
      
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
