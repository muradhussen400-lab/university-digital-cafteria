from cryptography.fernet import Fernet
from core.config import settings

def get_cipher():
    key = settings.ACTIVATION_ENCRYPTION_KEY
    if not key:
        raise ValueError("ACTIVATION_ENCRYPTION_KEY environment variable is not set.")
    return Fernet(key.encode())

def encrypt_code(code: str) -> str:
    cipher = get_cipher()
    encrypted_bytes = cipher.encrypt(code.encode())
    return encrypted_bytes.decode()

def decrypt_code(encrypted_code: str) -> str:
    cipher = get_cipher()
    decrypted_bytes = cipher.decrypt(encrypted_code.encode())
    return decrypted_bytes.decode()
