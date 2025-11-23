/// Sirius Data Layer - Move-first MVP
/// Repository and Commit objects on-chain
/// Anti-fork protection and basic permissions

module sirius::repository;

use sui::object::{UID, ID};
use sui::tx_context::TxContext;
use sui::transfer;
use std::bcs;

/// Repository object - root of a project
/// Owner: address who created the repo
/// Writers: addresses allowed to push commits
/// Readers: addresses allowed to read/clone
/// Head: current commit ID (bytes)
/// SealedRMKBlobId: sealed root master key stored on Walrus
public struct Repository has key {
    id: UID,
    owner: address,
    writers: vector<address>,
    readers: vector<address>,
    head: vector<u8>, // commit ID (empty for new repo)
    sealed_rmk_blob_id: vector<u8>, // Walrus blob ID for sealed RMK
    created_at_ms: u64,
    deleted: bool, // Soft delete flag
}

/// Commit object - a versioned snapshot
/// RepoId: ID of the repository
/// Parent: parent commit ID (empty for first commit)
/// ManifestBlobId: Walrus blob ID containing manifest JSON
/// MerkleRoot: Merkle root hash of the manifest
/// Author: address who created this commit
public struct Commit has key {
    id: UID,
    repo_id: ID,
    parent: vector<u8>,
    manifest_blob_id: vector<u8>,
    merkle_root: vector<u8>,
    author: address,
    timestamp_ms: u64,
}

/// Error codes
const E_NOT_OWNER: u64 = 0;
const E_NOT_WRITER: u64 = 1;
const E_FORK_DETECTED: u64 = 2; // parent != head (anti-fork)
const E_INVALID_PARENT: u64 = 3;
const E_ALREADY_READER: u64 = 4;
const E_ALREADY_WRITER: u64 = 5;
const E_ALREADY_DELETED: u64 = 6; // Repository already deleted

/// Create a new repository
/// Owner becomes the first writer automatically
public fun create_repo(
    owner: address,
    sealed_rmk_blob_id: vector<u8>,
    initial_writers: vector<address>,
    ctx: &mut TxContext
) {
    // Start with owner as a writer
    let mut writers = vector::singleton(owner);
    
    // Add initial writers (collaborators), avoiding duplicates
    let mut i = 0;
    let len = vector::length(&initial_writers);
    while (i < len) {
        let addr = *vector::borrow(&initial_writers, i);
        // Only add if not already in writers list (avoid duplicates)
        if (!vector::contains(&writers, &addr)) {
            vector::push_back(&mut writers, addr);
        };
        i = i + 1;
    };
    
    let repo = Repository {
        id: object::new(ctx),
        owner,
        writers, // owner + initial writers (collaborators)
        readers: vector::empty<address>(),
        head: vector::empty<u8>(), // empty head for new repo
        sealed_rmk_blob_id,
        created_at_ms: tx_context::epoch_timestamp_ms(ctx),
        deleted: false, // Initialize as not deleted
    };
    
    transfer::share_object(repo);
}

/// Push a new commit to the repository
/// Verifies caller is writer or owner
/// Enforces anti-fork: parent must equal current head (except first commit)
public fun push_commit(
    repo: &mut Repository,
    parent: vector<u8>,
    manifest_blob_id: vector<u8>,
    merkle_root: vector<u8>,
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);
    
    // Check permissions: must be owner or writer
    assert!(
        sender == repo.owner || vector::contains(&repo.writers, &sender),
        E_NOT_WRITER
    );
    
    // Anti-fork check: parent must equal current head
    // Exception: if head is empty (first commit), parent must also be empty
    let is_first_commit = vector::length(&repo.head) == 0;
    if (is_first_commit) {
        // First commit: parent must be empty
        assert!(vector::length(&parent) == 0, E_INVALID_PARENT);
    } else {
        // Not first commit: parent must equal current head
        // Compare byte by byte
        let head_len = vector::length(&repo.head);
        let parent_len = vector::length(&parent);
        assert!(head_len == parent_len, E_FORK_DETECTED);
        let mut i = 0;
        while (i < head_len) {
            let head_byte = *vector::borrow(&repo.head, i);
            let parent_byte = *vector::borrow(&parent, i);
            assert!(head_byte == parent_byte, E_FORK_DETECTED);
            i = i + 1;
        };
    };
    
    // Create commit
    let commit = Commit {
        id: object::new(ctx),
        repo_id: object::id(repo),
        parent,
        manifest_blob_id,
        merkle_root,
        author: sender,
        timestamp_ms: tx_context::epoch_timestamp_ms(ctx),
    };
    
    let commit_id = object::id(&commit);
    
    // Update repository head to new commit (convert ID to bytes)
    repo.head = bcs::to_bytes(&commit_id);
    
    transfer::share_object(commit);
}

