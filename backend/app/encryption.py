import os
from base64 import b64encode, b64decode
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from dotenv import load_dotenv
from pathlib import Path
# Get encryption key from environment variable
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")
key = os.getenv("SECRET_KEY")
if key is None:
    raise ValueError("SECRET_KEY environment variable not set")
# Ensure key is 32 bytes for AES-256
key_bytes = key.encode('utf-8')
if len(key_bytes) < 32:
    key_bytes = key_bytes.ljust(32, b'0')
elif len(key_bytes) > 32:
    key_bytes = key_bytes[:32]

def encrypt_message(plain_text: str) -> str:
    cipher = AES.new(key_bytes, AES.MODE_CBC)
    ct_bytes = cipher.encrypt(pad(plain_text.encode('utf-8'), AES.block_size))
    iv = b64encode(cipher.iv).decode('utf-8')
    ct = b64encode(ct_bytes).decode('utf-8')
    return iv + ":" + ct

def decrypt_message(encrypted_text: str) -> str:
    iv, ct = encrypted_text.split(":")
    iv = b64decode(iv)
    ct = b64decode(ct)
    cipher = AES.new(key_bytes, AES.MODE_CBC, iv)
    pt = unpad(cipher.decrypt(ct), AES.block_size)
    return pt.decode('utf-8')
