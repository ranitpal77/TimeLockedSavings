#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Deposit {
    pub token: Address,
    pub amount: i128,
    pub unlock_time: u64,
}

#[contracttype]
pub enum DataKey {
    UserDeposit(Address),
}

#[contract]
pub struct TimeLockedSavings;

#[contractimpl]
impl TimeLockedSavings {
    /// Deposit funds into the time-locked savings contract.
    /// `unlock_time` is the ledger timestamp (in seconds) after which the funds can be withdrawn.
    pub fn deposit(env: Env, user: Address, token: Address, amount: i128, unlock_time: u64) {
        user.require_auth();

        if amount <= 0 {
            panic!("Deposit amount must be strictly positive.");
        }

        if unlock_time <= env.ledger().timestamp() {
            panic!("Unlock time must be in the future.");
        }

        // Transfer funds from the user to this contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        let key = DataKey::UserDeposit(user.clone());
        let mut deposits: Vec<Deposit> = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));

        // Record the deposit
        deposits.push_back(Deposit {
            token,
            amount,
            unlock_time,
        });

        env.storage().persistent().set(&key, &deposits);
    }

    /// Withdraw funds from the time-locked savings.
    /// Fails if there are no unlocked deposits.
    pub fn withdraw(env: Env, user: Address) {
        user.require_auth();

        let key = DataKey::UserDeposit(user.clone());
        let deposits: Vec<Deposit> = env.storage().persistent().get(&key).expect("No deposit found for user.");

        let mut remaining_deposits = Vec::new(&env);
        let mut total_withdrawn: i128 = 0;
        let mut withdraw_token = None;

        for deposit in deposits.iter() {
            if env.ledger().timestamp() >= deposit.unlock_time {
                total_withdrawn += deposit.amount;
                withdraw_token = Some(deposit.token.clone());
            } else {
                remaining_deposits.push_back(deposit);
            }
        }

        if total_withdrawn == 0 {
            panic!("Funds are still locked.");
        }

        if let Some(t) = withdraw_token {
            let token_client = token::Client::new(&env, &t);
            token_client.transfer(&env.current_contract_address(), &user, &total_withdrawn);
        }

        if remaining_deposits.is_empty() {
            env.storage().persistent().remove(&key);
        } else {
            env.storage().persistent().set(&key, &remaining_deposits);
        }
    }

    /// Read the current deposits for a user.
    pub fn get_deposits(env: Env, user: Address) -> Vec<Deposit> {
        let key = DataKey::UserDeposit(user);
        env.storage().persistent().get(&key).unwrap_or(Vec::new(&env))
    }
}

mod test;
