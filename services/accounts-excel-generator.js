import XLSX from 'xlsx';

export function generateAccountsWorkbookBuffer(exportPayload) {
  const accounts = exportPayload.accounts || [];

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
    { header: 'STT', key: 'stt', width: 8 },
    { header: 'Thao Tác (Phân Quyền)', key: 'action', width: 22 },
    { header: 'Khu Vực (Tỉnh/TP)', key: 'province', width: 20 },
    { header: 'Lực Lượng Nghiệp Vụ', key: 'agency', width: 24 },
    { header: 'Cấp Hành Chính', key: 'level', width: 18 },
    { header: 'Tên Cơ Quan / Đơn Vị Trực Ban', key: 'unitName', width: 42 },
    { header: 'Địa Bàn (Xã/Phường)', key: 'ward', width: 25 },
    { header: 'Tên Đăng Nhập', key: 'username', width: 22 },
    { header: 'Mật Khẩu', key: 'password', width: 16 },
    { header: 'Cán Bộ Phụ Trách', key: 'officerName', width: 25 },
    { header: 'Chức Vụ / Cấp Bậc', key: 'officerRank', width: 20 },
    { header: 'Số Điện Thoại Trực Ban', key: 'phone', width: 22 },
    { header: 'Email Tác Chiến', key: 'email', width: 32 }
  ];

  function mapAccountToRow(acc, idx) {
    const isNational = acc.level === 'national' || acc.username === 'admin' || (acc.unitName && acc.unitName.includes('Quốc Gia'));
    let agencyName = 'Công An Nhân Dân';
    if (acc.agency === 'hospital') agencyName = 'Cấp Cứu Y Tế 115';
    else if (acc.agency === 'traffic-rescue') agencyName = 'Cứu Hộ Giao Thông 114';
    else if (acc.agency === 'csgt') agencyName = 'Cảnh Sát Giao Thông';
    else if (acc.agency === 'fire') agencyName = 'PCCC & CNCH';
    else if (isNational) agencyName = 'Chỉ Huy Tác Chiến Quốc Gia';

    let levelName = 'Cấp Xã/Phường';
    if (isNational) levelName = 'Trung Ương (Quốc Gia)';
    else if (acc.level === 'province') levelName = 'Cấp Tỉnh/Thành Phố';
    else if (acc.level === 'district') levelName = 'Cấp Quận/Huyện';

    return {
      'STT': idx + 1,
      'Thao Tác (Phân Quyền)': 'Hiện có (Cập nhật)',
      'Khu Vực (Tỉnh/TP)': isNational ? 'Toàn Quốc' : (acc.province || 'Cần Thơ'),
      'Lực Lượng Nghiệp Vụ': agencyName,
      'Cấp Hành Chính': levelName,
      'Tên Cơ Quan / Đơn Vị Trực Ban': acc.agencyName || acc.unitName || acc.name || '',
      'Địa Bàn (Xã/Phường)': acc.ward || '',
      'Tên Đăng Nhập': acc.username || '',
      'Mật Khẩu': acc.password || acc.initialPassword || '2002',
      'Cán Bộ Phụ Trách': acc.officerName || 'Đ/c Trực ban tác chiến',
      'Chức Vụ / Cấp Bậc': acc.officerRank || 'Đại úy',
      'Số Điện Thoại Trực Ban': acc.officerPhone || acc.phone || '113',
      'Email Tác Chiến': acc.officerEmail || acc.email || ''
    };
  }

  const wb = XLSX.utils.book_new();

  const policeData = policeAccounts.map((a, i) => mapAccountToRow(a, i));
  const wsPolice = XLSX.utils.json_to_sheet(policeData);
  wsPolice['!cols'] = columns.map(c => ({ wch: c.width }));
  XLSX.utils.book_append_sheet(wb, wsPolice, 'Công An & CAND');

  const medData = medicalAccounts.map((a, i) => mapAccountToRow(a, i));
  const wsMed = XLSX.utils.json_to_sheet(medData);
  wsMed['!cols'] = columns.map(c => ({ wch: c.width }));
  XLSX.utils.book_append_sheet(wb, wsMed, 'Cấp Cứu Y Tế (115)');

  const rescueData = rescueAccounts.map((a, i) => mapAccountToRow(a, i));
  const wsRescue = XLSX.utils.json_to_sheet(rescueData);
  wsRescue['!cols'] = columns.map(c => ({ wch: c.width }));
  XLSX.utils.book_append_sheet(wb, wsRescue, 'Cứu Hộ Doanh Nghiệp');

  const sampleData = [
    {
      'STT': 1,
      'Thao Tác (Phân Quyền)': '⭐ THÊM MỚI',
      'Khu Vực (Tỉnh/TP)': 'TP. Hồ Chí Minh',
      'Lực Lượng Nghiệp Vụ': 'Công An Nhân Dân',
      'Cấp Hành Chính': 'Cấp Xã/Phường',
      'Tên Cơ Quan / Đơn Vị Trực Ban': 'Công An Phường Bến Nghé (Mẫu)',
      'Địa Bàn (Xã/Phường)': 'Phường Bến Nghé',
      'Tên Đăng Nhập': 'hcm_ca_phuong_ben_nghe_moi',
      'Mật Khẩu': '2002',
      'Cán Bộ Phụ Trách': 'Đ/c Trực ban mẫu',
      'Chức Vụ / Cấp Bậc': 'Đại úy',
      'Số Điện Thoại Trực Ban': '028 3829 6957',
      'Email Tác Chiến': 'caphuongbennghe@tphcm.bca.gov.vn'
    }
  ];
  const wsSample = XLSX.utils.json_to_sheet(sampleData);
  wsSample['!cols'] = columns.map(c => ({ wch: c.width }));
  XLSX.utils.book_append_sheet(wb, wsSample, 'Mẫu Thêm Tài Khoản Nhanh');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
