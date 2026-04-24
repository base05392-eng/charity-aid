import XLSX from 'xlsx';
import RNBlobUtil from 'react-native-blob-util';
import { getAllBeneficiaries, getAllCollectionsForExport } from '../database';

export async function exportToCsv(): Promise<string> {
  const [beneficiaries, collections] = await Promise.all([
    getAllBeneficiaries(),
    getAllCollectionsForExport(),
  ]);

  // Sheet 1 — Beneficiaries
  const beneficiaryRows = beneficiaries.map((b) => ({
    'Civil ID': b.cid,
    'Name (EN)': b.name_en,
    'Name (AR)': b.name_ar,
    'Family Group': b.family_group ?? '',
    'Eligible': b.eligible ? 'Yes' : 'No',
    'Blacklisted': b.blacklisted ? 'Yes' : 'No',
    'Blacklist Reason': b.blacklist_reason ?? '',
    'Notes': b.notes ?? '',
    'First Seen': b.first_seen,
    'Last Seen': b.last_seen,
  }));

  // Sheet 2 — Collections
  const collectionRows = collections.map((c, i) => ({
    '#': i + 1,
    'Civil ID': c.cid,
    'Name (EN)': (c as any).name_en ?? '',
    'Name (AR)': (c as any).name_ar ?? '',
    'Collected At': c.collected_at,
    'Round': c.round_name ?? '',
    'Device ID': c.device_id ?? '',
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(beneficiaryRows), 'Beneficiaries');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(collectionRows), 'Collections');

  const csvContent = XLSX.write(wb, { bookType: 'csv', type: 'string' });

  const date = new Date().toISOString().split('T')[0];
  const filename = `charity-aid-export-${date}.csv`;
  const path = `${RNBlobUtil.fs.dirs.DownloadDir}/${filename}`;

  await RNBlobUtil.fs.writeFile(path, csvContent, 'utf8');

  return path;
}
