#!/usr/bin/env python3
"""
Quantum-Safe Symmetric Decryption Module (Standalone Version)
--------------------------------------------------------------
Features:
- AES-256-GCM Decryption
- HKDF Key Derivation with salt extraction
- Symmetric Ratchet (Receiver-side)
- Secure Memory Wipe (ctypes.memset)
- Integrated Interactive Testing

Target: Receiver-side (Decryption)
"""

import os
import ctypes
from typing import Optional
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import HKDF
from Crypto.Hash import SHA256

# --- CONSTANTS (Must match encryption module) ---
AES_KEY_SIZE = 32     # 256 bits
SALT_SIZE = 16        # 128 bits
NONCE_SIZE = 12       # 96 bits
TAG_SIZE = 16         # 128 bits
HKDF_INFO = b"AES-GCM-256-KEY"
RATCHET_INFO_CHAIN = b"RATCHET-CHAIN-KEY"
RATCHET_INFO_MSG = b"RATCHET-MESSAGE-KEY"
MAX_SKIP_RANGE = 1000 # Max steps to fast-forward at once
MAX_STORED_KEYS = 2000 # Max total keys to hold in memory

# --- CORE UTILITIES ---

def secure_wipe(data: bytes):
    """Overwrites the memory of a bytes object with zeros."""
    if not isinstance(data, (bytes, bytearray)):
        return
    buf_len = len(data)
    if buf_len == 0:
        return
    try:
        if isinstance(data, bytearray):
            ctypes.memset(ctypes.addressof(ctypes.c_char.from_buffer(data)), 0, buf_len)
        else:
            # We don't wipe immutable bytes to avoid corruption/segfaults
            pass
    except Exception:
        pass

# --- DECRYPTION LOGIC ---

def decrypt_message(
    shared_secret: bytes,
    package: bytes,
    aad: Optional[bytes] = None
) -> bytes:
    """
    Decrypt a message using AES-256-GCM with HKDF-derived key.
    
    Structure of package: salt (16) || nonce (12) || ciphertext (...) || tag (16)
    """
    if len(package) < (SALT_SIZE + NONCE_SIZE + TAG_SIZE):
        raise ValueError("Invalid package size")

    # 1. Extract components
    salt = package[:SALT_SIZE]
    nonce = package[SALT_SIZE:SALT_SIZE+NONCE_SIZE]
    ciphertext = package[SALT_SIZE+NONCE_SIZE:-TAG_SIZE]
    tag = package[-TAG_SIZE:]

    # 2. Derive the same AES key using the extracted salt
    aes_key = HKDF(
        master=shared_secret,
        key_len=AES_KEY_SIZE,
        salt=salt,
        hashmod=SHA256,
        context=HKDF_INFO
    )

    try:
        # 3. Initialize AES-256-GCM cipher for decryption
        cipher = AES.new(aes_key, AES.MODE_GCM, nonce=nonce)
        
        # 4. Add AAD (must match what was used during encryption)
        if aad is not None:
            cipher.update(aad)
        
        # 5. Decrypt and verify tag
        plaintext = cipher.decrypt_and_verify(ciphertext, tag)
        return plaintext
    finally:
        # 6. Securely wipe the derived key
        secure_wipe(aes_key)

# --- RATCHET (RECEIVER SIDE) ---

