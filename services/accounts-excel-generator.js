import XLSX from 'xlsx';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PYTHON_CMD = process.platform === 'win32' ? 'python' : 'python3';

export function generateAccountsWorkbookBuffer(exportPayload) {
  const accounts = exportPayload.accounts || [];
  const generatedAt = exportPayload.generatedAt || new Date().toLocaleString('vi-VN');
  const officerName = exportPayload.officerName || 'Trung Tâm Chỉ Huy Tác Chiến & Điều Phối Quốc Gia';

  // 1. Try high-fidelity openpyxl execution via Python (produces identical 17/09/2026 file)
  try {
    const tempId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const tempJson = path.join(__dirname, '..', `temp_exp_${tempId}.json`);
    const tempXlsx = path.join(__dirname, '..', `temp_exp_${tempId}.xlsx`);
    const scriptPath = path.join(__dirname, '..', 'scripts', 'generate_accounts_excel.py');

    fs.writeFileSync(tempJson, JSON.stringify({
      accounts,
      generatedAt,
      officerName
    }), 'utf-8');

    execSync(`${PYTHON_CMD} "${scriptPath}" "${tempJson}" "${tempXlsx}"`, {
      timeout: 15000,
      stdio: 'pipe'
    });

    if (fs.existsSync(tempXlsx)) {
      const buf = fs.readFileSync(tempXlsx);
      try { fs.unlinkSync(tempJson); } catch(e) {}
      try { fs.unlinkSync(tempXlsx); } catch(e) {}
      return buf;
    }
  } catch (pyErr) {
    console.warn('[EXCEL GENERATOR] Python openpyxl fallback to pure Node.js xlsx generator:', pyErr.message);
  }

  // 2. Pure Node.js high-speed in-memory generator with exact 3 sheets and 12 columns matching 17/09/2026
  const wb = XLSX.utils.book_new();

  const policeAccounts = [];
  const medicalAccounts = [];
  const rescueAccounts = [];

  accounts.forEach(acc => {
    const agency = (acc.agency || '').toLowerCase();
    if (agency === 'hospital' || agency === 'medical' || agency === '115') {
      medicalAccounts.push(acc);
    } else if (agency === 'traffic-rescue' || agency === 'rescue' || agency === 'garage') {
      rescueAccounts.push(acc);
    } else {
      policeAccounts.push(acc);
    }
  });

  const columns = [
    { header: 'STT', wch: 6 },
    { header: 'Khu Vực (Tỉnh/TP)', wch: 18 },
    { header: 'Lực Lượng Nghiệp Vụ', wch: 22 },
    { header: 'Cấp Hành Chính', wch: 18 },
    { header: 'Tên Cơ Quan / Đơn Vị Trực Ban', wch: 42 },
    { header: 'Địa Bàn (Xã/Phường)', wch: 25 },
    { header: 'Tên Đăng Nhập', wch: 20 },
    { header: 'Mật Khẩu', wch: 16 },
    { header: 'Cán Bộ Phụ Trách', wch: 22 },
    { header: 'Chức Vụ / Cấp Bậc', wch: 18 },
    { header: 'SĐT Trực Ban', wch: 18 },
    { header: 'SMS Tiếp Nhận', wch: 18 }
  ];

  function buildSheetData(accList, sheetTitle, subTitle) {
    const rows = [];
    // Row 1: Banner
    rows.push(['HỆ THỐNG CỨU HỘ & CẢNH BÁO SOS KHẨN CẤP QUỐC GIA (34 TỈNH THÀNH)']);
    // Row 2: Subtitle
    rows.push([sheetTitle]);
    // Row 3: Meta
    rows.push([`Thời điểm xuất: ${generatedAt}  ·  Đơn vị: ${officerName}  ·  ${subTitle}`]);
    // Row 4: Empty
    rows.push([]);
    // Row 5: Table Header
    rows.push(columns.map(c => c.header));

    let stt = 1;
    accList.forEach(acc => {
      const isNational = acc.level === 'national' || acc.username === 'admin' || (acc.unitName && acc.unitName.includes('Quốc Gia'));
      let agencyName = 'Công An Nhân Dân';
      if (acc.agency === 'hospital') agencyName = 'Cấp Cứu Y Tế';
      else if (acc.agency === 'traffic-rescue') agencyName = 'Cứu Hộ Doanh Nghiệp';
      else if (acc.agency === 'csgt') agencyName = 'Cảnh Sát Giao Thông';
      else if (acc.agency === 'fire') agencyName = 'PCCC & CNCH';
      else if (isNational) agencyName = 'Chỉ Huy Quốc Gia';

      let levelName = 'Cấp Xã/Phường';
      if (isNational) levelName = 'Trung Ương';
      else if (acc.level === 'province') levelName = 'Cấp Tỉnh/TP';
      else if (acc.level === 'district') levelName = 'Cấp Quận/Huyện';

      const pwd = acc.password || acc.initialPassword || '2002';

      rows.push([
        stt++,
        isNational ? 'Toàn Quốc' : (acc.province || 'Cần Thơ'),
        agencyName,
        levelName,
        acc.agencyName || acc.unitName || '',
        acc.ward || (acc.province ? `Toàn ${acc.province.includes('TP.') ? 'Thành Phố' : 'Tỉnh'}` : ''),
        acc.username || '',
        pwd,
        acc.officerName || 'Đ/c Trực ban tác chiến',
        acc.officerRank || 'Đại úy',
        acc.officerPhone || acc.phone || '113',
        acc.officerSms || acc.sms || '0988 113 113'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = columns.map(c => ({ wch: c.wch }));
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 11 } }
    ];
    return ws;
  }

  const wsPolice = buildSheetData(policeAccounts, 'DANH SÁCH TÀI KHOẢN: LỰC LƯỢNG CÔNG AN & AN NINH NHÂN DÂN', 'Chế độ: BẢO MẬT TÁC CHIẾN');
  XLSX.utils.book_append_sheet(wb, wsPolice, 'Công An & CAND');

  const wsMed = buildSheetData(medicalAccounts, 'DANH SÁCH TÀI KHOẢN: HỆ THỐNG CẤP CỨU Y TẾ & BỆNH VIỆN 34 TỈNH THÀNH', 'Ngành: Y TẾ ĐIỀU PHỐI');
  XLSX.utils.book_append_sheet(wb, wsMed, 'Cấp Cứu Y Tế');

  const wsRescue = buildSheetData(rescueAccounts, 'DANH SÁCH TÀI KHOẢN: DOANH NGHIỆP & GARAGE CỨU HỘ XE GIAO THÔNG 34 TỈNH THÀNH', 'Ngành: DỊCH VỤ CỨU HỘ ĐƯỜNG BỘ');
  XLSX.utils.book_append_sheet(wb, wsRescue, 'Cứu Hộ Doanh Nghiệp');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
