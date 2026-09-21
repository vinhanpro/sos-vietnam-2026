import ExcelJS from 'exceljs';

const CITY_PROVINCES = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Huế'];

const DEFAULT_PASSWORDS = {
  admin: 'Admin',
  congan: 'Congan@113',
  csgt: 'Csgt@113',
  pccc: 'Pccc@114',
  hospital: 'Capcuu@115',
  'traffic-rescue': 'Cuuhoxe@113',
  police: 'Congan@113'
};

function defaultPasswordForAccount(acc) {
  const u = (acc?.username || '').toLowerCase();
  const ag = (acc?.agency || '').toLowerCase();
  if (u === 'admin') return DEFAULT_PASSWORDS.admin;
  if (ag === 'hospital' || ag === 'medical' || ag === '115' || u.includes('capcuu') || u.includes('bv') || u.includes('vien')) {
    return DEFAULT_PASSWORDS.hospital;
  }
  if (ag === 'traffic-rescue' || ag === 'rescue' || ag === 'garage' || u.includes('cuuho') || u.includes('gara')) {
    return DEFAULT_PASSWORDS['traffic-rescue'];
  }
  if (u.includes('csgt') || ag === 'csgt') return DEFAULT_PASSWORDS.csgt;
  if (u.includes('pccc') || ag === 'fire') return DEFAULT_PASSWORDS.pccc;
  return DEFAULT_PASSWORDS.congan;
}

function getAccountPassword(acc) {
  const u = (acc?.username || '').toLowerCase();
  if (u === 'admin') return 'Admin';
  if (acc?.password && typeof acc.password === 'string' && acc.password.trim() && !acc.password.startsWith('$') && acc.password.length < 50 && acc.password !== '2002') {
    return acc.password.trim();
  }
  if (acc?.initialPassword && typeof acc.initialPassword === 'string' && acc.initialPassword.trim() && acc.initialPassword !== '2002') {
    return acc.initialPassword.trim();
  }
  return defaultPasswordForAccount(acc);
}

function formatProvinceLabel(provName) {
  if (!provName) return 'TOÀN QUỐC';
  const clean = provName.trim();
  if (CITY_PROVINCES.some(c => clean.toLowerCase().includes(c.toLowerCase().replace('tp. ', '')))) {
    return clean.toUpperCase().startsWith('TP.') ? clean.toUpperCase() : `TP. ${clean.toUpperCase()}`;
  }
  if (clean.toLowerCase().startsWith('tỉnh')) {
    return clean.toUpperCase();
  }
  return `TỈNH ${clean.toUpperCase()}`;
}

const THIN_BORDER = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
};

const COLUMNS = [
  { header: 'STT', width: 6 },
  { header: 'Khu Vực (Tỉnh/TP)', width: 18 },
  { header: 'Lực Lượng Nghiệp Vụ', width: 22 },
  { header: 'Cấp Hành Chính', width: 18 },
  { header: 'Tên Cơ Quan / Đơn Vị Trực Ban', width: 40 },
  { header: 'Địa Bàn (Xã/Phường)', width: 24 },
  { header: 'Tên Đăng Nhập', width: 18 },
  { header: 'Mật Khẩu', width: 16 },
  { header: 'Cán Bộ Phụ Trách', width: 22 },
  { header: 'Chức Vụ / Cấp Bậc', width: 18 },
  { header: 'SĐT Trực Ban', width: 16 },
  { header: 'SMS Tiếp Nhận', width: 16 }
];

