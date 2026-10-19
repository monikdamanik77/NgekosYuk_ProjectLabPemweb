const PREFIKS = 'ngekos:';
const kelasStatus = {
  'Tersedia': 'badge-success', 'Terisi': 'badge-danger', 'Dalam Perbaikan': 'badge-warning',
  'Menunggu': 'badge-warning', 'Diterima': 'badge-success', 'Ditolak': 'badge-danger',
  'Belum Dibayar': 'badge-danger', 'Menunggu Verifikasi': 'badge-warning', 'Lunas': 'badge-success',
  'Terverifikasi': 'badge-success', 'Sedang Diproses': 'badge-info', 'Selesai': 'badge-success', 'Aktif': 'badge-success',
};
const hariIni = new Date().toISOString().slice(0, 10);
const badge = (teks) => `<span class="badge ${kelasStatus[teks]}">${teks}</span>`;
const rupiah = (angka) => 'Rp ' + Number(angka).toLocaleString('id-ID');
const tanggal = (nilai) => new Date(nilai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const bulanTahun = (nilai) => new Date(nilai + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
const esc = (teks) => String(teks).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tombolTerimaTolak = (ya) => `<button type="button" class="btn-sm" data-status="${ya}">Terima</button> <button type="button" class="btn-sm btn-sm-danger" data-status="rejected">Tolak</button>`;
const tombolKamar = '<button type="button" class="btn-sm btn-sm-ghost" data-pesan="Perubahan kamar disimulasikan, data tidak disimpan.">Ubah</button> <button type="button" class="btn-sm btn-sm-danger" data-hapus>Hapus</button>';
const pilihanStatus = (aktif) => '<select class="select-kecil" data-pesan="Status keluhan diperbarui (simulasi).">'
  + ['Menunggu', 'Sedang Diproses', 'Selesai'].map((s) => `<option${s === aktif ? ' selected' : ''}>${s}</option>`).join('') + '</select>';

function notify(pesan) {
  let kotak = document.getElementById('toast');
  if (!kotak) {
    kotak = document.createElement('div');
    kotak.id = 'toast';
    kotak.className = 'toast';
    kotak.setAttribute('role', 'status');
    document.body.appendChild(kotak);
  }
  kotak.textContent = pesan;
  kotak.hidden = false;
  clearTimeout(kotak.timer);
  kotak.timer = setTimeout(() => { kotak.hidden = true; }, 3500);
}

function bacaDaftar(kunci) {
  try { return JSON.parse(localStorage.getItem(PREFIKS + kunci)) || []; } catch (e) { return []; }
}
function tulisDaftar(kunci, daftar) {
  try { localStorage.setItem(PREFIKS + kunci, JSON.stringify(daftar)); } catch (e) { /* diabaikan */ }
  if (typeof hitungStatistik === 'function') hitungStatistik();
}
function hapusDariDaftar(kunci, id) {
  tulisDaftar(kunci, bacaDaftar(kunci).filter((item) => item.id !== id));
}

function isiBaris(tabel, item) {
  const baris = tabel.tBodies[0].insertRow();
  baris.dataset.id = item.id;
  baris.innerHTML = item.sel.map((isi) => `<td>${isi}</td>`).join('');
  hitungStatistik();
}
function simpanDi(kunci, sel) {
  const item = { id: Date.now() + Math.random().toString(36).slice(2, 6), sel };
  tulisDaftar(kunci, [...bacaDaftar(kunci), item]);
  const tabel = document.querySelector(`table[data-simpan="${kunci}"]`);
  if (tabel) isiBaris(tabel, item);
}
function ubahBadge(baris, teks) {
  const lencana = baris.querySelector('.badge');
  if (lencana) {
    lencana.textContent = teks;
    lencana.className = 'badge ' + kelasStatus[teks];
  }
  hitungStatistik();
}
function hitungStatistik() {
  document.querySelectorAll('[data-hitung]').forEach((kartu) => {
    const [selektor, status] = kartu.dataset.hitung.split('|');
    const tabel = document.querySelector(selektor);
    if (!tabel) return;
    kartu.textContent = status
      ? [...tabel.tBodies[0].querySelectorAll('.badge')].filter((b) => b.textContent === status).length
      : tabel.tBodies[0].rows.length;
  });

  const tabelPembayaran = document.getElementById('tabel-pembayaran');
  if (tabelPembayaran) {
    let totalPendapatan = 0;
    [...tabelPembayaran.tBodies[0].rows].forEach(row => {
      const statusBadge = row.querySelector('.badge');
      if (statusBadge && statusBadge.textContent.trim() === 'Terverifikasi') {
        const jumlahText = row.cells[2].textContent.replace(/[^0-9]/g, '');
        totalPendapatan += Number(jumlahText) || 0;
      }
    });
    const elPendapatan = document.getElementById('total-pendapatan');
    if (elPendapatan) {
      elPendapatan.textContent = totalPendapatan > 0 ? rupiah(totalPendapatan) : 'Rp 1.090.000';
    }
  }
}
function kunciBaris(baris) {
  return baris.closest('table').id + ':' + baris.cells[0].textContent.trim() + '|' + baris.cells[1].textContent.trim();
}
function bacaStatus() {
  try { return JSON.parse(localStorage.getItem(PREFIKS + 'status')) || {}; } catch (e) { return {}; }
}
function simpanStatus(baris, teks) {
  const semua = bacaStatus();
  semua[kunciBaris(baris)] = teks;
  try { localStorage.setItem(PREFIKS + 'status', JSON.stringify(semua)); } catch (e) { /* diabaikan */ }
}
function terapkanStatus() {
  const semua = bacaStatus();
  document.querySelectorAll('#tabel-pesanan tbody tr, #tabel-pembayaran tbody tr').forEach((baris) => {
    const teks = semua[kunciBaris(baris)];
    if (teks && baris.querySelector('[data-status]')) {
      ubahBadge(baris, teks);
      baris.cells[baris.cells.length - 1].textContent = '-';
    }
  });
}
function cariBaris(idTabel, kolom, nilai) {
  const tabel = document.getElementById(idTabel);
  if (!tabel) return undefined;
  return [...tabel.tBodies[0].rows].find((b) => b.cells[kolom] && b.cells[kolom].textContent.trim() === nilai);
}

document.querySelectorAll('table[data-simpan]').forEach((tabel) => {
  bacaDaftar(tabel.dataset.simpan).forEach((item) => isiBaris(tabel, item));
});

bacaDaftar('kamar-terisi').forEach((nomor) => {
  const baris = cariBaris('tabel-kamar', 0, nomor);
  if (baris) ubahBadge(baris, 'Terisi');
});

terapkanStatus();
hitungStatistik();

const aksiForm = {
  pesan(data) {
    const kamar = data.get('kamar').replace('Kamar ', '');
    simpanDi('pesanan', [esc(data.get('nama').trim()), `${esc(data.get('hp'))} / ${esc(data.get('email'))}`, esc(kamar), tanggal(data.get('tanggal')), badge('Menunggu'), tombolTerimaTolak('accepted')]);
  },
  kamar(data) {
    const nomorKamar = esc(data.get('nomor'));
    const statusKamar = data.get('status');
    simpanDi('kamar', [nomorKamar, esc(data.get('lantai')), rupiah(data.get('harga')), esc(data.get('fasilitas')), badge(statusKamar), tombolKamar]);

    const gridKamar = document.getElementById('grid-kamar');
    if (gridKamar) {
      const badgeClass = statusKamar === 'Tersedia' ? 'bg-emerald-100 text-emerald-700' : (statusKamar === 'Terisi' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700');
      const kartuBaru = document.createElement('div');
      kartuBaru.setAttribute('data-room', '');
      kartuBaru.setAttribute('data-status-kamar', statusKamar);
      kartuBaru.className = 'bg-white rounded-2xl overflow-hidden border border-sky-100 shadow-sm hover:shadow-md transition';
      kartuBaru.innerHTML = `
        <div class="relative h-48 bg-gray-200">
            <img src="images/room-a.jpeg" alt="Kamar ${nomorKamar}" class="w-full h-full object-cover">
            <span class="absolute top-3 right-3 ${badgeClass} text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">${statusKamar}</span>
        </div>
        <div class="p-5">
            <div class="flex justify-between items-start mb-1">
                <h3 class="font-bold text-[#14285A] text-lg">Kamar ${nomorKamar}</h3>
                <span class="text-xs text-gray-500">Lantai ${esc(data.get('lantai'))}</span>
            </div>
            <div class="flex flex-wrap gap-1.5 mb-4">
                ${esc(data.get('fasilitas')).split(',').map(f => `<span class="bg-sky-50 text-sky-700 text-[11px] px-2 py-0.5 rounded">${f.trim()}</span>`).join('')}
            </div>
            <div class="flex items-center justify-between">
                <div class="text-sky-600 font-semibold text-sm">${rupiah(data.get('harga'))} <span class="text-gray-500 text-xs font-normal">/ bulan</span></div>
                <button type="button" data-detail class="border border-gray-200 hover:border-sky-500 text-gray-700 hover:text-sky-600 text-xs font-medium px-3.5 py-2 rounded-xl transition">Lihat Detail</button>
            </div>
        </div>`;
      gridKamar.appendChild(kartuBaru);
    }
  },
  tagihan(data, form) {
    const sewa = Number(data.get('penghuni'));
    const nama = form.elements.penghuni.selectedOptions[0].text.split(' (')[0];
    const [listrik, air] = [Number(data.get('listrik')), Number(data.get('air'))];
    const periode = bulanTahun(data.get('periode'));
    simpanDi('tagihan', [nama, periode, rupiah(sewa), rupiah(listrik), rupiah(air), rupiah(sewa + listrik + air), badge('Belum Dibayar')]);
    if (nama === 'Budi Santoso') {
      simpanDi('tagihan-saya', [periode, rupiah(sewa), rupiah(listrik), rupiah(air), rupiah(sewa + listrik + air), tanggal(data.get('tempo')), badge('Belum Dibayar')]);
    }
  },
  keluhan(data) {
    simpanDi('keluhan-saya', [esc(data.get('judul')), esc(data.get('deskripsi')), tanggal(hariIni), badge('Menunggu')]);
    simpanDi('keluhan', ['Budi Santoso', esc(data.get('judul')), esc(data.get('deskripsi')), tanggal(hariIni), pilihanStatus('Menunggu')]);
  },
  bukti(data, form) {
    const pilihan = form.elements.tagihan.selectedOptions[0];
    const [periode, jumlah] = pilihan.text.split(' - ');
    const metode = data.get('metode');
    const berkas = esc(data.get('bukti').name);
    simpanDi('riwayat', [periode, jumlah, metode, tanggal(hariIni), berkas, badge('Menunggu')]);
    simpanDi('pembayaran', ['Budi Santoso', periode, jumlah, metode, berkas, badge('Menunggu'), tombolTerimaTolak('verified')]);
    const baris = cariBaris('tabel-tagihan-saya', 0, periode);
    if (baris) ubahBadge(baris, 'Menunggu Verifikasi');
    pilihan.remove();
  },
};
document.querySelectorAll('form[data-simulasi]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const aksi = aksiForm[form.dataset.aksi];
    if (aksi) aksi(new FormData(form), form);
    notify(form.dataset.simulasi);
    if (form.dataset.aksi !== 'profil') form.reset();
  });
});

