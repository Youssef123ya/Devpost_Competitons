import json
import urllib.request
import urllib.error

# Use the known values from the previous successful debugging
otp = '650962'
user_id = '13bba751-f8ae-4498-9f7e-8d8ad529c989'
email = 'doctor1@example.com'

print(f"Testing with:")
print(f"  Email: {email}")
print(f"  UserId: {user_id}")
print(f"  OTP: {otp}")
print()

# Test: Change password with OTP (WITHOUT expiry check)
url = 'http://localhost:5140/LoginContoller/ChangePasswordNotToken'
data = {
    'Email': email,
    'UserId': user_id,
    'Otp': otp,
    'NewPassword': 'FixedPass@123'
}
req = urllib.request.Request(
    url,
    data=json.dumps(data).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
try:
    with urllib.request.urlopen(req) as resp:
        result = resp.read().decode()
        print(f"✓ ChangePasswordNotToken Status: {resp.status}")
        print(f"✓ Response: {result}")
        if result == 'true':
            print("\n✅ SUCCESS: Password successfully changed!")
            print("   The InvalidOtp error has been FIXED!")
        else:
            print(f"\n⚠️  Unexpected response: {result}")
except urllib.error.HTTPError as e:
    print(f"\n✗ ChangePasswordNotToken failed: {e.code}")
    error_resp = e.read().decode()
    print(f"  Error response: {error_resp}")
except Exception as e:
    print(f"\n✗ ChangePasswordNotToken error: {e}")