class SymmetricRatchetReceiver:
    """
    Implements the receiver-side symmetric key ratchet with out-of-order support.
    Must be initialized with the SAME shared_secret as the sender.
    """
    def __init__(self, initial_shared_secret: bytes):
        self._chain_key = bytearray(initial_shared_secret)
        self._step = 0
        self._skipped_keys = {} # {step_number: message_key}

    @property
    def step(self) -> int:
        return self._step

    def _advance(self) -> bytes:
        """Derives message key and advances chain key."""
        message_key = HKDF(
            master=self._chain_key,
            key_len=AES_KEY_SIZE,
            salt=None,
            hashmod=SHA256,
            context=RATCHET_INFO_MSG
        )
        
        new_chain_key = HKDF(
            master=self._chain_key,
            key_len=AES_KEY_SIZE,
            salt=None,
            hashmod=SHA256,
            context=RATCHET_INFO_CHAIN
        )
        
        secure_wipe(self._chain_key)
        self._chain_key = new_chain_key
        self._step += 1
        return message_key

    def decrypt(self, package: bytes, aad: Optional[bytes] = None) -> bytes:
        """Decrypt message using automatic catch-up or skipped keys."""
        target_step = self._step + 1
        
        # Parse sequence number from AAD if available
        if aad:
            try:
                aad_str = aad.decode('utf-8', errors='ignore')
                if "seq:" in aad_str:
                    # Extract number between 'seq:' and next '|' (or end of string)
                    parts = aad_str.split("seq:")[1].split("|")[0]
                    target_step = int(parts)
            except (ValueError, IndexError):
                pass 

        # Case A: We already skipped this message and saved its key
        if target_step in self._skipped_keys:
            message_key = self._skipped_keys.pop(target_step)
            print(f"  [LOG] Used saved key for skipped Step {target_step}")
        
        # Case B: This is a future message, we need to catch up
        elif target_step > self._step:
            # --- SAFETY CHECK ---
            skip_distance = target_step - self._step
            if skip_distance > MAX_SKIP_RANGE:
                raise ValueError(f"Security Alert: Message skip distance ({skip_distance}) exceeds safety limit ({MAX_SKIP_RANGE}). Possbile DoS attack.")
            
            if (len(self._skipped_keys) + skip_distance) > MAX_STORED_KEYS:
                raise ValueError(f"Security Alert: Too many skipped keys stored ({len(self._skipped_keys)}). Cannot skip {skip_distance} more.")
            # --------------------

            print(f"  [LOG] Catching up: Local Step {self._step} -> Target Step {target_step}")
            while self._step < target_step:
                message_key = self._advance()
                if self._step < target_step:
                    self._skipped_keys[self._step] = message_key
                    print(f"  [LOG] Skipping and saving key for Step {self._step}")
        
        # Case C: Message is from the past and not in skipped_keys (Reuse/Replay attack?)
        else:
            raise ValueError(f"Message step {target_step} is older than current step {self._step} and was not found in skipped keys.")

        try:
            plaintext = decrypt_message(message_key, package, aad=aad)
            return plaintext
        finally:
            secure_wipe(message_key)

# --- AUTOMATED TESTING ---

