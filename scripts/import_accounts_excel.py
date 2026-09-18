# -*- coding: utf-8 -*-
"""
Script: import_accounts_excel.py
Mục đích: Đọc và nhập danh bạ tài khoản & mật khẩu từ file Excel (.xlsx) vào hệ thống
Hỗ trợ đọc đa Sheet:
  - Sheet 1: Công An & CAND
  - Sheet 2: Cấp Cứu Y Tế
  - Sheet 3: Cứu Hộ Doanh Nghiệp
Cung cấp tự động:
  - Tự động sinh tên đăng nhập (username) nếu để trống
  - Tự động gán tọa độ địa lý chuẩn xác theo 34 Tỉnh/Thành phố
  - Băm mật khẩu bảo mật chuẩn PBKDF2-SHA512 đồng bộ với server
"""

import sys
import json
import os
import re
import unicodedata
import hashlib
import openpyxl

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

PROVINCE_CENTERS = {
    'Đồng Nai': (10.8492, 106.9376),
    'Cần Thơ': (10.033333, 105.783333),
    'TP. Hồ Chí Minh': (10.7769, 106.7009),
    'Hồ Chí Minh': (10.7769, 106.7009),
    'Hà Nội': (21.0285, 105.8542),
    'Đà Nẵng': (16.0544, 108.2022),
    'Hải Phòng': (20.8449, 106.6881),
    'Huế': (16.4637, 107.5909),
    'Bình Dương': (11.1604, 106.6570),
    'Bà Rịa - Vũng Tàu': (10.5417, 107.2429),
    'Long An': (10.6954, 106.2431),
    'Tiền Giang': (10.4447, 106.3414),
    'Bến Tre': (10.2433, 106.3756),
    'Đồng Tháp': (10.4938, 105.6882),
    'Vĩnh Long': (10.2537, 105.9722),
    'An Giang': (10.5216, 105.1259),
    'Kiên Giang': (9.9567, 105.1524),
    'Cà Mau': (9.1768, 105.1501),
    'Sóc Trăng': (9.6037, 105.9800),
    'Trà Vinh': (9.9347, 106.3455),
    'Hậu Giang': (9.7844, 105.4701),
    'Bạc Liêu': (9.2941, 105.7278),
    'Tây Ninh': (11.3351, 106.1099),
    'Bình Phước': (11.7512, 106.9044),
    'Lâm Đồng': (11.9404, 108.4583),
    'Đắk Lắk': (12.6667, 108.0500),
    'Đắk Nông': (12.0041, 107.6875),
    'Gia Lai': (13.9833, 108.0000),
    'Kon Tum': (14.3497, 107.9791),
    'Khánh Hòa': (12.2388, 109.1967),
    'Ninh Thuận': (11.5653, 108.9882),
    'Bình Thuận': (10.9804, 108.2022),
    'Phú Yên': (13.0882, 109.3134),
    'Bình Định': (14.1667, 108.9000),
    'Quảng Ngãi': (15.1205, 108.7923),
    'Quảng Nam': (15.5647, 108.0195),
    'Quảng Trị': (16.7500, 107.1857),
    'Quảng Bình': (17.5000, 106.3333),
    'Hà Tĩnh': (18.3333, 105.9000),
    'Nghệ An': (19.3333, 104.8333),
    'Thanh Hóa': (19.8000, 105.7667)
}

def remove_accents(input_str):
    if not input_str:
        return ''
    s = unicodedata.normalize('NFD', str(input_str))
    s = re.sub(r'[\u0300-\u036f]', '', s)
    s = s.replace('đ', 'd').replace('Đ', 'D')
    return s

def make_pwd_hash(password, salt=None):
    if not salt:
        salt = os.urandom(16).hex()
    dk = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), bytes.fromhex(salt), 100000)
    return {
        'hash': dk.hex(),
        'salt': salt,
        'iterations': 100000,
        'digest': 'sha512'
    }

def normalize_text(val):
    if val is None:
        return ''
    return str(val).strip()

