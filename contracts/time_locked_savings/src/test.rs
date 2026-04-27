#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, Address, Env};
use soroban_sdk::token::Client as TokenClient;
use soroban_sdk::token::StellarAssetClient as TokenAdminClient;

fn create_token_contract<'a>(e: &Env, admin: &Address) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let contract_address = e.register_stellar_asset_contract(admin.clone());
    (
        TokenClient::new(e, &contract_address),
        TokenAdminClient::new(e, &contract_address),
    )
}

#[test]
fn test_deposit() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(TimeLockedSavings, ());
    let client = TimeLockedSavingsClient::new(&env, &contract_id);
    
    let user = Address::generate(&env);
    let admin = Address::generate(&env);
    let (token, token_admin) = create_token_contract(&env, &admin);
    
    token_admin.mint(&user, &1000);
    
    let unlock_time = 100;
    env.ledger().set_timestamp(50);
    
    client.deposit(&user, &token.address, &500, &unlock_time);
    
    assert_eq!(token.balance(&user), 500);
    assert_eq!(token.balance(&contract_id), 500);
    
    let deposit = client.get_deposit(&user).unwrap();
    assert_eq!(deposit.amount, 500);
    assert_eq!(deposit.unlock_time, unlock_time);
    assert_eq!(deposit.token, token.address);
}

#[test]
fn test_withdraw() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(TimeLockedSavings, ());
    let client = TimeLockedSavingsClient::new(&env, &contract_id);
    
    let user = Address::generate(&env);
    let admin = Address::generate(&env);
    let (token, token_admin) = create_token_contract(&env, &admin);
    
    token_admin.mint(&user, &1000);
    
    let unlock_time = 100;
    env.ledger().set_timestamp(50);
    
    client.deposit(&user, &token.address, &500, &unlock_time);
    
    // Fast forward time
    env.ledger().set_timestamp(150);
    
    client.withdraw(&user);
    
    assert_eq!(token.balance(&user), 1000);
    assert_eq!(token.balance(&contract_id), 0);
    
    assert!(client.get_deposit(&user).is_none());
}

#[test]
#[should_panic(expected = "Unlock time must be in the future.")]
fn test_deposit_past_unlock_time() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(TimeLockedSavings, ());
    let client = TimeLockedSavingsClient::new(&env, &contract_id);
    
    let user = Address::generate(&env);
    let admin = Address::generate(&env);
    let (token, token_admin) = create_token_contract(&env, &admin);
    
    token_admin.mint(&user, &1000);
    
    let unlock_time = 50;
    env.ledger().set_timestamp(100);
    
    client.deposit(&user, &token.address, &500, &unlock_time);
}

#[test]
#[should_panic(expected = "Deposit amount must be strictly positive.")]
fn test_deposit_zero_amount() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(TimeLockedSavings, ());
    let client = TimeLockedSavingsClient::new(&env, &contract_id);
    
    let user = Address::generate(&env);
    let admin = Address::generate(&env);
    let (token, token_admin) = create_token_contract(&env, &admin);
    
    token_admin.mint(&user, &1000);
    
    let unlock_time = 150;
    env.ledger().set_timestamp(100);
    
    client.deposit(&user, &token.address, &0, &unlock_time);
}