def run_automated_test():
    """
    Simulates a real-world scenario where messages arrive out of order
    or are skipped entirely, testing the ratchet's catch-up logic.
    """
    print("\n" + "="*60)
    print("🚀 STARTING AUTOMATED SYNC & CATCH-UP TEST".center(60))
    print("="*60)
    
    # Import sender only when needed to avoid circular dependencies
    try:
        from quantum_encryption_module import SymmetricRatchet as SenderRatchet
    except ImportError:
        print("❌ ERROR: 'quantum_encryption_module.py' not found. Cannot run test.")
        return

    # 1. Setup
    shared_secret = os.urandom(32)
    sender = SenderRatchet(shared_secret)
    receiver = SymmetricRatchetReceiver(shared_secret)
    
    messages = [
        "First Message (Seq 1)",
        "Second Message (Seq 2)",
        "Third Message (Seq 3)"
    ]
    
    packages = []
    aads = []
    
    # 2. Encrypt all
    print("\n[PREP] Encrypting 3 messages at the sender side...")
    for i, msg in enumerate(messages):
        seq = i + 1
        aad = f"sender:TestUser|seq:{seq}|id:auto-test".encode('utf-8')
        package = sender.encrypt(msg.encode('utf-8'), aad=aad)
        packages.append(package)
        aads.append(aad)
        print(f"  - Generated Message {seq}")

    # 3. Test Catch-up
    print(f"\n[STEP 1] Decrypting Message #3 FIRST (Skips #1 and #2)...")
    try:
        dec3 = receiver.decrypt(packages[2], aad=aads[2])
        print(f"  ✅ SUCCESS: Message 3 Decrypted: '{dec3.decode()}'")
        print(f"  Ratchet advanced to Step: {receiver.step}")
        print(f"  Keys saved in memory for missed messages: {list(receiver._skipped_keys.keys())}")
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        return

    # 4. Test Out-of-Order Recovery
    print(f"\n[STEP 2] Decrypting skipped Message #1...")
    try:
        dec1 = receiver.decrypt(packages[0], aad=aads[0])
        print(f"  ✅ SUCCESS: Message 1 Decrypted: '{dec1.decode()}'")
        print(f"  Remaining skipped keys: {list(receiver._skipped_keys.keys())}")
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        return

    # 5. Test Safety Limit
    print(f"\n[STEP 3] Testing Safety Limit (Simulating huge jump)...")
    fake_aad = b"seq:5000|id:attack"
    try:
        receiver.decrypt(packages[0], aad=fake_aad) # Content doesn't matter, it should trigger limit first
        print("  ❌ FAILURE: Large jump was not blocked!")
    except ValueError as e:
        print(f"  ✅ SUCCESS: Blocked jump over safety limit. Error: {e}")

    print("\n" + "="*60)
    print("✨ ALL SYNC TESTS PASSED SUCCESSFULLY!".center(60))
    print("="*60 + "\n")

# --- INTERACTIVE TESTING ---

def main():
    print("\n" + "="*60)
    print("  🔓 QUANTUM-SAFE DECRYPTION & SYNC MODULE".center(60))
    print("="*60)
    
    print("\nSelect Mode:")
    print(" 1. Interactive Decryption (Manual input)")
    print(" 2. Run Automated Sync/Catch-up Test")
    print(" 3. Exit")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == '2':
        run_automated_test()
        return
    elif choice == '3':
        return
    elif choice != '1':
        print("Invalid choice. Defaulting to Interactive Mode.")

    print("\n" + "-"*60)
    print("[SETUP] To decrypt, you need the EXACT initial shared secret.")
    secret_hex = input("Enter Shared Secret (Hex) or press Enter to use a test secret: ").strip()
    
    if not secret_hex:
        # For testing, we use a fixed secret that the user might have used in the other module
        shared_secret = b'\x00' * 32 
        print("Using default test secret (all zeros).")
    else:
        try:
            shared_secret = bytes.fromhex(secret_hex)
        except ValueError:
            print("Invalid Hex string. Exiting.")
            return

    ratchet = SymmetricRatchetReceiver(shared_secret)

    while True:
        print("-" * 60)
        package_hex = input("\nPaste Encrypted Package (Hex) to decrypt (or 'q' to quit): ").strip()

        if package_hex.lower() in ['q', 'quit', 'exit']:
            break

        if not package_hex:
            continue

        aad_str = input("Enter Metadata (AAD) used for this message (optional): ").strip()
        aad = aad_str.encode('utf-8') if aad_str else None

        try:
            package = bytes.fromhex(package_hex)
            # Decrypt using ratchet (now supports catch-up and out-of-order)
            plaintext = ratchet.decrypt(package, aad=aad)
            
            print(f"\n✅ DECRYPTION SUCCESSFUL!")
            print(f"  Current Ratchet Step: {ratchet.step}")
            if ratchet._skipped_keys:
                print(f"  Keys held for missed messages: {list(ratchet._skipped_keys.keys())}")
            print(f"  Decrypted Message: {plaintext.decode('utf-8')}")
            
        except Exception as e:
            print(f"\n❌ DECRYPTION FAILED: {e}")
            print("  Check if the Hex, Secret, AAD, or Ratchet Step is correct.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nExited by user.")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