document.addEventListener('invalid', (e) => {
  const el = e.target;
  if (el.validity.valueMissing) el.setCustomValidity('Kolom ini wajib diisi.');
  else if (el.validity.patternMismatch) el.setCustomValidity(el.title || 'Format tidak sesuai.');
  else if (el.validity.typeMismatch) el.setCustomValidity('Format tidak valid.');
  else if (el.validity.rangeUnderflow) el.setCustomValidity('Nilai terlalu kecil atau tanggal sudah lewat.');
}, true);
document.addEventListener('input', (e) => { if (e.target.setCustomValidity) e.target.setCustomValidity(''); });
document.querySelectorAll('input[data-min-hari-ini]').forEach((i) => { i.min = hariIni; });

const toggleSandiBtn = document.getElementById('toggle-sandi');
if (toggleSandiBtn) {
  toggleSandiBtn.addEventListener('click', () => {
    const inputSandi = document.getElementById('input-sandi');
    const iconSandi = document.getElementById('icon-sandi');
    if (inputSandi.type === 'password') {
      inputSandi.type = 'text';
      iconSandi.className = 'fa-solid fa-eye-slash';
    } else {
      inputSandi.type = 'password';
      iconSandi.className = 'fa-solid fa-eye';
    }
  });
}

document.addEventListener('click', (e) => {
  const pesan = e.target.closest('button[data-pesan]');
  if (pesan) notify(pesan.dataset.pesan);

  const hapus = e.target.closest('[data-hapus]');
  if (hapus) {
    const baris = hapus.closest('tr');
    if (!confirm(`Hapus kamar ${baris.cells[0].textContent}?`)) return;
    if (baris.dataset.id) hapusDariDaftar(baris.closest('table').dataset.simpan, baris.dataset.id);
    baris.remove();
    hitungStatistik();
    notify('Kamar dihapus (simulasi).');
  }

  const tombol = e.target.closest('button[data-status]');
  if (!tombol) return;
  const baris = tombol.closest('tr');
  const tabel = baris.closest('table');
  const diterima = tombol.dataset.status !== 'rejected';

  if (tabel.id === 'tabel-pesanan') {
    ubahBadge(baris, diterima ? 'Diterima' : 'Ditolak');
    if (diterima) {
      const [hp, email] = baris.cells[1].textContent.split(' / ');
      const kamar = baris.cells[2].textContent;
      simpanDi('penghuni', [esc(baris.cells[0].textContent), esc(email || '-'), esc(hp), esc(kamar), esc(baris.cells[3].textContent), badge('Aktif')]);
      tulisDaftar('kamar-terisi', [...bacaDaftar('kamar-terisi'), kamar]);
      const barisKamar = cariBaris('tabel-kamar', 0, kamar);
      if (barisKamar) ubahBadge(barisKamar, 'Terisi');
    }
    notify(diterima ? 'Pesanan diterima. Data penghuni dan status kamar diperbarui (simulasi).' : 'Pesanan ditolak (simulasi).');
  } else if (tabel.id === 'tabel-pembayaran') {
    ubahBadge(baris, diterima ? 'Terverifikasi' : 'Ditolak');
    notify(diterima ? 'Pembayaran terverifikasi, tagihan menjadi Lunas (simulasi).' : 'Pembayaran ditolak, tagihan kembali Belum Dibayar (simulasi).');
  }
  simpanStatus(baris, baris.querySelector('.badge').textContent);
  baris.cells[baris.cells.length - 1].textContent = '-';
  hitungStatistik();
});
document.addEventListener('change', (e) => {
  if (e.target.matches('select[data-pesan]')) notify(e.target.dataset.pesan);
});

