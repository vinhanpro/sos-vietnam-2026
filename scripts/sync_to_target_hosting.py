# -*- coding: utf-8 -*-
import shutil
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

src_root = r"D:\DOWNLOAD\sos_vietnam_2026_responsive_2026-09-02\webapp"
dst_root = r"D:\DOWNLOAD\sos-vietnam-webapp\SOS_VIETNAM_2026_WEB_HOSTING"

print(f"=== ĐỒNG BỘ NÂNG CẤP VÀ MỞ KHÓA CHO: {dst_root} ===")

# 1. Update server.js
shutil.copy2(os.path.join(src_root, 'server.js'), os.path.join(dst_root, 'server.js'))
print("✓ Đã cập nhật server.js (hỗ trợ cả mật khẩu 'Admin' và 'admin', miễn trừ khóa IP loopback)")

# 2. Update css/tactical-responsive.css
shutil.copy2(os.path.join(src_root, 'css', 'tactical-responsive.css'), os.path.join(dst_root, 'css', 'tactical-responsive.css'))
print("✓ Đã cập nhật css/tactical-responsive.css (bản đồ rộng, không bị co hẹp)")

# 3. Update scripts
os.makedirs(os.path.join(dst_root, 'scripts'), exist_ok=True)
for s in ['generate_verification_record_docx.py', 'generate_report_docx.py', 'generate_accounts_excel.py', 'import_accounts_excel.py', 'generate_history_excel.py', 'reset-agency-default-passwords.mjs', 'migrate-runtime-data.cjs']:
    s_path = os.path.join(src_root, 'scripts', s)
    if os.path.exists(s_path):
        shutil.copy2(s_path, os.path.join(dst_root, 'scripts', s))
print("✓ Đã cập nhật scripts/ (Biên bản xác minh chuẩn không ngắt dòng)")

# 4. Update assets/agency-accounts.json
shutil.copy2(os.path.join(src_root, 'assets', 'agency-accounts.json'), os.path.join(dst_root, 'assets', 'agency-accounts.json'))
print("✓ Đã cập nhật assets/agency-accounts.json")

# 5. Clear login-lockouts.json and banned-ips.json in dst_root/.runtime-data
runtime_dir = os.path.join(dst_root, '.runtime-data')
os.makedirs(runtime_dir, exist_ok=True)

# Copy all encrypted runtime-data files
for f in os.listdir(os.path.join(src_root, '.runtime-data')):
    if f.endswith('.json'):
        shutil.copy2(os.path.join(src_root, '.runtime-data', f), os.path.join(runtime_dir, f))

# Force reset lockouts and bans
with open(os.path.join(runtime_dir, 'login-lockouts.json'), 'w', encoding='utf-8') as f:
    f.write('{}')
with open(os.path.join(runtime_dir, 'banned-ips.json'), 'w', encoding='utf-8') as f:
    f.write('[]')
print("✓ Đã xóa sạch danh sách khóa IP và mở khóa 100% trong .runtime-data")

# 6. Create start.bat and start.sh for user convenience
start_bat = os.path.join(dst_root, "start.bat")
with open(start_bat, "w", encoding="utf-8") as f:
    f.write("@echo off\r\ntitle SOS Viet Nam 2026 - Production Server\r\necho ========================================================\r\necho  HE THONG SOS VIET NAM 2026 - SAN SANG CHAY TREN HOSTING\r\necho  Khoi dong Server Node.js tren cong 3000...\r\necho ========================================================\r\nnode server.js\r\npause\r\n")

start_sh = os.path.join(dst_root, "start.sh")
with open(start_sh, "w", encoding="utf-8", newline="\n") as f:
    f.write("#!/bin/bash\necho '========================================================'\necho ' HE THONG SOS VIET NAM 2026 - SAN SANG CHAY TREN HOSTING'\necho ' Khoi dong Server Node.js tren cong 3000...'\necho '========================================================'\nnode server.js\n")

print("✓ Đã tạo start.bat và start.sh")
print("=== ĐỒNG BỘ HOÀN TẤT THÀNH CÔNG CHO THƯ MỤC HOSTING ===")
