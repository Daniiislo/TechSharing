from pathlib import Path
import html, re, shutil
root=Path('D:/TechSharing/Auth/presentation/auth_beyond_login_ppt169_20261110')
backup=Path('D:/TechSharing/work/auth-flow/originals'); backup.mkdir(exist_ok=True)
slides=[('07_federated_sign_in.svg','OIDC: Who Signed In?','OIDC','The app verifies the ID token','and starts a session for Anna.'),('08_oauth_api_access.svg','OAuth 2.0: Access to the Calendar','OAuth','The app presents the access token.','The API checks its scope and validity.'),('09_pkce_code_exchange.svg','PKCE: Protect the Code Exchange','PKCE','Google hashes the received verifier','and compares it with the saved challenge.')]
def text(x,y,s,size=20,color='#102A43',bold=False,anchor='start'):
 return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" font-weight="{700 if bold else 400}" text-anchor="{anchor}">{html.escape(s)}</text>'
for idx,(name,title,focus,end1,end2) in enumerate(slides,7):
 src=root/'svg_output'/name
 if not (backup/name).exists(): shutil.copy2(src,backup/name)
 a=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" data-pptx-page-role="content" font-family="Segoe UI, sans-serif">','<rect id="background" data-pptx-role="background" width="1280" height="720" fill="#F7F9FC"/>',text(64,55,'01 · Authentication & Sign-In',18,'#007F9E'),text(64,108,title,44),text(64,153,'Anna signs in with Google and grants the app permission to read her calendar.',21,'#526B80')]
 for x,label in [(215,'Calendar app'),(565,'Google'),(810,'Calendar API')]:
  a += [f'<rect x="{x-85}" y="185" width="170" height="44" rx="8" fill="#E8F4F8"/>',text(x,214,label,20,bold=True,anchor='middle'),f'<line x1="{x}" y1="231" x2="{x}" y2="598" stroke="#CAD7E2" stroke-width="2"/>']
 rows=[(1,260,'Keep verifier; compute challenge','PKCE','local'),(2,308,'openid + calendar scope + challenge','OIDC / OAuth / PKCE','right'),(3,356,'Anna signs in and grants access','Google','google'),(4,404,'Return authorization code','OAuth / OIDC','left'),(5,452,'Exchange code + verifier','PKCE','right'),(6,500,'Return ID token + access token','OIDC / OAuth','left'),(7,548,'Read calendar + access token','OAuth','api')]
 for n,y,label,tag,direction in rows:
  active=focus in tag
  color='#007F9E' if active else '#526B80'
  if active:a.append(f'<rect x="65" y="{y-22}" width="830" height="43" rx="6" fill="#E8F4F8"/>')
  a += [text(78,y,str(n),18,color,True),text(110 if direction=='local' else 390 if direction=='google' else 600 if direction=='api' else 390,y,label,18,color,active,'start' if direction=='local' else 'middle')]
  if direction in ['right','left','api']:
   start,stop=(225,555) if direction=='right' else (555,225) if direction=='left' else (225,800)
   yy=y+10; tip=-8 if stop>start else 8
   a.append(f'<path d="M {start} {yy} H {stop} M {stop+tip} {yy-5} L {stop} {yy} L {stop+tip} {yy+5}" fill="none" stroke="{color}" stroke-width="2"/>')
 a.append('<line x1="923" y1="185" x2="923" y2="595" stroke="#CAD7E2"/>')
 a.append(text(950,215,focus,26,'#007F9E',True))
 details={7:[('Identity request','Step 2: include openid.'),('Identity result','Step 6: receive ID token.'),('App checks','Issuer, audience, signature,','expiry and nonce as required.'),('Then','Create the app session.')],8:[('Permission request','Step 2: request calendar scope.'),('Permission result','Step 6: receive access token.'),('API access','Step 7: send access token','to the Calendar API.'),('API checks','Token validity and permission.')],9:[('Before redirect','Create a random verifier.','Keep it secret in the app.'),('Step 2: send challenge','BASE64URL(SHA256(verifier))','code_challenge_method=S256'),('Step 5: send verifier','Google computes the hash again.','It must match the saved challenge.'),('Why it helps','A stolen code alone is insufficient.')]}
 yy=254
 for lines in details[idx]:
  a.append(text(950,yy,lines[0],19,'#102A43',True)); yy+=25
  for line in lines[1:]: a.append(text(950,yy,line,16,'#526B80')); yy+=23
  yy+=15
 a += ['<line x1="64" y1="611" x2="1216" y2="611" stroke="#CAD7E2"/>',text(64,640,end1+' '+end2,21,'#007F9E',True),'<g id="footer" data-pptx-role="footer"><line x1="64" y1="675" x2="1216" y2="675" stroke="#CAD7E2"/>',text(64,698,'OpenID Connect Core · OAuth 2.0 · RFC 7636 (PKCE)',16,'#526B80'),text(1216,698,f'{idx:02d} / 19',16,'#526B80',anchor='end'),'</g></svg>']
 src.write_text('\n'.join(a),encoding='utf-8')