const saring = document.getElementById('filter-status');
if (saring) {
  saring.addEventListener('change', () => {
    document.querySelectorAll('[data-room]').forEach((kartu) => {
      kartu.hidden = saring.value !== '' && kartu.dataset.statusKamar !== saring.value;
    });
  });
}
const jendela = document.getElementById('detail');
if (jendela) {
  document.querySelectorAll('[data-detail]').forEach((tombol) => {
    tombol.addEventListener('click', () => {
      const kartu = tombol.closest('[data-room]');
      const isi = jendela.querySelector('.isi');
      isi.innerHTML = kartu.innerHTML;
      isi.querySelector('[data-detail]').remove();
      if (kartu.dataset.statusKamar === 'Tersedia') {
        const nama = kartu.querySelector('h3').textContent.trim();
        isi.lastElementChild.insertAdjacentHTML('beforeend', `<a href="#pesan-kamar" data-kamar="${nama}" class="mt-4 block text-center bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium py-2.5 rounded-xl">Pesan kamar ini</a>`);
      }
      jendela.showModal();
    });
  });
  jendela.addEventListener('click', (e) => {
    const tautan = e.target.closest('a[data-kamar]');
    if (tautan) document.querySelector('form[data-aksi="pesan"]').elements.kamar.value = tautan.dataset.kamar;
    if (e.target === jendela || tautan) jendela.close();
  });
}

const formMasuk = document.getElementById('form-masuk');
if (formMasuk) {
  formMasuk.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = formMasuk.elements.email.value.trim();
    const sandi = formMasuk.elements.sandi.value;
    if (email === 'ownerku1@gmail.com' && sandi === 'owner123') location.href = 'pemilik.html';
    else if (email === 'budisantosoo@gmail.com' && sandi === 'tenant123') location.href = 'penghuni.html';
    else document.getElementById('galat').textContent = 'Email atau kata sandi salah.';
  });
}

const menuSamping = document.querySelectorAll('.menu-samping a');
if (menuSamping.length && 'IntersectionObserver' in window) {
  const pengamat = new IntersectionObserver((daftar) => {
    daftar.forEach((d) => {
      if (d.isIntersecting) menuSamping.forEach((a) => a.classList.toggle('aktif', a.getAttribute('href') === '#' + d.target.id));
    });
  }, { rootMargin: '-25% 0px -65% 0px' });
  menuSamping.forEach((a) => { const bagian = document.querySelector(a.getAttribute('href')); if (bagian) pengamat.observe(bagian); });
}