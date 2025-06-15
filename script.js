// Configuration
const config = {
    checkInterval: 30 * 60 * 1000, // 30 minutes
    piAppName: 'PiAutoWithdraw',
    piApiKey: 'YOUR_PI_API_KEY' // Get from Pi Developer Portal
};

// State
let state = {
    authenticated: false,
    autoWithdrawalEnabled: false,
    walletAddress: '',
    minAmount: 5,
    lastCheck: null,
    nextCheck: null,
    checkIntervalId: null
};

// DOM Elements
const authButton = document.getElementById('authButton');
const authSection = document.getElementById('authSection');
const withdrawalSection = document.getElementById('withdrawalSection');
const statusSection = document.getElementById('statusSection');
const walletAddressInput = document.getElementById('walletAddress');
const minAmountInput = document.getElementById('minAmount');
const setupAutoWithdrawalBtn = document.getElementById('setupAutoWithdrawal');
const checkNowButton = document.getElementById('checkNowButton');
const disableAutoWithdrawalBtn = document.getElementById('disableAutoWithdrawal');
const statusWallet = document.getElementById('statusWallet');
const statusAmount = document.getElementById('statusAmount');
const statusLastCheck = document.getElementById('statusLastCheck');
const statusNextCheck = document.getElementById('statusNextCheck');

// Initialize Pi SDK
const pi = new window.Pi(config.piAppName);

// Event Listeners
authButton.addEventListener('click', authenticateWithPi);
setupAutoWithdrawalBtn.addEventListener('click', setupAutoWithdrawal);
checkNowButton.addEventListener('click', checkForWithdrawals);
disableAutoWithdrawalBtn.addEventListener('click', disableAutoWithdrawal);

// Check if already authenticated (from localStorage)
function loadState() {
    const savedState = localStorage.getItem('piAutoWithdrawalState');
    if (savedState) {
        state = JSON.parse(savedState);
        updateUI();
        
        if (state.autoWithdrawalEnabled) {
            startAutoWithdrawal();
        }
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('piAutoWithdrawalState', JSON.stringify(state));
}

// Update UI based on current state
function updateUI() {
    if (state.authenticated) {
        authSection.classList.add('hidden');
        withdrawalSection.classList.remove('hidden');
        
        if (state.autoWithdrawalEnabled) {
            withdrawalSection.classList.add('hidden');
            statusSection.classList.remove('hidden');
            
            statusWallet.textContent = state.walletAddress || 'Not set';
            statusAmount.textContent = `${state.minAmount} π`;
            statusLastCheck.textContent = state.lastCheck ? 
                new Date(state.lastCheck).toLocaleString() : 'Never';
            statusNextCheck.textContent = state.nextCheck ? 
                new Date(state.nextCheck).toLocaleString() : 'Not scheduled';
        } else {
            withdrawalSection.classList.remove('hidden');
            statusSection.classList.add('hidden');
            
            if (state.walletAddress) {
                walletAddressInput.value = state.walletAddress;
            }
            if (state.minAmount) {
                minAmountInput.value = state.minAmount;
            }
        }
    } else {
        authSection.classList.remove('hidden');
        withdrawalSection.classList.add('hidden');
        statusSection.classList.add('hidden');
    }
}

// Authenticate with Pi Network
function authenticateWithPi() {
    pi.authenticate(['username', 'payments', 'wallet_address'], onAuthComplete)
        .then(onAuthComplete)
        .catch(error => {
            console.error('Authentication error:', error);
            alert('Authentication failed. Please try again.');
        });
}

function onAuthComplete(authResult) {
    if (authResult) {
        state.authenticated = true;
        state.walletAddress = authResult.walletAddress;
        saveState();
        updateUI();
    }
}

// Setup auto-withdrawal
function setupAutoWithdrawal() {
    const walletAddress = walletAddressInput.value.trim();
    const minAmount = parseFloat(minAmountInput.value);
    
    if (!walletAddress) {
        alert('Please enter your Pi wallet address');
        return;
    }
    
    if (isNaN(minAmount) || minAmount < 1) {
        alert('Please enter a valid minimum amount (at least 1π)');
        return;
    }
    
    state.autoWithdrawalEnabled = true;
    state.walletAddress = walletAddress;
    state.minAmount = minAmount;
    saveState();
    updateUI();
    
    startAutoWithdrawal();
    checkForWithdrawals();
}

// Start the auto-withdrawal interval
function startAutoWithdrawal() {
    if (state.checkIntervalId) {
        clearInterval(state.checkIntervalId);
    }
    
    state.checkIntervalId = setInterval(checkForWithdrawals, config.checkInterval);
    state.nextCheck = Date.now() + config.checkInterval;
    saveState();
    updateUI();
}

// Check for available balance and withdraw
function checkForWithdrawals() {
    if (!state.authenticated || !state.autoWithdrawalEnabled) return;
    
    console.log('Checking for available Pi...');
    
    // In a real implementation, you would check the user's balance here
    // This is a simulation that assumes there's always some Pi available
    const availablePi = Math.random() * 10 + 5; // Random amount between 5-15π
    
    if (availablePi >= state.minAmount) {
        initiateWithdrawal(availablePi);
    } else {
        console.log(`Available Pi (${availablePi.toFixed(2)}π) is below minimum (${state.minAmount}π)`);
    }
    
    state.lastCheck = Date.now();
    state.nextCheck = Date.now() + config.checkInterval;
    saveState();
    updateUI();
}

// Initiate a withdrawal payment
function initiateWithdrawal(amount) {
    const paymentData = {
        amount: amount,
        memo: `Auto-withdrawal of ${amount.toFixed(2)}π`,
        metadata: { timestamp: new Date().toISOString() },
        toAddress: state.walletAddress
    };
    
    console.log('Initiating payment:', paymentData);
    
    pi.createPayment(paymentData, (paymentId) => {
        console.log('Payment created with ID:', paymentId);
        // In a real app, you might track this payment ID
    }).catch(error => {
        console.error('Payment error:', error);
    });
}

// Disable auto-withdrawal
function disableAutoWithdrawal() {
    if (state.checkIntervalId) {
        clearInterval(state.checkIntervalId);
        state.checkIntervalId = null;
    }
    
    state.autoWithdrawalEnabled = false;
    state.nextCheck = null;
    saveState();
    updateUI();
}

// Initialize the app
loadState();