// =====================================================
// script.js - Ngekos Yuk (versi HTML)
// Semua aksi hanya simulasi dan tidak dikirim ke server.
// =====================================================

// ---------- Alat bantu ----------
const kelasStatus = {
  'Tersedia': 'badge-success', 'Terisi': 'badge-danger', 'Dalam Perbaikan': 'badge-warning',
  'Menunggu': 'badge-warning', 'Diterima': 'badge-success', 'Ditolak': 'badge-danger',
  'Belum Dibayar': 'badge-danger', 'Menunggu Verifikasi': 'badge-warning', 'Lunas': 'badge-success',
  'Terverifikasi': 'badge-success', 'Sedang Diproses': 'badge-info', 'Selesai': 'badge-success',
};
const hariIni = new Date().toISOString().slice(0, 10);
const badge = (teks) => `<span class="badge ${kelasStatus[teks]}">${teks}</span>`;
const rupiah = (angka) => 'Rp ' + Number(angka).toLocaleString('id-ID');
const tanggal = (nilai) => new Date(nilai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const bulanTahun = (nilai) => new Date(nilai + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
const esc = (teks) => String(teks).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function notify(pesan) {
  let kotak = document.getElementById('toast');
  if (!kotak) {
    kotak = document.createElement('div');
    kotak.id = 'toast';
    kotak.className = 'toast';
    document.body.appendChild(kotak);
  }
  kotak.textContent = pesan;
  kotak.hidden = false;
  clearTimeout(kotak.timer);
  kotak.timer = setTimeout(() => { kotak.hidden = true; }, 3500);
}

// ---------- Tabel ----------
function tambahBaris(idTabel, sel, id) {
  const baris = document.getElementById(idTabel).tBodies[0].insertRow();
  baris.innerHTML = sel.map((isi) => `<td>${isi}</td>`).join('');
  if (id) baris.dataset.id = id;
  hitungStatistik();
  return baris;
}
function ubahBadge(baris, teks) {
  const lencana = baris.querySelector('.badge');
  lencana.textContent = teks;
  lencana.className = 'badge ' + kelasStatus[teks];
}
function cariBaris(idTabel, kolom, nilai) {
  const baris = [...document.getElementById(idTabel).tBodies[0].rows];
  return baris.find((b) => b.cells[kolom] && b.cells[kolom].textContent.trim() === nilai);
}
// Kartu statistik: data-hitung="#tabel|Teks Status" (tanpa status = jumlah baris data)
function hitungStatistik() {
  document.querySelectorAll('[data-hitung]').forEach((kartu) => {
    const [selektor, status] = kartu.dataset.hitung.split('|');
    const tabel = document.querySelector(selektor);
    kartu.textContent = status
      ? [...tabel.querySelectorAll('.badge')].filter((b) => b.textContent === status).length
      : tabel.tBodies[0].rows.length - 1;
  });
}

// ---------- Pesanan dari beranda (disimpan di browser ini saja) ----------
function bacaPesanan() {
  try { return JSON.parse(localStorage.getItem('pesananBaru')) || []; } catch (e) { return []; }
}
function simpanPesanan(daftar) {
  try { localStorage.setItem('pesananBaru', JSON.stringify(daftar)); } catch (e) { /* diabaikan */ }
}
const tombolPesanan = '<button class="btn btn-small" data-status="accepted">Terima</button> <button class="btn btn-danger btn-small" data-status="rejected">Tolak</button>';

if (document.getElementById('tabel-pesanan')) {
  bacaPesanan().forEach((p) => {
    tambahBaris('tabel-pesanan', [esc(p.nama), `${esc(p.hp)} / ${esc(p.email)}`, esc(p.kamar), tanggal(p.tanggal), badge('Menunggu'), tombolPesanan], p.id);
  });
}

// ---------- Formulir ----------
const aksiForm = {
  pesan(data) {
    const daftar = bacaPesanan();
    daftar.push({ id: Date.now(), nama: data.get('nama').trim(), hp: data.get('hp'), email: data.get('email'), kamar: data.get('kamar').split(' ')[0], tanggal: data.get('tanggal') });
    simpanPesanan(daftar);
  },
  kamar(data) {
    tambahBaris('tabel-kamar', [esc(data.get('nomor')), esc(data.get('lantai')), rupiah(data.get('harga')), badge(data.get('status')),
      '<button class="btn btn-secondary btn-small" data-pesan="Perubahan kamar disimulasikan, data tidak disimpan.">Ubah</button>']);
  },
  tagihan(data, form) {
    const sewa = Number(data.get('penghuni'));
    const nama = form.elements.penghuni.selectedOptions[0].text.split(' (')[0];
    const total = sewa + Number(data.get('listrik')) + Number(data.get('air'));
    tambahBaris('tabel-tagihan', [nama, bulanTahun(data.get('periode')), rupiah(sewa), rupiah(data.get('listrik')), rupiah(data.get('air')), rupiah(total), badge('Belum Dibayar')]);
  },
  keluhan(data) {
    tambahBaris('tabel-keluhan', [esc(data.get('judul')), tanggal(hariIni), badge('Menunggu')]);
  },
  bukti(data, form) {
    const pilihan = form.elements.tagihan.selectedOptions[0];
    const [periode, jumlah] = pilihan.text.split(' - ');
    tambahBaris('tabel-riwayat', [periode, jumlah, tanggal(hariIni), esc(data.get('bukti').name), badge('Menunggu')]);
    const tagihan = cariBaris('tabel-tagihan', 0, periode);
    if (tagihan) ubahBadge(tagihan, 'Menunggu Verifikasi');
    const status = document.getElementById('status-bayar');
    if (status) status.textContent = 'Menunggu Verifikasi';
    pilihan.remove();
  },
};
document.querySelectorAll('form[data-simulasi]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const aksi = aksiForm[form.dataset.aksi];
    if (aksi) aksi(new FormData(form), form);
    notify(form.dataset.simulasi);
    form.reset();
  });
});

