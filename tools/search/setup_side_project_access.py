"""Set the private build key without recording or printing the password."""
import base64
import getpass
import hashlib
import json
import secrets
from access_gate import PRIVATE_CONFIG, ITERATIONS

if __name__ == '__main__':
    password = getpass.getpass('Side-project password: ')
    if not password or password != getpass.getpass('Confirm password: '):
        raise SystemExit('Passwords must match and cannot be empty.')
    salt = secrets.token_bytes(16)
    config = {'id': secrets.token_hex(16), 'iterations': ITERATIONS,
              'salt': base64.b64encode(salt).decode(),
              'key': base64.b64encode(hashlib.pbkdf2_hmac('sha256', password.encode(), salt, ITERATIONS, 32)).decode()}
    PRIVATE_CONFIG.parent.mkdir(exist_ok=True, mode=0o700)
    PRIVATE_CONFIG.write_text(json.dumps(config, indent=2) + '\n')
    PRIVATE_CONFIG.chmod(0o600)
    print('Private build key configured. Rebuild and publish the gated pages.')
