#!/usr/bin/env python3
import os
from quantum_encryption_module import SymmetricRatchet as SenderRatchet
from quantum_decryption_module import SymmetricRatchetReceiver as ReceiverRatchet

def test_out_of_order():
    print("🚀 Starting Out-of-Order & Catch-up Test...")
    
    # 1. Setup
    initial_secret = os.urandom(32)
    sender = SenderRatchet(initial_secret)
    receiver = ReceiverRatchet(initial_secret)
    
    messages = [
        "Message 1 (The First One)",
        "Message 2 (The Second One)",
        "Message 3 (The Third One)"
    ]
    
    packages = []
    aads = []
    
    # 2. Encrypt all messages
    print("\n[ENCRYPTING] Encrypting 3 messages...")
    for i, msg in enumerate(messages):
        seq = i + 1
        aad = f"sender:Test|seq:{seq}|ts:12345678".encode('utf-8')
        package = sender.encrypt(msg.encode('utf-8'), aad=aad)
        packages.append(package)
        aads.append(aad)
        print(f"  Generated Message {seq}")

    # 3. Test Catch-up (Decrypt Message 3 first)
    print("\n[TEST] Decrypting Message 3 FIRST (Skipping 1 & 2)...")
    dec_3 = receiver.decrypt(packages[2], aad=aads[2])
    print(f"  Result: {dec_3.decode('utf-8')}")
    assert dec_3.decode('utf-8') == messages[2]
    print(f"  ✅ SUCCESS: Message 3 decrypted. Ratchet stepped to {receiver.step}")
    print(f"  Current Skipped Keys in Receiver: {list(receiver._skipped_keys.keys())}")
    assert 1 in receiver._skipped_keys
    assert 2 in receiver._skipped_keys

    # 4. Test Out-of-Order (Decrypt Message 1)
    print("\n[TEST] Decrypting Message 1 NOW (Out of Order)...")
    dec_1 = receiver.decrypt(packages[0], aad=aads[0])
    print(f"  Result: {dec_1.decode('utf-8')}")
    assert dec_1.decode('utf-8') == messages[0]
    print(f"  ✅ SUCCESS: Message 1 decrypted from skipped keys.")
    print(f"  Remaining Skipped Keys: {list(receiver._skipped_keys.keys())}")
    assert 1 not in receiver._skipped_keys
    assert 2 in receiver._skipped_keys

    # 5. Test Out-of-Order (Decrypt Message 2)
    print("\n[TEST] Decrypting Message 2 NOW (Out of Order)...")
    dec_2 = receiver.decrypt(packages[1], aad=aads[1])
    print(f"  Result: {dec_2.decode('utf-8')}")
    assert dec_2.decode('utf-8') == messages[1]
    print(f"  ✅ SUCCESS: Message 2 decrypted from skipped keys.")
    print(f"  Remaining Skipped Keys: {list(receiver._skipped_keys.keys())}")
    assert 2 not in receiver._skipped_keys

    print("\n✨ ALL TESTS PASSED! Remote sync, catch-up, and out-of-order delivery are working perfectly.")

if __name__ == "__main__":
    try:
        test_out_of_order()
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