// Pesan validasi dalam bahasa Indonesia
document.addEventListener('invalid', (e) => {
  const el = e.target;
  if (el.validity.valueMissing) el.setCustomValidity('Kolom ini wajib diisi.');
  else if (el.validity.patternMismatch) el.setCustomValidity(el.title || 'Format tidak sesuai.');
  else if (el.validity.typeMismatch) el.setCustomValidity('Format tidak valid.');
  else if (el.validity.rangeUnderflow) el.setCustomValidity('Nilai terlalu kecil atau tanggal sudah lewat.');
}, true);
document.addEventListener('input', (e) => { if (e.target.setCustomValidity) e.target.setCustomValidity(''); });
document.querySelectorAll('input[data-min-hari-ini]').forEach((i) => { i.min = hariIni; });

// ---------- Tombol Terima / Tolak (dasbor pemilik) ----------
function jadikanPenghuni(baris) {
  const [hp, email] = baris.cells[1].textContent.split(' / ');
  const kamar = baris.cells[2].textContent;
  tambahBaris('tabel-penghuni', [esc(baris.cells[0].textContent), esc(email || '-'), esc(hp), kamar, baris.cells[3].textContent, 'Aktif']);
  const barisKamar = cariBaris('tabel-kamar', 0, kamar);
  if (barisKamar) ubahBadge(barisKamar, 'Terisi');
}
document.addEventListener('click', (e) => {
  const pesan = e.target.closest('button[data-pesan]');
  if (pesan) notify(pesan.dataset.pesan);

  const tombol = e.target.closest('[data-status]');
  if (!tombol) return;
  const baris = tombol.closest('tr');
  const tabel = baris.closest('table').id;
  const diterima = tombol.dataset.status !== 'rejected';

  if (tabel === 'tabel-pesanan') {
    ubahBadge(baris, diterima ? 'Diterima' : 'Ditolak');
    if (diterima) jadikanPenghuni(baris);
    simpanPesanan(bacaPesanan().filter((p) => String(p.id) !== baris.dataset.id));
    notify(diterima ? 'Pesanan diterima. Data menjadi penghuni dan kamar menjadi Terisi (simulasi).' : 'Pesanan ditolak (simulasi).');
  } else if (tabel === 'tabel-pembayaran') {
    ubahBadge(baris, diterima ? 'Terverifikasi' : 'Ditolak');
    const tagihan = [...document.getElementById('tabel-tagihan').tBodies[0].rows]
      .find((r) => r.cells[0].textContent === baris.cells[0].textContent && r.cells[1].textContent === baris.cells[1].textContent);
    if (tagihan) ubahBadge(tagihan, diterima ? 'Lunas' : 'Belum Dibayar');
    notify(diterima ? 'Pembayaran terverifikasi, tagihan menjadi Lunas (simulasi).' : 'Pembayaran ditolak, tagihan kembali Belum Dibayar (simulasi).');
  }
  baris.cells[baris.cells.length - 1].textContent = '-';
  hitungStatistik();
});
document.addEventListener('change', (e) => {
  if (e.target.matches('select[data-pesan]')) notify(e.target.dataset.pesan);
});

// ---------- Beranda: saring kamar dan jendela detail ----------
const saring = document.getElementById('filter-status');
if (saring) {
  saring.addEventListener('change', () => {
    document.querySelectorAll('.room').forEach((kartu) => {
      const status = kartu.querySelector('.badge').textContent;
      kartu.hidden = saring.value !== '' && status !== saring.value;
    });
  });
}
const jendela = document.getElementById('detail');
if (jendela) {
  document.querySelectorAll('[data-detail]').forEach((tombol) => {
    tombol.addEventListener('click', () => {
      const kartu = tombol.closest('article');
      const isi = jendela.querySelector('.isi');
      isi.replaceChildren(...[...kartu.querySelectorAll('img, h3, p')].map((el) => el.cloneNode(true)));
      jendela.showModal();
    });
  });
  jendela.addEventListener('click', (e) => {
    if (e.target === jendela || e.target.closest('a')) jendela.close();
  });
}

// ---------- Dasbor: tandai menu sesuai bagian yang sedang dilihat ----------
const menu = document.querySelectorAll('.sidebar a');
if (menu.length && 'IntersectionObserver' in window) {
  const pengamat = new IntersectionObserver((daftar) => {
    daftar.forEach((d) => {
      if (d.isIntersecting) menu.forEach((a) => a.classList.toggle('aktif', a.getAttribute('href') === '#' + d.target.id));
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  menu.forEach((a) => { const bagian = document.querySelector(a.getAttribute('href')); if (bagian) pengamat.observe(bagian); });
}

hitungStatistik();