export async function generateAccountsWorkbookBuffer(exportPayload = {}) {
  let accounts = [];
  if (Array.isArray(exportPayload.accounts)) {
    accounts = exportPayload.accounts;
  } else if (exportPayload.accounts && typeof exportPayload.accounts === 'object') {
    accounts = Object.values(exportPayload.accounts);
  }

  const generatedAt = exportPayload.generatedAt || new Date().toLocaleString('vi-VN');
  const officerName = exportPayload.officerName || 'Trung Tâm Chỉ Huy Tác Chiến & Điều Phối Quốc Gia';

  const wb = new ExcelJS.Workbook();
  wb.creator = 'SOS Việt Nam 2026';
  wb.lastModifiedBy = officerName;
  wb.created = new Date();
  wb.modified = new Date();

  // Phân loại tài khoản theo nghiệp vụ và tỉnh thành
  const policeNational = [];
  const policeByProv = {};
  const hospitalByProv = {};
  const rescueByProv = {};

  accounts.forEach(acc => {
    const prov = acc.province || 'Cần Thơ';
    const level = acc.level || 'ward';
    const agency = (acc.agency || 'police').toLowerCase();
    const username = (acc.username || '').toLowerCase();

    if (level === 'national' || username === 'admin' || (acc.unitName && acc.unitName.includes('Quốc Gia'))) {
      policeNational.push(acc);
      return;
    }

    if (agency === 'hospital' || agency === 'medical' || agency === '115') {
      if (!hospitalByProv[prov]) hospitalByProv[prov] = [];
      hospitalByProv[prov].push(acc);
    } else if (agency === 'traffic-rescue' || agency === 'rescue' || level === 'enterprise' || agency === 'garage') {
      if (!rescueByProv[prov]) rescueByProv[prov] = [];
      rescueByProv[prov].push(acc);
    } else {
      if (!policeByProv[prov]) {
        policeByProv[prov] = {
          police_prov: [],
          police_wards: [],
          csgt: [],
          fire: []
        };
      }
      if (agency === 'csgt') {
        policeByProv[prov].csgt.push(acc);
      } else if (agency === 'fire') {
        policeByProv[prov].fire.push(acc);
      } else {
        if (level === 'province' || username === 'congan' || username.startsWith('catp')) {
          policeByProv[prov].police_prov.push(acc);
        } else {
          policeByProv[prov].police_wards.push(acc);
        }
      }
    }
  });

  // Thứ tự sắp xếp tỉnh thành chuẩn: Cần Thơ đầu tiên, sau đó các thành phố trực thuộc TW, rồi theo A-Z
  function sortProvinces(provList) {
    return provList.slice().sort((a, b) => {
      if (a === 'Cần Thơ') return -1;
      if (b === 'Cần Thơ') return 1;
      const aIsCity = CITY_PROVINCES.includes(a);
      const bIsCity = CITY_PROVINCES.includes(b);
      if (aIsCity && !bIsCity) return -1;
      if (!aIsCity && bIsCity) return 1;
      return a.localeCompare(b, 'vi');
    });
  }

  function setupSheetHeader(ws, sheetTitle, subTitle, headerBgArgb) {
    ws.views = [{ showGridLines: true }];

    // Column widths
    COLUMNS.forEach((col, idx) => {
      ws.getColumn(idx + 1).width = col.width;
    });

    // Row 1: Banner xanh đậm
    ws.mergeCells('A1:L1');
    const c1 = ws.getCell('A1');
    c1.value = 'HỆ THỐNG CỨU HỘ & CẢNH BÁO SOS KHẨN CẤP QUỐC GIA (34 TỈNH THÀNH)';
    c1.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    c1.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 22;

    // Row 2: Tiêu đề danh sách
    ws.mergeCells('A2:L2');
    const c2 = ws.getCell('A2');
    c2.value = sheetTitle;
    c2.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF1E3A8A' } };
    c2.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 24;

    // Row 3: Metadata thông tin xuất
    ws.mergeCells('A3:L3');
    const c3 = ws.getCell('A3');
    c3.value = `Thời điểm xuất: ${generatedAt}  ·  Đơn vị: ${officerName}  ·  ${subTitle}`;
    c3.font = { name: 'Arial', size: 9.5, bold: true, italic: true, color: { argb: 'FF475569' } };
    c3.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(3).height = 18;

    // Row 4: Dòng đệm
    ws.getRow(4).height = 6;

    // Row 5: Header bảng dữ liệu
    ws.getRow(5).height = 26;
    for (let c = 1; c <= 12; c++) {
      const cell = ws.getCell(5, c);
      cell.value = COLUMNS[c - 1].header;
      cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgArgb } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = THIN_BORDER;
    }
  }

  function writeSectionHeader(ws, rowIdx, groupTitle, fillArgb) {
    ws.mergeCells(rowIdx, 1, rowIdx, 12);
    for (let c = 1; c <= 12; c++) {
      const cell = ws.getCell(rowIdx, c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
      cell.border = THIN_BORDER;
    }
    const cell = ws.getCell(rowIdx, 1);
    cell.value = groupTitle;
    cell.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
    cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    ws.getRow(rowIdx).height = 22;
  }

  function writeDataRow(ws, rowIdx, sttVal, rowData) {
    const isEven = (sttVal % 2 === 0);
    const rowBg = isEven ? 'FFF8FAFC' : 'FFFFFFFF';
    ws.getRow(rowIdx).height = 20;

    for (let c = 1; c <= 12; c++) {
      const cell = ws.getCell(rowIdx, c);
      cell.value = rowData[c - 1];
      const isCredential = (c === 7 || c === 8);
      cell.font = {
        name: isCredential ? 'Courier New' : 'Arial',
        size: isCredential ? 9.5 : 9,
        bold: isCredential,
        color: { argb: isCredential ? 'FF6D28D9' : 'FF0F172A' }
      };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.border = THIN_BORDER;

      let hAlign = 'left';
      if (c === 1 || c === 4 || c === 7 || c === 8 || c === 10 || c === 11 || c === 12) {
        hAlign = 'center';
      }
      cell.alignment = { horizontal: hAlign, vertical: 'middle' };
    }
  }

  // ==========================================
  // SHEET 1: Công An & CAND
  // ==========================================
  const wsPolice = wb.addWorksheet('Công An & CAND');
  setupSheetHeader(wsPolice, 'DANH SÁCH TÀI KHOẢN: LỰC LƯỢNG CÔNG AN & AN NINH NHÂN DÂN', 'Chế độ: BẢO MẬT TÁC CHIẾN', 'FF1E293B');

  let curRowPolice = 6;
  let sttPolice = 1;

  if (policeNational.length > 0) {
    writeSectionHeader(wsPolice, curRowPolice, '🏛️ I. CẤP TRUNG ƯƠNG / QUỐC GIA (TỔNG HỢP)', 'FFE0E7FF');
    curRowPolice++;

    policeNational.forEach(acc => {
      const pwd = getAccountPassword(acc);
      const row = [
        sttPolice,
        'Toàn Quốc',
        'Chỉ Huy Quốc Gia',
        'Trung Ương',
        acc.agencyName || acc.unitName || 'Trung Tâm Chỉ Huy Tác Chiến Quốc Gia',
        acc.ward || 'Bộ Công An',
        acc.username || 'admin',
        pwd,
        acc.officerName || 'Điền Trần Vĩnh An',
        acc.officerRank || 'Trung sĩ',
        acc.officerPhone || acc.phone || '0355 113 140',
        acc.officerSms || acc.sms || '0355 113 140'
      ];
      writeDataRow(wsPolice, curRowPolice, sttPolice, row);
      curRowPolice++;
      sttPolice++;
    });
  }

  const sortedPoliceProvs = sortProvinces(Object.keys(policeByProv));
  sortedPoliceProvs.forEach((provName, pIdx) => {
    const grp = policeByProv[provName];
    const total = grp.police_prov.length + grp.police_wards.length + grp.csgt.length + grp.fire.length;
    if (total === 0) return;

    const provLabel = formatProvinceLabel(provName);
    writeSectionHeader(wsPolice, curRowPolice, `🏙️ ${pIdx + 2}. KHU VỰC: ${provLabel}`, 'FFE0E7FF');
    curRowPolice++;

    const isCity = CITY_PROVINCES.includes(provName);
    const defaultTerritory = isCity ? 'Toàn Thành Phố' : 'Toàn Tỉnh';

    // 1. Công an cấp Tỉnh / TP
    grp.police_prov.forEach(acc => {
      const row = [
        sttPolice,
        provName,
        'Công an khu vực',
        'Cấp Tỉnh/TP',
        acc.agencyName || acc.unitName || `Công an ${provName}`,
        acc.ward || defaultTerritory,
        acc.username,
        getAccountPassword(acc),
        acc.officerName || 'Trực ban Công an',
        acc.officerRank || 'Đang cập nhật',
        acc.officerPhone || acc.phone || 'Đang cập nhật',
        acc.officerSms || acc.sms || 'Đang cập nhật'
      ];
      writeDataRow(wsPolice, curRowPolice, sttPolice, row);
      curRowPolice++;
      sttPolice++;
    });

    // 2. Công an cấp Xã / Phường
    grp.police_wards.forEach(acc => {
      const row = [
        sttPolice,
        provName,
        'Công an khu vực',
        'Cấp Xã/Phường',
        acc.agencyName || acc.unitName || '',
        acc.ward || defaultTerritory,
        acc.username,
        getAccountPassword(acc),
        acc.officerName || 'Đang cập nhật',
        acc.officerRank || 'Đang cập nhật',
        acc.officerPhone || acc.phone || 'Đang cập nhật',
        acc.officerSms || acc.sms || 'Đang cập nhật'
      ];
      writeDataRow(wsPolice, curRowPolice, sttPolice, row);
      curRowPolice++;
      sttPolice++;
    });

    // 3. Cảnh Sát Giao Thông
    grp.csgt.forEach(acc => {
      const row = [
        sttPolice,
        provName,
        'Cảnh sát giao thông',
        'Cấp Phòng (PC08)',
        acc.agencyName || acc.unitName || '',
        acc.ward || defaultTerritory,
        acc.username,
        getAccountPassword(acc),
        acc.officerName || 'Đang cập nhật',
        acc.officerRank || 'Đang cập nhật',
        acc.officerPhone || acc.phone || 'Đang cập nhật',
        acc.officerSms || acc.sms || 'Đang cập nhật'
      ];
      writeDataRow(wsPolice, curRowPolice, sttPolice, row);
      curRowPolice++;
      sttPolice++;
    });

    // 4. PCCC & CNCH
    grp.fire.forEach(acc => {
      const lvl = acc.level === 'province' ? 'Cấp Phòng (PC07)' : 'Đội PCCC Cơ Sở';
      const row = [
        sttPolice,
        provName,
        'PCCC & CNCH',
        lvl,
        acc.agencyName || acc.unitName || '',
        acc.ward || defaultTerritory,
        acc.username,
        getAccountPassword(acc),
        acc.officerName || 'Đang cập nhật',
        acc.officerRank || 'Đang cập nhật',
        acc.officerPhone || acc.phone || 'Đang cập nhật',
        acc.officerSms || acc.sms || 'Đang cập nhật'
      ];
      writeDataRow(wsPolice, curRowPolice, sttPolice, row);
      curRowPolice++;
      sttPolice++;
    });
  });

  // ==========================================
  // SHEET 2: Cấp Cứu Y Tế
  // ==========================================
  const wsMed = wb.addWorksheet('Cấp Cứu Y Tế');
  setupSheetHeader(wsMed, 'DANH SÁCH TÀI KHOẢN: HỆ THỐNG CẤP CỨU Y TẾ & BỆNH VIỆN 34 TỈNH THÀNH', 'Ngành: Y TẾ ĐIỀU PHỐI', 'FF065F46');

  let curRowMed = 6;
  let sttMed = 1;
  const sortedMedProvs = sortProvinces(Object.keys(hospitalByProv));

  sortedMedProvs.forEach((provName, mIdx) => {
    const list = hospitalByProv[provName];
    if (!list || list.length === 0) return;

    const provLabel = formatProvinceLabel(provName);
    writeSectionHeader(wsMed, curRowMed, `🏥 ${mIdx + 1}. KHU VỰC: ${provLabel}`, 'FFD1FAE5');
    curRowMed++;

    const isCity = CITY_PROVINCES.includes(provName);
    const defaultTerritory = isCity ? 'Toàn Thành Phố' : 'Toàn Tỉnh';

    list.forEach(acc => {
      const lvlCode = acc.level || 'province';
      const lvlDisp = lvlCode === 'province' ? 'Cấp Tỉnh/TP' : (lvlCode === 'national' ? 'Cấp Quốc Gia' : 'Cấp Xã/Phường/Huyện');
      const row = [
        sttMed,
        provName,
        'Cấp cứu y tế',
        lvlDisp,
        acc.agencyName || acc.unitName || '',
        acc.ward || defaultTerritory,
        acc.username,
        getAccountPassword(acc),
        acc.officerName || 'Đang cập nhật',
        acc.officerRank || 'Đang cập nhật',
        acc.officerPhone || acc.phone || 'Đang cập nhật',
        acc.officerSms || acc.sms || 'Đang cập nhật'
      ];
      writeDataRow(wsMed, curRowMed, sttMed, row);
      curRowMed++;
      sttMed++;
    });
  });

  // ==========================================
  // SHEET 3: Cứu Hộ Doanh Nghiệp
  // ==========================================
  const wsRescue = wb.addWorksheet('Cứu Hộ Doanh Nghiệp');
  setupSheetHeader(wsRescue, 'DANH SÁCH TÀI KHOẢN: DOANH NGHIỆP & GARAGE CỨU HỘ XE GIAO THÔNG 34 TỈNH THÀNH', 'Ngành: DỊCH VỤ CỨU HỘ ĐƯỜNG BỘ', 'FF9A3412');

  let curRowRescue = 6;
  let sttRescue = 1;
  const sortedRescueProvs = sortProvinces(Object.keys(rescueByProv));

  sortedRescueProvs.forEach((provName, rIdx) => {
    const list = rescueByProv[provName];
    if (!list || list.length === 0) return;

    const provLabel = formatProvinceLabel(provName);
    writeSectionHeader(wsRescue, curRowRescue, `🚗 ${rIdx + 1}. KHU VỰC: ${provLabel}`, 'FFFFEDD5');
    curRowRescue++;

    list.forEach(acc => {
      const row = [
        sttRescue,
        provName,
        'Cứu hộ doanh nghiệp',
        'Doanh Nghiệp',
        acc.agencyName || acc.unitName || '',
        acc.ward || '',
        acc.username,
        getAccountPassword(acc),
        acc.officerName || 'Đang cập nhật',
        acc.officerRank || 'Đang cập nhật',
        acc.officerPhone || acc.phone || 'Đang cập nhật',
        acc.officerSms || acc.sms || 'Đang cập nhật'
      ];
      writeDataRow(wsRescue, curRowRescue, sttRescue, row);
      curRowRescue++;
      sttRescue++;
    });
  });

  const rawBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(rawBuffer);
}
