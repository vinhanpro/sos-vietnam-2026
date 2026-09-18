/**
 * Owner-approved local default passwords for the SOS demonstration accounts.
 * Account stores retain only PBKDF2 hashes; this policy is used when issuing a
 * controlled reset and when an administrative export needs a display value.
 */
export function defaultPasswordForAccount(account = {}) {
  const username = String(account.username || '').trim().toLowerCase();
  const agency = String(account.agency || '').trim().toLowerCase();

  if (username === 'admin') return 'Admin';
  if (agency === 'csgt') return 'Csgt@113';
  if (agency === 'fire') return 'Pccc@114';
  if (agency === 'hospital') return 'Capcuu@115';
  if (agency === 'traffic-rescue') return 'Cuuhoxe@113';
  return 'Congan@113';
}
