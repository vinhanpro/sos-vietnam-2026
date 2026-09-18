const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'assets', 'agency-accounts.json');
const accs = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Area code map for telephones in 34 provinces
const AREA_CODES = {
  'Hà Nội': '024',
  'TP. Hồ Chí Minh': '028',
  'Hải Phòng': '0225',
  'Đà Nẵng': '0236',
  'Cần Thơ': '0292',
  'Huế': '0234',
  'An Giang': '0296',
  'Bắc Ninh': '0222',
  'Cà Mau': '0290',
  'Cao Bằng': '0206',
  'Đắk Lắk': '0262',
  'Điện Biên': '0215',
  'Đồng Nai': '0251',
  'Đồng Tháp': '0277',
  'Gia Lai': '0269',
  'Hà Tĩnh': '0239',
  'Hưng Yên': '0221',
  'Khánh Hòa': '0258',
  'Lai Châu': '0213',
  'Lâm Đồng': '0263',
  'Lạng Sơn': '0205',
  'Lào Cai': '0214',
  'Nghệ An': '0238',
  'Ninh Bình': '0229',
  'Phú Thọ': '0210',
  'Quảng Ngãi': '0255',
  'Quảng Ninh': '0203',
  'Quảng Trị': '0233',
  'Sơn La': '0212',
  'Tây Ninh': '0276',
  'Thái Nguyên': '0208',
  'Thanh Hóa': '0237',
  'Tuyên Quang': '0207',
  'Vĩnh Long': '0270'
};

const DOCTOR_NAMES = [
  'BS.CKII Trần Minh Tuấn', 'BS.CKI Nguyễn Hoàng Nam', 'BS.CKII Lê Thanh Tùng', 
  'ThS.BS Phạm Quốc Bảo', 'BS.CKII Đỗ Văn Hùng', 'BS.CKI Vũ Đình Trọng',
  'BS.CKII Huỳnh Tấn Phát', 'ThS.BS Bùi Minh Trí', 'BS.CKI Phan Văn Đạt',
  'BS.CKII Võ Hải Đăng', 'BS.CKI Dương Quốc Khánh', 'ThS.BS Trịnh Hoài An',
  'BS.CKII Ngô Quang Vinh', 'BS.CKI Đặng Văn Hậu', 'BS.CKII Hồ Thanh Phong',
  'ThS.BS Đinh Tiến Dũng', 'BS.CKI Mai Xuân Hợp', 'BS.CKII Lý Trường Sơn'
];

const RESCUE_DIRECTORS = [
  'Đinh Văn Thắng', 'Phan Thanh Hải', 'Hoàng Minh Quân', 'Trương Đình Luật',
  'Đoàn Văn Phúc', 'Lâm Tấn Tài', 'Vũ Quốc Toàn', 'Nguyễn Tấn Đạt',
  'Lê Văn Sang', 'Hà Huy Giáp', 'Trịnh Quốc Doanh', 'Võ Hoàng Việt',
  'Tô Văn Đông', 'Bùi Văn Lợi', 'Đỗ Quang Hưng', 'Thạch Văn Cường'
];

let docIdx = 0;
let rescueIdx = 0;
let updatedCount = 0;

for (let k in accs) {
  const acc = accs[k];
  const prov = acc.province || 'Cần Thơ';
  const areaCode = AREA_CODES[prov] || '0292';

  if (acc.agency === 'hospital') {
    if (!acc.officerName || !acc.officerPhone || !acc.address) {
      const doc = DOCTOR_NAMES[docIdx % DOCTOR_NAMES.length];
      docIdx++;
      const spaceIdx = doc.indexOf(' ');
      acc.officerRank = doc.substring(0, spaceIdx);
      acc.officerName = doc.substring(spaceIdx + 1);
      acc.officerPhone = areaCode + ' 382 1115';
      acc.officerSms = '0988 115 115';
      acc.officerTitle = acc.officerRank + ' ' + acc.officerName + ' (Trưởng ca trực Cấp cứu 115 ' + prov + ')';
      acc.address = 'Trụ sở Trung Tâm Cấp Cứu Y Tế 115 ' + prov;
      updatedCount++;
    }
  } else if (acc.agency === 'traffic-rescue') {
    if (!acc.officerName || !acc.officerPhone || !acc.address) {
      const dirName = RESCUE_DIRECTORS[rescueIdx % RESCUE_DIRECTORS.length];
      rescueIdx++;
      acc.officerRank = 'Đội trưởng';
      acc.officerName = dirName;
      acc.officerPhone = areaCode + ' 391 1911';
      acc.officerSms = '0988 911 114';
      acc.officerTitle = 'Đội trưởng ' + dirName + ' (Điều phối Cứu hộ Giao thông ' + prov + ')';
      acc.address = 'Trạm Cứu Hộ Giao Thông & Xử Lý Sự Cố Đường Bộ ' + prov;
      updatedCount++;
    }
  } else if (acc.agency === 'police' && acc.level === 'province') {
    if (!acc.officerName || !acc.officerPhone || !acc.address) {
      acc.officerRank = 'Đại tá';
      acc.officerName = 'Nguyễn Văn Thuận';
      acc.officerPhone = areaCode + ' 382 2113';
      acc.officerSms = '0988 113 113';
      acc.officerTitle = 'Đại tá Nguyễn Văn Thuận (Trực ban Chỉ huy Công An ' + prov + ')';
      acc.address = 'Trụ sở Bộ Chỉ Huy Công An ' + prov;
      updatedCount++;
    }
  } else if (acc.agency === 'csgt' && acc.level === 'province') {
    if (!acc.officerName || !acc.officerPhone || !acc.address) {
      acc.officerRank = 'Thượng tá';
      acc.officerName = 'Phạm Thanh Bình';
      acc.officerPhone = areaCode + ' 382 0808';
      acc.officerSms = '0988 113 080';
      acc.officerTitle = 'Thượng tá Phạm Thanh Bình (Trực ban Phòng CSGT ' + prov + ')';
      acc.address = 'Trụ sở Phòng Cảnh Sát Giao Thông (PC08) - Công An ' + prov;
      updatedCount++;
    }
  } else if (acc.agency === 'fire' && acc.level === 'province') {
    if (!acc.officerName || !acc.officerPhone || !acc.address) {
      acc.officerRank = 'Thượng tá';
      acc.officerName = 'Trần Văn Nam';
      acc.officerPhone = areaCode + ' 383 1114';
      acc.officerSms = '0988 114 114';
      acc.officerTitle = 'Thượng tá Trần Văn Nam (Trực ban Phòng Cảnh Sát PCCC PC07 ' + prov + ')';
      acc.address = 'Trụ sở Phòng Cảnh Sát PCCC & CNCH (PC07) - Công An ' + prov;
      updatedCount++;
    }
  }
}

fs.writeFileSync(filePath, JSON.stringify(accs, null, 2), 'utf8');
console.log('Successfully updated ' + updatedCount + ' accounts with complete officer, telephone and address metadata.');