spec=root/'design_spec.md'; s=spec.read_text(encoding='utf-8')
for idx,(_,title,focus,e1,e2) in enumerate(slides,7):
 block=f'''#### Slide {idx:02d} - {title}
- **Audience move**: Follow the same Google sign-in and calendar-access flow, focusing on {focus}.
- **Relationships**: order and link: app keeps verifier, redirects with openid/calendar scope/challenge, Anna signs in and grants access at Google, code returns via browser, app exchanges code and verifier, Google returns ID/access tokens, app calls Calendar API with access token.
- **Title**: {title}
- **Core message**: {e1} {e2}
- **Composition**: Shared seven-step sequence on three actor lanes; highlight {focus} steps. Right margin explains the focused responsibility. PKCE uses S256: BASE64URL(SHA256(verifier)), compared with the saved challenge.

'''
 s=re.sub(rf'#### Slide {idx:02d} - .*?(?=#### Slide)',lambda m:block,s,flags=re.S)
spec.write_text(s,encoding='utf-8')
guide=Path('D:/TechSharing/Auth/docs/auth-presentation-presenter-guide.md'); s=guide.read_text(encoding='utf-8')
scripts={7:'Cả ba slide tiếp theo dùng cùng một flow: Anna đăng nhập bằng Google và cho app đọc lịch. Đi theo số 1 đến 7. App chuẩn bị PKCE, chuyển Anna sang Google, nhận code, đổi code lấy token rồi gọi Calendar API. Ở slide này tập trung vào OIDC: openid ở bước 2 yêu cầu danh tính, ID token ở bước 6 là kết quả. App kiểm tra ID token bằng thư viện chuẩn rồi tạo phiên riêng cho Anna. ID token không dùng để gọi Calendar API.',8:'Giữ nguyên flow, chuyển trọng tâm sang OAuth. Ở bước 2, app xin quyền đọc lịch. Google xử lý việc cấp quyền của Anna và trả access token ở bước 6. Bước 7, app gửi access token cho Calendar API. API kiểm tra token và quyền trước khi trả dữ liệu. Chỉ đăng nhập thì không cần xin quyền đọc lịch. Ví dụ này cố ý có cả hai nhu cầu để thấy OIDC và OAuth cùng xuất hiện.',9:'Giữ nguyên flow và nhìn hai điểm PKCE. Trước redirect, app tạo verifier ngẫu nhiên và giữ bí mật. App băm SHA-256 rồi mã hóa Base64 URL-safe, bỏ padding, để có challenge. Bước 2 gửi challenge và code_challenge_method=S256. Google lưu challenge cùng giao dịch và ràng buộc với code. Bước 5 app gửi code cùng verifier gốc qua token endpoint. Google dùng S256 tính lại challenge rồi so với challenge đã lưu. Khớp mới qua kiểm tra PKCE; các kiểm tra code, client và redirect URI vẫn cần. Người chỉ lấy được code thiếu verifier nên không đổi được token. PKCE bảo vệ bước đổi code, không phải một cách login riêng.'}
for idx,(_,title,*_) in enumerate(slides,7):
 s=re.sub(rf'## {idx:02d}\. .*?(?=\n## )',lambda m:f'## {idx:02d}. {title} — 2 phút\n\n{scripts[idx]}\n\n**Chỉ hình:** Theo số bước trên cùng sơ đồ, rồi chỉ các dòng được tô màu.\n',s,flags=re.S)
guide.write_text(s,encoding='utf-8')
print('Updated slides 07–09, design spec and Vietnamese presenter guide.')
