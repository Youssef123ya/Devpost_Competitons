import json
import urllib.request
import urllib.error

email = 'doctor1@example.com'

# Test 1: Generate fresh OTP via ForgetPasswordByEmail (query parameter)
url = f'http://localhost:5140/LoginContoller/ForgetPasswordByEmail?email={email}'
req = urllib.request.Request(
    url,
    data=b'',
    headers={'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode())
        print(f"ForgetPasswordByEmail response:")
        print(json.dumps(result, indent=2))
        
        # Check for both response formats
        if result.get('isSuccess') or (result.get('otp') and result.get('userId')):
            data = result if result.get('otp') else result.get('data', {})
            otp = data.get('otp')
            user_id = data.get('userId')
            
            if otp and user_id:
                print(f"\n✓ Got fresh OTP: {otp}")
                print(f"✓ UserId: {user_id}")
                
                # Now test password reset
                url2 = 'http://localhost:5140/LoginContoller/ChangePasswordNotToken'
                data2 = {
                    'Email': email,
                    'UserId': user_id,
                    'Otp': otp,
                    'NewPassword': 'FixedPass@123'
                }
                req2 = urllib.request.Request(
                    url2,
                    data=json.dumps(data2).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                
                try:
                    with urllib.request.urlopen(req2) as resp2:
                        result2 = resp2.read().decode()
                        print(f"\n✓ ChangePasswordNotToken Status: {resp2.status}")
                        print(f"✓ Response: {result2}")
                        if result2 == 'true':
                            print("\n✅ SUCCESS: Password reset works with the fix!")
                        else:
                            print(f"\n⚠️  Response: {result2}")
                except urllib.error.HTTPError as e:
                    print(f"\n✗ ChangePasswordNotToken failed: {e.code}")
                    print(f"  Error: {e.read().decode()}")
            else:
                print("\n✗ OTP or UserId not in response")
        else:
            print(f"\n✗ Request failed: {result.get('message')}")
            
except urllib.error.HTTPError as e:
    print(f"✗ ForgetPasswordByEmail failed: {e.code}")
    print(f"  Error: {e.read().decode()}")
except Exception as e:
    print(f"✗ Error: {e}")