def map_agency_code(agency_str, unit_name='', sheet_title=''):
    s = (normalize_text(agency_str) + ' ' + normalize_text(unit_name) + ' ' + normalize_text(sheet_title)).lower()
    if 'csgt' in s or 'giao thông' in s or 'pc08' in s:
        return 'csgt'
    elif 'pccc' in s or 'cứu hỏa' in s or 'chữa cháy' in s or 'pc07' in s:
        return 'fire'
    elif 'cấp cứu' in s or '115' in s or 'y tế' in s or 'bệnh viện' in s or 'ttyt' in s or 'trung tâm y tế' in s:
        return 'hospital'
    elif 'cứu hộ' in s or 'kéo xe' in s or 'garage' in s or 'gara' in s or 'doanh nghiệp' in s:
        return 'traffic-rescue'
    elif 'quốc gia' in s or 'tổng hợp' in s or 'trung ương' in s:
        return 'police'
    else:
        return 'police'

def map_level_code(level_str, username='', agency_code=''):
    s = normalize_text(level_str).lower()
    u = normalize_text(username).lower()
    if u == 'admin' or 'trung ương' in s or 'quốc gia' in s:
        return 'national'
    elif agency_code == 'traffic-rescue' or 'doanh nghiệp' in s:
        return 'enterprise'
    elif 'tỉnh' in s or 'thành phố' in s or 'phòng' in s or 'pc08' in s or 'pc07' in s:
        return 'province'
    elif 'xã' in s or 'phường' in s or 'thị trấn' in s or 'huyện' in s:
        return 'ward'
    return 'province' if agency_code in ['csgt', 'hospital'] else 'ward'

def generate_fallback_username(agency_code, unit_name, ward, province):
    prefix = 'ca'
    if agency_code == 'csgt':
        prefix = 'csgt'
    elif agency_code == 'fire':
        prefix = 'pccc'
    elif agency_code == 'hospital':
        prefix = 'hosp'
    elif agency_code == 'traffic-rescue':
        prefix = 'cuuho'

    key_part = ward or unit_name or province
    cleaned = remove_accents(key_part).lower()
    cleaned = re.sub(r'[^a-z0-9]', '', cleaned)
    cleaned = cleaned.replace('congan', '').replace('phuong', 'p').replace('xa', 'x').replace('thitran', 'tt')
    
    prov_short = remove_accents(province).lower()
    prov_short = re.sub(r'[^a-z0-9]', '', prov_short)[:4]
    
    username = f"{prefix}{cleaned[:8]}{prov_short}".strip()
    return username or f"{prefix}_{os.urandom(3).hex()}"

def get_province_coords(province):
    for prov_key, coords in PROVINCE_CENTERS.items():
        if prov_key.lower() in province.lower() or province.lower() in prov_key.lower():
            return coords
    return (10.033333, 105.783333)

