import hmac, hashlib, base64, json, time
key = b'"VERY VERY VERY VERY SECURED SECRET JWT TOKEN"'
header = {'alg':'HS256','typ':'JWT'}
payload = {'unique_name':'superadmin2','UserId':'99514b76-4024-4478-be3c-e1b255710ef5','Email':'superadmin2@example.com','FullName':'Super Admin','PhoneNumber':'0123456789','IsActive':'True','nbf':int(time.time()),'iat':int(time.time()),'iss':'https://launch.smarthealthit.org/v/r4/fhir','aud':'48db8bcc-da2a-44b7-b385-1859d1426d10'}

def b64(obj):
    return base64.urlsafe_b64encode(json.dumps(obj,separators=(',',':')).encode()).rstrip(b'=')

s = b64(header).decode() + '.' + b64(payload).decode()
sig = base64.urlsafe_b64encode(hmac.new(key, s.encode(), hashlib.sha256).digest()).rstrip(b'=').decode()
print(s + '.' + sig)
