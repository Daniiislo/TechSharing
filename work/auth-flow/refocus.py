from pathlib import Path
import re, shutil
root=Path('D:/TechSharing/Auth/presentation/auth_beyond_login_ppt169_20261110')
p=root/'svg_output'; backup=Path('D:/TechSharing/work/auth-flow/before-refocus'); backup.mkdir(exist_ok=True)
for f in p.glob('*.svg'): shutil.copy2(f,backup/f.name)
for name in ['07_federated_sign_in.svg','08_oauth_api_access.svg']:
 shutil.copy2(Path('D:/TechSharing/work/auth-flow/originals')/name,p/name)
f=p/'03_authentication_overview.svg'; s=f.read_text(encoding='utf-8')
s=s.replace('>OAuth 2.0</text>','>SAML 2.0</text>').replace('>Delegates API access</text>','>Federated enterprise sign-in</text>')
s=re.sub(r'<text x="710" y="476".*?</text>\s*<text x="862" y="476".*?</text>','<text x="710" y="476" font-size="20" fill="#526B80">The provider confirms the user identity.</text>',s)
f.write_text(s,encoding='utf-8')
f=p/'07_federated_sign_in.svg'; s=f.read_text(encoding='utf-8').replace('OIDC: Who Signed In?','OIDC: Sign In with Google').replace('Anna wants to sign in to a calendar app using an account she already has.','Anna signs in to the calendar app using her Google account.').replace('Identity provider</text>','Google</text>').replace('Redirect Anna to sign in','Redirect Anna to Google (openid scope)').replace('The calendar app verifies the ID token and starts a session for Anna.','The app validates the ID token, identifies Anna, then creates its own login session.'); f.write_text(s,encoding='utf-8')
f=p/'08_oauth_api_access.svg'; s=f.read_text(encoding='utf-8').replace('OAuth 2.0: What Can the App Access?','OAuth 2.0: Grant Access to an API').replace('Anna gives the calendar app permission to read her calendar events.','Anna grants calendar access. OAuth delegates access to resources.').replace('Authorization server</text>','Google</text>').replace('The Calendar API checks the access token and its permissions.','An access token enables permitted API calls. OAuth alone does not define user sign-in.'); f.write_text(s,encoding='utf-8')
mapping={n:(25 if n==9 else n-1 if n>9 else n) for n in range(1,26)}
files=[(f,f.read_text(encoding='utf-8')) for f in p.glob('*.svg')]
for f,_ in files:f.unlink()
for f,s in files:
 old=int(f.name[:2]); new=mapping[old]
 if old==9:
  s=s.replace('01 · Authentication &amp; Sign-In','REFERENCE · CODE EXCHANGE')
  s=s.replace('</g>','<text x="1216" y="55" font-size="18" fill="#007F9E" text-anchor="end">APPENDIX / A7</text></g>',1)
  s=s.replace('09 / 19','APPENDIX / A7')
 elif old<=19:s=re.sub(r'\b\d{2} / 19\b',f'{new:02d} / 18',s)
 (p/(f'{new:02d}'+f.name[2:])).write_text(s,encoding='utf-8')
for f in (root/'svg_final').glob('*.svg'):f.unlink()
spec=root/'design_spec.md'; s=spec.read_text(encoding='utf-8').replace('19 main pages plus 6 reference pages','18 main pages plus 7 reference pages')
s=s.replace('OIDC conveys the sign-in result, OAuth delegates API access and PKCE protects the code exchange.','OIDC and SAML 2.0 convey the sign-in result from an identity provider. OAuth delegates API access and is explained separately.').replace('passkey; OIDC; OAuth 2.0; PKCE.','passkey; OIDC; SAML 2.0.')
blocks=re.findall(r'#### Slide (\d{2}) - .*?(?=#### Slide|\Z)',s,flags=re.S)
sections=re.split(r'(?=#### Slide \d{2} - )',s); lead=sections[0]; tail=''
revised=[]
for b in sections[1:]:
 old=int(re.match(r'#### Slide (\d+)',b)[1]); new=mapping[old]
 if old==7:b='''#### Slide 07 - OIDC: Sign In with Google
- **Audience move**: Understand how federated identity becomes an app login session.
- **Relationships**: App redirects Anna to Google with openid scope; Google returns code; app exchanges code for tokens, validates ID token, identifies Anna and creates its own session.
- **Title**: OIDC: Sign In with Google
- **Core message**: OIDC confirms identity. The app creates its own login session after validation.
- **Composition**: Two-actor sequence ending in an explicit app-session takeaway.

'''
 if old==8:b='''#### Slide 08 - OAuth 2.0: Grant Access to an API
- **Audience move**: Separate delegated API access from user sign-in.
- **Relationships**: Anna grants access; Google issues an access token; app calls Calendar API; API checks token and permissions.
- **Title**: OAuth 2.0: Grant Access to an API
- **Core message**: OAuth delegates resource access. OAuth alone does not define user sign-in.
- **Composition**: Google, app and Calendar API sequence focused on access token issuance and use.

'''
 b=re.sub(r'^#### Slide \d{2}',f'#### Slide {new:02d}',b)
 revised.append((new,b))
