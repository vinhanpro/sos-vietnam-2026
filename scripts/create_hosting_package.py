import os
import sys
import shutil
import zipfile
import json

sys.stdout.reconfigure(encoding='utf-8')

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESKTOP_DIR = r"C:\Users\dienv\Desktop"
TARGET_DIR_NAME = "sos_vietnam_2026_web_hosting"
TARGET_DIR = os.path.join(DESKTOP_DIR, TARGET_DIR_NAME)
TARGET_ZIP = os.path.join(DESKTOP_DIR, f"{TARGET_DIR_NAME}.zip")

# Files to copy at root
ROOT_FILES = [
    "index.html",
    "dispatcher.html",
    "heritage.html",
    "server.js",
    "sw.js",
    "manifest.json",
    "robots.txt",
    "package.json",
    "package-lock.json",
    "ecosystem.config.cjs",
    "Dockerfile",
    "docker-compose.yml",
    ".dockerignore",
    ".env.example",
    "HUONG_DAN_DEPLOY_HOSTING.md",
    "ARCHITECTURE.md",
    "sample_report.docx"
]

# Directories to copy
INCLUDE_DIRS = [
    "css",
    "js",
    "assets",
    "services",
    "vendor",
    "scripts",
    ".runtime-data",
    ".well-known"
]

def clean_ignore(directory, contents):
    ignored = []
    for item in contents:
        if item in ('__pycache__', '.git', '.tmp', 'node_modules', '.DS_Store', 'Thumbs.db'):
            ignored.append(item)
        elif item.endswith('.log') or item.endswith('.tmp'):
            ignored.append(item)
    return ignored

def main():
    print(f"=== TẠO BẢN NẠP HOSTING CHÍNH THỨC CHO SOS VIỆT NAM 2026 ===")
    print(f"Thư mục nguồn: {REPO_ROOT}")
    print(f"Thư mục đích Desktop: {TARGET_DIR}")

    # 1. Clean previous destination if exists
    if os.path.exists(TARGET_DIR):
        print("Xóa bản build cũ trên Desktop...")
        shutil.rmtree(TARGET_DIR)
    os.makedirs(TARGET_DIR, exist_ok=True)

    # 2. Copy root files
    print("\n1. Sao chép các tệp tin hệ thống cốt lõi...")
    for f_name in ROOT_FILES:
        src = os.path.join(REPO_ROOT, f_name)
        if os.path.exists(src):
            dst = os.path.join(TARGET_DIR, f_name)
            shutil.copy2(src, dst)
            print(f"  ✓ {f_name}")
        else:
            print(f"  - Bỏ qua (không tìm thấy): {f_name}")

    # 3. Copy directories
    print("\n2. Sao chép các thư mục chức năng...")
    for d_name in INCLUDE_DIRS:
        src = os.path.join(REPO_ROOT, d_name)
        if os.path.exists(src):
            dst = os.path.join(TARGET_DIR, d_name)
            shutil.copytree(src, dst, ignore=clean_ignore)
            count = sum(len(files) for _, _, files in os.walk(dst))
            print(f"  ✓ {d_name}/ ({count} tệp tin)")

    # 4. Clean runtime locks and bans
    runtime_data_dst = os.path.join(TARGET_DIR, ".runtime-data")
    if os.path.exists(runtime_data_dst):
        lockouts_file = os.path.join(runtime_data_dst, "login-lockouts.json")
        with open(lockouts_file, "w", encoding="utf-8") as f:
            f.write("{}")
        banned_file = os.path.join(runtime_data_dst, "banned-ips.json")
        with open(banned_file, "w", encoding="utf-8") as f:
            f.write("[]")
        print("  ✓ Đã làm sạch nhật ký khóa IP và danh sách chặn tạm thời (.runtime-data)")

    # 5. Create helper start scripts
    start_bat = os.path.join(TARGET_DIR, "start.bat")
    with open(start_bat, "w", encoding="utf-8") as f:
        f.write("@echo off\r\ntitle SOS Viet Nam 2026 - Production Server\r\necho ========================================================\r\necho  HE THONG SOS VIET NAM 2026 - SAN SANG CHAY TREN HOSTING\r\necho  Khoi dong Server Node.js tren cong 3000...\r\necho ========================================================\r\nnode server.js\r\npause\r\n")
    print("  ✓ Tạo file start.bat (Khởi chạy 1-click trên Windows/VPS)")

    start_sh = os.path.join(TARGET_DIR, "start.sh")
    with open(start_sh, "w", encoding="utf-8", newline="\n") as f:
        f.write("#!/bin/bash\necho '========================================================'\necho ' HE THONG SOS VIET NAM 2026 - SAN SANG CHAY TREN HOSTING'\necho ' Khoi dong Server Node.js tren cong 3000...'\necho '========================================================'\nnode server.js\n")
    print("  ✓ Tạo file start.sh (Khởi chạy trên Linux VPS/Cloud)")

    # 6. Create Zip Archive on Desktop for easy upload
    print(f"\n3. Đóng gói tệp nén ZIP để tiện upload lên Hosting: {TARGET_ZIP}...")
    if os.path.exists(TARGET_ZIP):
        os.remove(TARGET_ZIP)

    with zipfile.ZipFile(TARGET_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(TARGET_DIR):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, TARGET_DIR)
                zf.write(abs_path, arcname=os.path.join(TARGET_DIR_NAME, rel_path))

    zip_size_mb = os.path.getsize(TARGET_ZIP) / (1024 * 1024)
    print(f"  ✓ Đã tạo tệp ZIP thành công: {zip_size_mb:.2f} MB")

    total_files = sum(len(files) for _, _, files in os.walk(TARGET_DIR))
    print(f"\n=== HOÀN TẤT XUẤT BẢN THƯ MỤC WEB HOSTING ===")
    print(f"1. Thư mục giải nén: {TARGET_DIR} ({total_files} tệp tin)")
    print(f"2. Tệp nén sẵn: {TARGET_ZIP} ({zip_size_mb:.2f} MB)")
    print(f"Anh có thể upload file zip này lên hosting (cPanel, VPS, Render) hoặc giải nén dùng ngay!")

if __name__ == "__main__":
    main()
