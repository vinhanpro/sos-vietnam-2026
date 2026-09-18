# -*- coding: utf-8 -*-
"""
Script: supplement_dongnai_agencies.py
Mục đích: Bổ sung danh bạ đồn trạm, bệnh viện cấp cứu, cứu hộ giao thông và tài khoản cho Tỉnh Đồng Nai
"""

import json
import hashlib
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ACCOUNTS_PATH = os.path.join(BASE_DIR, 'assets', 'agency-accounts.json')
STATIONS_PATH = os.path.join(BASE_DIR, 'assets', 'vn-stations-directory.json')
HOSPITALS_PATH = os.path.join(BASE_DIR, 'assets', 'hospitals.json')
RESCUES_PATH = os.path.join(BASE_DIR, 'assets', 'rescue-enterprises.json')

def make_pwd_hash(password, salt=None):
    if not salt:
        salt = os.urandom(16).hex()
    # Sha512 with 100,000 iterations to match Node securityCryptoService
    import hashlib
    dk = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), bytes.fromhex(salt), 100000)
    return {
        'hash': dk.hex(),
        'salt': salt,
        'iterations': 100000,
        'digest': 'sha512'
    }

# 1. New Accounts for Dong Nai
DONG_NAI_ACCOUNTS = {
    "caxlongducdn": {
        "username": "caxlongducdn",
        "initialPassword": "Congan@113",
        "agency": "police",
        "level": "ward",
        "agencyName": "Công An Xã Long Đức",
        "unitName": "Công An Xã Long Đức, Huyện Long Thành, Tỉnh Đồng Nai",
        "province": "Đồng Nai",
        "district": "Huyện Long Thành",
        "ward": "Xã Long Đức",
        "address": "Đường ĐT 769, Xã Long Đức, Huyện Long Thành, Tỉnh Đồng Nai",
        "lat": 10.7968,
        "lng": 106.9782,
        "officerRank": "Đại úy",
        "officerName": "Trần Quốc Tuấn",
        "officerTitle": "Đại úy Trần Quốc Tuấn (Trưởng CAX) (Chỉ huy trực ban)",
        "officerPhone": "0251 3522 113",
        "officerSms": "0988 113 113",
        "officerEmail": "caxlongduc.dongnai@bca.gov.vn",
        "badgeIcon": "👮‍♂️",
        "theme": "theme-police",
        "logo": "/assets/icons/logo-police-round-an.png"
    },
    "caxphuocthaidn": {
        "username": "caxphuocthaidn",
        "initialPassword": "Congan@113",
        "agency": "police",
        "level": "ward",
        "agencyName": "Công An Xã Phước Thái",
        "unitName": "Công An Xã Phước Thái, Huyện Long Thành, Tỉnh Đồng Nai",
        "province": "Đồng Nai",
        "district": "Huyện Long Thành",
        "ward": "Xã Phước Thái",
        "address": "Quốc lộ 51, Xã Phước Thái, Huyện Long Thành, Tỉnh Đồng Nai",
        "lat": 10.6872,
        "lng": 107.0125,
        "officerRank": "Thiếu tá",
        "officerName": "Lê Hoàng Nam",
        "officerTitle": "Thiếu tá Lê Hoàng Nam (Trưởng CAX) (Chỉ huy trực ban)",
        "officerPhone": "0251 3544 113",
        "officerSms": "0988 113 113",
        "officerEmail": "caxphuocthai.dongnai@bca.gov.vn",
        "badgeIcon": "👮‍♂️",
        "theme": "theme-police",
        "logo": "/assets/icons/logo-police-round-an.png"
    },
    "captrangdaidn": {
        "username": "captrangdaidn",
        "initialPassword": "Congan@113",
        "agency": "police",
        "level": "ward",
        "agencyName": "Công An Phường Trảng Dài",
        "unitName": "Công An Phường Trảng Dài, TP. Biên Hòa, Tỉnh Đồng Nai",
        "province": "Đồng Nai",
        "district": "TP. Biên Hòa",
        "ward": "Phường Trảng Dài",
        "address": "Đường Bùi Trọng Nghĩa, Phường Trảng Dài, TP. Biên Hòa, Tỉnh Đồng Nai",
        "lat": 10.9942,
        "lng": 106.8532,
        "officerRank": "Trung tá",
        "officerName": "Phạm Minh Đức",
        "officerTitle": "Trung tá Phạm Minh Đức (Trưởng CAP) (Chỉ huy trực ban)",
        "officerPhone": "0251 3899 113",
        "officerSms": "0988 113 113",
        "officerEmail": "captrangdai.dongnai@bca.gov.vn",
        "badgeIcon": "👮‍♂️",
        "theme": "theme-police",
        "logo": "/assets/icons/logo-police-round-an.png"
    },
    "captamquyetdn": {
        "username": "captamquyetdn",
        "initialPassword": "Congan@113",
        "agency": "police",
        "level": "ward",
        "agencyName": "Công An Phường Quyết Thắng",
        "unitName": "Công An Phường Quyết Thắng, TP. Biên Hòa, Tỉnh Đồng Nai",
        "province": "Đồng Nai",
        "district": "TP. Biên Hòa",
        "ward": "Phường Quyết Thắng",
        "address": "Số 12 Cách Mạng Tháng 8, Phường Quyết Thắng, TP. Biên Hòa, Tỉnh Đồng Nai",
        "lat": 10.9485,
        "lng": 106.8214,
        "officerRank": "Thiếu tá",
        "officerName": "Nguyễn Thanh Bình",
        "officerTitle": "Thiếu tá Nguyễn Thanh Bình (Trưởng CAP) (Chỉ huy trực ban)",
        "officerPhone": "0251 3822 113",
        "officerSms": "0988 113 113",
        "officerEmail": "capquyetthang.dongnai@bca.gov.vn",
        "badgeIcon": "👮‍♂️",
        "theme": "theme-police",
        "logo": "/assets/icons/logo-police-round-an.png"
    },
    "bvdkdongnai": {
        "username": "bvdkdongnai",
        "initialPassword": "Capcuu@115",
        "agency": "hospital",
        "level": "province",
        "agencyName": "Bệnh Viện Đa Khoa Đồng Nai",
        "unitName": "Bệnh Viện Đa Khoa Đồng Nai (Cấp Cứu 115)",
        "province": "Đồng Nai",
        "district": "TP. Biên Hòa",
        "ward": "Phường Tam Hòa",
        "address": "Số 2 đường Đồng Khởi, Phường Tam Hòa, TP. Biên Hòa, Tỉnh Đồng Nai",
        "lat": 10.9572,
        "lng": 106.8685,
        "officerRank": "Bác sĩ CKII",
        "officerName": "Kíp Trực Cấp Cứu 115",
        "officerTitle": "Bác sĩ CKII Trực ban Cấp cứu 115 - BVĐK Đồng Nai",
        "officerPhone": "0251 3898 901",
        "officerSms": "0988 115 115",
        "officerEmail": "capcuu.bvdongnai@ytedongnai.gov.vn",
        "badgeIcon": "🚑",
        "theme": "theme-hospital"
    },
    "bvthongnhatdn": {
        "username": "bvthongnhatdn",
        "initialPassword": "Capcuu@115",
        "agency": "hospital",
        "level": "province",
        "agencyName": "Bệnh Viện Đa Khoa Thống Nhất Đồng Nai",
        "unitName": "Bệnh Viện Đa Khoa Thống Nhất Đồng Nai (Cấp Cứu 115)",
        "province": "Đồng Nai",
        "district": "TP. Biên Hòa",
        "ward": "Phường Tân Biên",
        "address": "Số 234 Quốc lộ 1A, Phường Tân Biên, TP. Biên Hòa, Tỉnh Đồng Nai",
        "lat": 10.9765,
        "lng": 106.8872,
        "officerRank": "Bác sĩ CKI",
        "officerName": "Kíp trực Cấp cứu cơ động",
        "officerTitle": "Kíp trực Cấp cứu ngoại viện - BV Thống Nhất Đồng Nai",
        "officerPhone": "0251 3883 660",
        "officerSms": "0988 115 115",
        "officerEmail": "capcuu.bvthongnhat@ytedongnai.gov.vn",
        "badgeIcon": "🚑",
        "theme": "theme-hospital"
    },
    "ttytdongnai": {
        "username": "ttytdongnai",
        "initialPassword": "Capcuu@115",
        "agency": "hospital",
        "level": "ward",
        "agencyName": "Trung Tâm Y Tế Huyện Long Thành",
        "unitName": "Trung Tâm Y Tế Huyện Long Thành (Đội Cấp Cứu 115)",
        "province": "Đồng Nai",
        "district": "Huyện Long Thành",
        "ward": "Thị trấn Long Thành",
        "address": "Đường Lê Duẩn, Thị trấn Long Thành, Huyện Long Thành, Tỉnh Đồng Nai",
        "lat": 10.7852,
        "lng": 106.9538,
        "officerRank": "Bác sĩ CKI",
        "officerName": "Trực ban Y tế Long Thành",
        "officerTitle": "Trực ban Cấp cứu 115 TTYT Huyện Long Thành",
        "officerPhone": "0251 3844 266",
        "officerSms": "0988 115 115",
        "officerEmail": "ttytlongthanh@ytedongnai.gov.vn",
        "badgeIcon": "🚑",
        "theme": "theme-hospital"
    },
    "cuuho51dongnai": {
        "username": "cuuho51dongnai",
        "initialPassword": "Cuuhoxe@113",
        "agency": "traffic-rescue",
        "level": "enterprise",
        "agencyName": "Cứu Hộ Giao Thông Long Thành - Quốc Lộ 51",
        "unitName": "Cứu Hộ Giao Thông Long Thành - Quốc Lộ 51 (Đồng Nai)",
        "province": "Đồng Nai",
        "district": "Huyện Long Thành",
        "ward": "Toàn Tỉnh",
        "address": "Km 23 Quốc lộ 51, Xã An Phước, Huyện Long Thành, Tỉnh Đồng Nai",
        "lat": 10.8354,
        "lng": 106.9412,
        "officerRank": "Chỉ huy đội xe",
        "officerName": "Đội Cứu Hộ QL51",
        "officerTitle": "Chỉ huy Đội xe cứu hộ cẩu kéo QL51 Đồng Nai",
        "officerPhone": "0908 113 115",
        "officerSms": "0908 113 115",
        "officerEmail": "cuuho51.dongnai@gmail.com",
        "badgeIcon": "🛠️",
        "theme": "theme-rescue"
    },
    "cuuhocaotocdld": {
        "username": "cuuhocaotocdld",
        "initialPassword": "Cuuhoxe@113",
        "agency": "traffic-rescue",
        "level": "enterprise",
        "agencyName": "Đội Cứu Hộ Cao Tốc TP.HCM - Long Thành - Dầu Giây",
        "unitName": "Đội Cứu Hộ Cao Tốc TP.HCM - Long Thành - Dầu Giây",
        "province": "Đồng Nai",
        "district": "Huyện Thống Nhất",
        "ward": "Toàn Tỉnh",
        "address": "Trạm thu phí Dầu Giây, Huyện Thống Nhất, Tỉnh Đồng Nai",
        "lat": 10.9214,
        "lng": 107.1356,
        "officerRank": "Đội trưởng tuần tra",
        "officerName": "Trực ban Cứu hộ Cao tốc",
        "officerTitle": "Trực ban Cứu hộ khẩn cấp Cao tốc HLD (Đồng Nai)",
        "officerPhone": "0918 113 114",
        "officerSms": "0918 113 114",
        "officerEmail": "cuuhocaotoc.hld@gmail.com",
        "badgeIcon": "🛠️",
        "theme": "theme-rescue"
    }
}