spec.write_text(lead+''.join(b for _,b in sorted(revised)),encoding='utf-8')
lock=root/'spec_lock.md'; s=lock.read_text(encoding='utf-8'); s=re.sub(r'- P(\d{2}): ([^\n]+)',lambda m:f'- P{mapping[int(m[1])]:02d}: {m[2]}',s); lock.write_text(s,encoding='utf-8')
g=Path('D:/TechSharing/Auth/docs/auth-presentation-presenter-guide.md'); s=g.read_text(encoding='utf-8').replace('19 slide','18 slide').replace('Sáu slide appendix','Bảy slide appendix')
s=s.replace('OIDC cho ứng dụng biết ai đã đăng nhập. OAuth 2.0 dùng khi ứng dụng cần quyền gọi API, còn PKCE bảo vệ bước đổi code.','OIDC và SAML 2.0 cho ứng dụng biết ai đã đăng nhập qua nhà cung cấp danh tính. OAuth là cơ chế cấp quyền truy cập API, sẽ giải thích riêng; PKCE chỉ là cơ chế bảo vệ và nằm trong appendix.')
parts=re.split(r'(?=^## (?:Appendix )?\d{2}\.)',s,flags=re.M); out=[parts[0]]; moved=''
for b in parts[1:]:
 m=re.match(r'## (Appendix )?(\d{2})\.',b)
 if not m:out.append(b);continue
 old=int(m[2]); new=mapping.get(old,old)
 if old==7:b='## 07. OIDC: Sign In with Google — 2 phút\n\nAnna muốn đăng nhập vào app bằng tài khoản Google. App chuyển Anna sang Google với scope openid. Sau khi Google xác thực Anna, trình duyệt quay về app với code. App đổi code lấy token, kiểm tra ID token bằng thư viện chuẩn để xác định Anna. Sau đó chính app tạo session đăng nhập riêng. OIDC cung cấp kết quả xác thực; app quản lý phiên của mình. Không dùng ID token để gọi Calendar API.\n\n**Chỉ hình:** Google xác nhận danh tính, rồi chỉ dòng cuối app tạo session.\n\n'
 if old==8:b='## 08. OAuth 2.0: Grant Access to an API — 2 phút\n\nĐây là nhu cầu khác: app muốn đọc lịch Google của Anna. Anna cấp quyền; Google phát access token; app gửi token khi gọi Calendar API. Token có thể cho phép đọc dữ liệu, gửi email hoặc thao tác khác tùy scope. OAuth chuẩn hóa việc cấp quyền truy cập tài nguyên, không tự định nghĩa đăng nhập. Có thể lấy profile qua API, nhưng lấy được profile chưa đủ để kết luận đã triển khai login an toàn; cần giao thức hoặc quy tắc xác minh danh tính của nhà cung cấp. OIDC chuẩn hóa việc xác thực danh tính trên nền OAuth. Nếu chỉ Login with Google, không cần xin quyền đọc lịch.\n\n**Chỉ hình:** Theo access token từ Google đến app rồi Calendar API.\n\n**Chuyển:** Sau khi xác thực thành công, app duy trì đăng nhập ra sao?\n\n'
 b=re.sub(r'^## (?:Appendix )?\d{2}\.',f'## {"Appendix " if old>=20 or old==9 else ""}{new:02d}.',b)
 if old==9:moved=b
 else:out.append(b)
text=''.join(out); pos=text.find('\n## Sources')
if pos<0:pos=text.find('\n## Nguồn')
text=text[:pos]+'\n'+moved+text[pos:] if pos>=0 else text+'\n'+moved
g.write_text(text,encoding='utf-8')
print('Refocused OIDC/OAuth, corrected slide 3, moved PKCE to appendix A7; 18 main + 7 appendix.')