/// Grant read access to an address
/// Only owner can grant permissions
public fun grant_reader(
    repo: &mut Repository,
    addr: address,
    _ctx: &mut TxContext
) {
    assert!(tx_context::sender(_ctx) == repo.owner, E_NOT_OWNER);
    
    // Check if already a reader
    assert!(!vector::contains(&repo.readers, &addr), E_ALREADY_READER);
    
    vector::push_back(&mut repo.readers, addr);
}

/// Grant write access to an address
/// Only owner can grant permissions
public fun grant_writer(
    repo: &mut Repository,
    addr: address,
    _ctx: &mut TxContext
) {
    assert!(tx_context::sender(_ctx) == repo.owner, E_NOT_OWNER);
    
    // Check if already a writer
    assert!(!vector::contains(&repo.writers, &addr), E_ALREADY_WRITER);
    
    vector::push_back(&mut repo.writers, addr);
}

/// Revoke read access
/// Only owner can revoke
public fun revoke_reader(
    repo: &mut Repository,
    addr: address,
    _ctx: &mut TxContext
) {
    assert!(tx_context::sender(_ctx) == repo.owner, E_NOT_OWNER);
    
    // Find and remove address from readers
    let len = vector::length(&repo.readers);
    let mut i = 0;
    while (i < len) {
        let current = *vector::borrow(&repo.readers, i);
        if (current == addr) {
            vector::remove(&mut repo.readers, i);
            break
        };
        i = i + 1;
    };
}

/// Revoke write access
/// Only owner can revoke (cannot revoke owner's write access)
public fun revoke_writer(
    repo: &mut Repository,
    addr: address,
    _ctx: &mut TxContext
) {
    assert!(tx_context::sender(_ctx) == repo.owner, E_NOT_OWNER);
    assert!(addr != repo.owner, E_NOT_OWNER); // Cannot revoke owner
    
    // Find and remove address from writers
    let len = vector::length(&repo.writers);
    let mut i = 0;
    while (i < len) {
        let current = *vector::borrow(&repo.writers, i);
        if (current == addr) {
            vector::remove(&mut repo.writers, i);
            break
        };
        i = i + 1;
    };
}

/// View function: Get repository head commit ID
public fun get_head(repo: &Repository): vector<u8> {
    repo.head
}

/// View function: Check if address is reader
public fun is_reader(repo: &Repository, addr: address): bool {
    vector::contains(&repo.readers, &addr) || addr == repo.owner
}

/// View function: Check if address is writer
public fun is_writer(repo: &Repository, addr: address): bool {
    vector::contains(&repo.writers, &addr) || addr == repo.owner
}

/// View function: Get repository info
public fun get_repo_info(repo: &Repository): (address, vector<address>, vector<address>, vector<u8>) {
    (repo.owner, repo.writers, repo.readers, repo.head)
}

/// Soft delete a repository
/// Only owner can delete
/// Marks repository as deleted (soft delete - object remains on-chain)
public fun delete_repo(
    repo: &mut Repository,
    _ctx: &mut TxContext
) {
    assert!(tx_context::sender(_ctx) == repo.owner, E_NOT_OWNER);
    assert!(!repo.deleted, E_ALREADY_DELETED);
    
    repo.deleted = true;
}

/// View function: Check if repository is deleted
public fun is_deleted(repo: &Repository): bool {
    repo.deleted
}