def parse_accounts_excel(excel_path, current_accounts_json_path, output_json_path):
    existing_accounts = {}
    if os.path.exists(current_accounts_json_path):
        try:
            with open(current_accounts_json_path, 'r', encoding='utf-8') as f:
                existing_accounts = json.load(f)
        except Exception as e:
            print(f"Warning loading existing accounts: {e}", file=sys.stderr)

    wb = openpyxl.load_workbook(excel_path, data_only=True)
    imported_count = 0
    updated_count = 0
    created_count = 0
    new_units_list = []

    for ws in wb.worksheets:
        sheet_title = ws.title
        # Locate Header Row
        header_col_map = {}
        header_row_idx = None

        for row_idx in range(1, 15):
            row_vals = [normalize_text(cell.value).lower() for cell in ws[row_idx]]
            if any('tên đăng nhập' in v or 'username' in v or 'mã tài khoản' in v or 'tên cơ quan' in v for v in row_vals):
                header_row_idx = row_idx
                for col_idx, cell in enumerate(ws[row_idx], start=1):
                    val = normalize_text(cell.value).lower()
                    if 'stt' in val:
                        header_col_map['stt'] = col_idx
                    elif 'thêm tài khoản' in val or 'thao tác' in val or 'action' in val or 'thêm mới' in val:
                        header_col_map['action'] = col_idx
                    elif 'khu vực' in val or 'tỉnh' in val:
                        header_col_map['province'] = col_idx
                    elif 'lực lượng' in val or 'nghiệp vụ' in val:
                        header_col_map['agency'] = col_idx
                    elif 'cấp hành chính' in val or 'cấp đơn vị' in val:
                        header_col_map['level'] = col_idx
                    elif 'tên cơ quan' in val or 'đơn vị' in val:
                        header_col_map['agencyName'] = col_idx
                    elif 'địa bàn' in val or 'xã' in val or 'phường' in val:
                        header_col_map['ward'] = col_idx
                    elif 'tên đăng nhập' in val or 'username' in val:
                        header_col_map['username'] = col_idx
                    elif 'mật khẩu' in val or 'password' in val:
                        header_col_map['password'] = col_idx
                    elif 'cán bộ' in val or 'họ tên' in val:
                        header_col_map['officerName'] = col_idx
                    elif 'chức vụ' in val or 'cấp bậc' in val:
                        header_col_map['officerRank'] = col_idx
                    elif 'sđt' in val or 'điện thoại' in val or 'phone' in val:
                        header_col_map['officerPhone'] = col_idx
                    elif 'sms' in val:
                        header_col_map['officerSms'] = col_idx
                break

        if not header_row_idx or 'username' not in header_col_map:
            header_row_idx = 5
            header_col_map = {
                'stt': 1,
                'action': 2,
                'province': 3,
                'agency': 4,
                'level': 5,
                'agencyName': 6,
                'ward': 7,
                'username': 8,
                'password': 9,
                'officerName': 10,
                'officerRank': 11,
                'officerPhone': 12,
                'officerSms': 13
            }

        current_province = 'Cần Thơ'

        for row_idx in range(header_row_idx + 1, ws.max_row + 1):
            row = ws[row_idx]
            first_cell_val = normalize_text(row[0].value) if len(row) > 0 else ''
            if 'khu vực:' in first_cell_val.lower() or 'cấp trung ương' in first_cell_val.lower():
                if 'khu vực:' in first_cell_val.lower():
                    parts = first_cell_val.split('KHU VỰC:')
                    if len(parts) > 1:
                        prov_extracted = parts[1].strip().replace('TP.', '').replace('TỈNH', '').replace('Thành phố', '').strip().title()
                        if prov_extracted:
                            current_province = prov_extracted
                continue

            if 'khu vực thêm tài khoản' in first_cell_val.lower():
                continue

            # Read columns
            raw_action = normalize_text(row[header_col_map['action'] - 1].value) if 'action' in header_col_map and len(row) >= header_col_map['action'] else ''
            raw_username = normalize_text(row[header_col_map['username'] - 1].value) if 'username' in header_col_map and len(row) >= header_col_map['username'] else ''
            raw_prov = normalize_text(row[header_col_map['province'] - 1].value) if 'province' in header_col_map and len(row) >= header_col_map['province'] else ''
            raw_name = normalize_text(row[header_col_map['agencyName'] - 1].value) if 'agencyName' in header_col_map and len(row) >= header_col_map['agencyName'] else ''

            if not raw_username and not raw_name:
                continue
            if raw_username.lower().startswith('tên đăng') or raw_name.lower().startswith('tên cơ quan'):
                continue
            # Skip template guidance placeholders
            if raw_name.startswith('[') or raw_prov.startswith('[') or 'dòng mẫu' in raw_name.lower() or 'mẫu mới' in raw_name.lower() and not raw_username:
                continue

            province = raw_prov if raw_prov and raw_prov != 'Toàn Quốc' else current_province
            raw_agency = normalize_text(row[header_col_map['agency'] - 1].value) if 'agency' in header_col_map and len(row) >= header_col_map['agency'] else ''
            raw_level = normalize_text(row[header_col_map['level'] - 1].value) if 'level' in header_col_map and len(row) >= header_col_map['level'] else ''
            raw_ward = normalize_text(row[header_col_map['ward'] - 1].value) if 'ward' in header_col_map and len(row) >= header_col_map['ward'] else ''
            raw_officer = normalize_text(row[header_col_map['officerName'] - 1].value) if 'officerName' in header_col_map and len(row) >= header_col_map['officerName'] else ''
            raw_rank = normalize_text(row[header_col_map['officerRank'] - 1].value) if 'officerRank' in header_col_map and len(row) >= header_col_map['officerRank'] else ''
            raw_phone = normalize_text(row[header_col_map['officerPhone'] - 1].value) if 'officerPhone' in header_col_map and len(row) >= header_col_map['officerPhone'] else ''
            raw_sms = normalize_text(row[header_col_map['officerSms'] - 1].value) if 'officerSms' in header_col_map and len(row) >= header_col_map['officerSms'] else '0988 113 113'

            agency_code = map_agency_code(raw_agency, raw_name, sheet_title)
            level_code = map_level_code(raw_level, raw_username, agency_code)

            if not raw_username:
                username = generate_fallback_username(agency_code, raw_name, raw_ward, province)
            else:
                username = raw_username.lower().strip()

            default_pwd = 'Congan@113'
            if agency_code == 'csgt': default_pwd = 'Csgt@113'
            elif agency_code == 'fire': default_pwd = 'Pccc@114'
            elif agency_code == 'hospital': default_pwd = 'Capcuu@115'
            elif agency_code == 'traffic-rescue': default_pwd = 'Cuuhoxe@113'

            raw_password = normalize_text(row[header_col_map['password'] - 1].value) if 'password' in header_col_map and len(row) >= header_col_map['password'] else default_pwd
            password = raw_password if raw_password else default_pwd

            existing = existing_accounts.get(username, {})
            agency_name = raw_name or existing.get('agencyName') or f"Đơn Vị {username.upper()}"
            officer_rank = raw_rank or existing.get('officerRank') or ('Đại úy' if agency_code == 'police' else ('Bác sĩ' if agency_code == 'hospital' else 'Chuyên viên'))
            officer_name = raw_officer or existing.get('officerName') or 'Cán Bộ Trực Ban'
            officer_phone = raw_phone or existing.get('officerPhone') or ('0251 38' if 'đồng nai' in province.lower() else '0292 3899 113')
            officer_sms = raw_sms or existing.get('officerSms') or '0988 113 113'

            badge_icon = existing.get('badgeIcon')
            if not badge_icon:
                badge_icon = '👮‍♂️' if agency_code == 'police' else ('🚗' if agency_code == 'csgt' else ('🚒' if agency_code == 'fire' else ('🚑' if agency_code == 'hospital' else '🛠️')))

            theme = existing.get('theme')
            if not theme:
                theme = 'theme-police' if agency_code == 'police' else ('theme-csgt' if agency_code == 'csgt' else ('theme-rescue' if agency_code == 'fire' else ('theme-hospital' if agency_code == 'hospital' else 'theme-rescue')))

            # Smart Coordinates Fallback
            coords = get_province_coords(province)
            lat = existing.get('lat') if existing.get('lat') is not None else coords[0]
            lng = existing.get('lng') if existing.get('lng') is not None else coords[1]

            account_obj = {
                'username': username,
                'initialPassword': password,
                'passwordHash': make_pwd_hash(password),
                'agency': agency_code,
                'level': level_code,
                'agencyName': agency_name,
                'unitName': agency_name,
                'province': province or 'Cần Thơ',
                'ward': '' if agency_code == 'traffic-rescue' else (raw_ward or existing.get('ward') or ''),
                'address': existing.get('address') or f"Trụ sở {agency_name}",
                'lat': lat,
                'lng': lng,
                'officerRank': officer_rank,
                'officerName': officer_name,
                'officerTitle': f"{officer_rank} {officer_name} (Trực ban {agency_name})",
                'officerPhone': officer_phone,
                'officerSms': officer_sms,
                'officerEmail': existing.get('officerEmail') or f"{username}@sos.gov.vn",
                'badgeIcon': badge_icon,
                'theme': theme
            }

            if username in existing_accounts:
                updated_count += 1
            else:
                created_count += 1
                new_units_list.append(f"{agency_name} ({province})")

            existing_accounts[username] = account_obj
            imported_count += 1

    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(existing_accounts, f, ensure_ascii=False, indent=2)

    result = {
        'ok': True,
        'total': imported_count,
        'created': created_count,
        'updated': updated_count,
        'accountsCount': len(existing_accounts),
        'newUnits': new_units_list[:10]
    }
    print(json.dumps(result, ensure_ascii=False))

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: python import_accounts_excel.py <excel_path> <current_json_path> <output_json_path>")
        sys.exit(1)
    parse_accounts_excel(sys.argv[1], sys.argv[2], sys.argv[3])