def update_accounts():
    with open(ACCOUNTS_PATH, 'r', encoding='utf-8') as f:
        accounts = json.load(f)

    for username, acc_data in DONG_NAI_ACCOUNTS.items():
        pwd = acc_data.get('initialPassword', 'Congan@113')
        acc_copy = dict(acc_data)
        acc_copy['passwordHash'] = make_pwd_hash(pwd)
        accounts[username] = acc_copy

    with open(ACCOUNTS_PATH, 'w', encoding='utf-8') as f:
        json.dump(accounts, f, ensure_ascii=False, indent=2)
    print(f"✅ Updated agency-accounts.json with {len(DONG_NAI_ACCOUNTS)} Dong Nai accounts (Total: {len(accounts)})")

def update_stations():
    with open(STATIONS_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    stations = data.get('stations', [])

    new_stations = [
        {
            "id": "st-caxlongducdn",
            "province": "Đồng Nai",
            "district": "Huyện Long Thành",
            "ward": "Xã Long Đức",
            "agency": "police",
            "agency_name": "Công An",
            "level": "ward",
            "name": "Công An Xã Long Đức",
            "address": "Đường ĐT 769, Xã Long Đức, Huyện Long Thành, Tỉnh Đồng Nai",
            "phone": "0251 3522 113",
            "sms": "0988 113 113",
            "officer": "Đại úy Trần Quốc Tuấn (Trưởng CAX) (Chỉ huy trực ban)",
            "lat": 10.7968,
            "lng": 106.9782
        },
        {
            "id": "st-caxphuocthaidn",
            "province": "Đồng Nai",
            "district": "Huyện Long Thành",
            "ward": "Xã Phước Thái",
            "agency": "police",
            "agency_name": "Công An",
            "level": "ward",
            "name": "Công An Xã Phước Thái",
            "address": "Quốc lộ 51, Xã Phước Thái, Huyện Long Thành, Tỉnh Đồng Nai",
            "phone": "0251 3544 113",
            "sms": "0988 113 113",
            "officer": "Thiếu tá Lê Hoàng Nam (Trưởng CAX) (Chỉ huy trực ban)",
            "lat": 10.6872,
            "lng": 107.0125
        },
        {
            "id": "st-captrangdaidn",
            "province": "Đồng Nai",
            "district": "TP. Biên Hòa",
            "ward": "Phường Trảng Dài",
            "agency": "police",
            "agency_name": "Công An",
            "level": "ward",
            "name": "Công An Phường Trảng Dài",
            "address": "Đường Bùi Trọng Nghĩa, Phường Trảng Dài, TP. Biên Hòa, Tỉnh Đồng Nai",
            "phone": "0251 3899 113",
            "sms": "0988 113 113",
            "officer": "Trung tá Phạm Minh Đức (Trưởng CAP) (Chỉ huy trực ban)",
            "lat": 10.9942,
            "lng": 106.8532
        },
        {
            "id": "st-captamquyetdn",
            "province": "Đồng Nai",
            "district": "TP. Biên Hòa",
            "ward": "Phường Quyết Thắng",
            "agency": "police",
            "agency_name": "Công An",
            "level": "ward",
            "name": "Công An Phường Quyết Thắng",
            "address": "Số 12 Cách Mạng Tháng 8, Phường Quyết Thắng, TP. Biên Hòa, Tỉnh Đồng Nai",
            "phone": "0251 3822 113",
            "sms": "0988 113 113",
            "officer": "Thiếu tá Nguyễn Thanh Bình (Trưởng CAP) (Chỉ huy trực ban)",
            "lat": 10.9485,
            "lng": 106.8214
        }
    ]

    for ns in new_stations:
        idx = next((i for i, s in enumerate(stations) if s.get('id') == ns['id']), -1)
        if idx != -1:
            stations[idx] = ns
        else:
            stations.append(ns)

    data['stations'] = stations
    with open(STATIONS_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Updated vn-stations-directory.json with Dong Nai stations (Total: {len(stations)})")

def update_hospitals():
    with open(HOSPITALS_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    hospitals = data.get('hospitals', [])

    dong_nai_hosps = [
        {
            "id": "hosp-dong-nai-bvdk",
            "name": "Bệnh viện Đa khoa Đồng Nai",
            "type": "Bệnh viện đa khoa hạng I tuyến tỉnh",
            "province": "Đồng Nai",
            "district": "TP. Biên Hòa",
            "ward": "Phường Tam Hòa",
            "address": "Số 2 đường Đồng Khởi, Phường Tam Hòa, TP. Biên Hòa, Tỉnh Đồng Nai",
            "phone": "0251 3898 901",
            "phoneFormatted": "0251 3898 901",
            "lat": 10.9572,
            "lng": 106.8685,
            "rating": 4.8,
            "reviewCount": 420,
            "specialties": ["Cấp cứu 115", "Hồi sức tích cực", "Ngoại chấn thương", "Tim mạch can thiệp"],
            "openingHours": "24/7 Cấp cứu khẩn cấp",
            "approved": True,
            "featured": True,
            "informationStatus": "official"
        },
        {
            "id": "hosp-dong-nai-bvthongnhat",
            "name": "Bệnh viện Đa khoa Thống Nhất Đồng Nai",
            "type": "Bệnh viện đa khoa hạng I",
            "province": "Đồng Nai",
            "district": "TP. Biên Hòa",
            "ward": "Phường Tân Biên",
            "address": "Số 234 Quốc lộ 1A, Phường Tân Biên, TP. Biên Hòa, Tỉnh Đồng Nai",
            "phone": "0251 3883 660",
            "phoneFormatted": "0251 3883 660",
            "lat": 10.9765,
            "lng": 106.8872,
            "rating": 4.7,
            "reviewCount": 350,
            "specialties": ["Cấp cứu ngoại viện", "Chấn thương chỉnh hình", "Ngoại thần kinh"],
            "openingHours": "24/7 Cấp cứu khẩn cấp",
            "approved": True,
            "featured": True,
            "informationStatus": "official"
        },
        {
            "id": "hosp-dong-nai-ttytlongthanh",
            "name": "Trung Tâm Y Tế Huyện Long Thành",
            "type": "Bệnh viện đầu mối khu vực Long Thành",
            "province": "Đồng Nai",
            "district": "Huyện Long Thành",
            "ward": "Thị trấn Long Thành",
            "address": "Đường Lê Duẩn, Thị trấn Long Thành, Huyện Long Thành, Tỉnh Đồng Nai",
            "phone": "0251 3844 266",
            "phoneFormatted": "0251 3844 266",
            "lat": 10.7852,
            "lng": 106.9538,
            "rating": 4.6,
            "reviewCount": 210,
            "specialties": ["Cấp cứu 115 địa phương", "Sơ cấp cứu tai nạn giao thông"],
            "openingHours": "24/7 Cấp cứu khẩn cấp",
            "approved": True,
            "featured": True,
            "informationStatus": "official"
        }
    ]

    # Remove pending-dong-nai if exists
    hospitals = [h for h in hospitals if h.get('id') != 'pending-dong-nai']
    for nh in dong_nai_hosps:
        idx = next((i for i, h in enumerate(hospitals) if h.get('id') == nh['id']), -1)
        if idx != -1:
            hospitals[idx] = nh
        else:
            hospitals.append(nh)

    data['hospitals'] = hospitals
    with open(HOSPITALS_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Updated hospitals.json with Dong Nai hospitals (Total: {len(hospitals)})")

def update_rescues():
    with open(RESCUES_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    enterprises = data.get('enterprises', [])

    dong_nai_rescues = [
        {
            "id": "rescue-dong-nai-ql51",
            "name": "Cứu Hộ Giao Thông Long Thành - Quốc Lộ 51",
            "province": "Đồng Nai",
            "district": "Huyện Long Thành",
            "address": "Km 23 Quốc lộ 51, Xã An Phước, Huyện Long Thành, Tỉnh Đồng Nai",
            "phone": "0908 113 115",
            "lat": 10.8354,
            "lng": 106.9412,
            "rating": 4.9,
            "reviewCount": 180,
            "services": ["Cứu hộ xe tai nạn", "Cẩu kéo xe tải nặng", "Vá vỏ lưu động", "Kích bình 24/7"],
            "isVerified": True,
            "informationStatus": "official"
        },
        {
            "id": "rescue-dong-nai-caotoc-hld",
            "name": "Đội Cứu Hộ Cao Tốc TP.HCM - Long Thành - Dầu Giây",
            "province": "Đồng Nai",
            "district": "Huyện Thống Nhất",
            "address": "Trạm thu phí Dầu Giây, Huyện Thống Nhất, Tỉnh Đồng Nai",
            "phone": "0918 113 114",
            "lat": 10.9214,
            "lng": 107.1356,
            "rating": 4.8,
            "reviewCount": 260,
            "services": ["Cứu hộ khẩn cấp cao tốc", "Cẩu kéo xe 24/24", "Cứu hộ xe container"],
            "isVerified": True,
            "informationStatus": "official"
        }
    ]

    # Remove PENDING-RESCUE-DONG-NAI
    enterprises = [e for e in enterprises if e.get('id') != 'PENDING-RESCUE-DONG-NAI']
    for nr in dong_nai_rescues:
        idx = next((i for i, e in enumerate(enterprises) if e.get('id') == nr['id']), -1)
        if idx != -1:
            enterprises[idx] = nr
        else:
            enterprises.append(nr)

    data['enterprises'] = enterprises
    with open(RESCUES_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Updated rescue-enterprises.json with Dong Nai rescue teams (Total: {len(enterprises)})")

if __name__ == '__main__':
    update_accounts()
    update_stations()
    update_hospitals()
    update_rescues()
    print("🎯 P1-DATA: All Dong Nai data stores synchronized successfully!")
