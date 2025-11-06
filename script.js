// Initialize data from localStorage
let dataPemeriksaan = JSON.parse(localStorage.getItem('dataPemeriksaan')) || [];

// Set tanggal hari ini sebagai default
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggalPemeriksaan').value = today;
    updateDataCount();
    
    // Add event listeners for pemeriksaan checkboxes
    initializePemeriksaanListeners();
});

// Initialize pemeriksaan checkbox listeners
function initializePemeriksaanListeners() {
    document.querySelectorAll('input[type="checkbox"][data-id]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const inputId = this.getAttribute('data-id');
            const inputContainer = document.getElementById(`input-${inputId}`);
            const inputField = inputContainer.querySelector('input, select');
            
            if (this.checked) {
                inputContainer.style.display = 'block';
                inputField.required = true;
            } else {
                inputContainer.style.display = 'none';
                inputField.required = false;
                inputField.value = '';
            }
        });
    });
}

// Toggle kategori pemeriksaan
document.querySelectorAll('.kategori-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const kategori = this.dataset.kategori;
        const list = document.getElementById(`list-${kategori}`);
        
        if (this.checked) {
            list.style.display = 'block';
        } else {
            list.style.display = 'none';
            // Uncheck all pemeriksaan in this category and hide inputs
            list.querySelectorAll('input[type="checkbox"][data-id]').forEach(cb => {
                cb.checked = false;
                const inputId = cb.getAttribute('data-id');
                const inputContainer = document.getElementById(`input-${inputId}`);
                inputContainer.style.display = 'none';
                const inputField = inputContainer.querySelector('input, select');
                inputField.value = '';
                inputField.required = false;
            });
        }
    });
});

// Toggle kategori header click
document.querySelectorAll('.kategori-header').forEach(header => {
    header.addEventListener('click', function(e) {
        if (e.target.tagName !== 'INPUT') {
            const checkbox = this.querySelector('.kategori-checkbox');
            checkbox.click();
        }
    });
});

// Form Submit - BAGIAN YANG DIMODIFIKASI
document.getElementById('pemeriksaanForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validasi kategori pemeriksaan
    const kategoriChecked = document.querySelectorAll('.kategori-checkbox:checked');
    
    if (kategoriChecked.length === 0) {
        showToast('Pilih minimal 1 kategori pemeriksaan!', 'error');
        return;
    }
    
    // Validasi minimal 1 pemeriksaan per kategori yang dipilih
    let validationPassed = true;
    let errorMessage = '';
    
    kategoriChecked.forEach(katCheckbox => {
        const kategori = katCheckbox.dataset.kategori;
        const pemeriksaanChecked = document.querySelectorAll(`input[name="pemeriksaan-${kategori}"]:checked`);
        
        if (pemeriksaanChecked.length === 0) {
            validationPassed = false;
            const katName = katCheckbox.parentElement.querySelector('label').textContent.trim();
            errorMessage = `Pilih minimal 1 pemeriksaan untuk kategori ${katName}!`;
        }
    });
    
    if (!validationPassed) {
        showToast(errorMessage, 'error');
        return;
    }
    
    // Collect form data
    const formData = {
        id: Date.now(),
        namaPasien: document.getElementById('namaPasien').value,
        umur: document.getElementById('umur').value,
        jenisKelamin: document.getElementById('jenisKelamin').value,
        tanggalPemeriksaan: document.getElementById('tanggalPemeriksaan').value,
        Alamat: document.getElementById('Alamat').value,
        klaster: document.getElementById('klaster').value,
        kategoriPemeriksaan: [],
        pemeriksaanDetail: []
    };
    
    // Collect selected categories and examinations with results
    kategoriChecked.forEach(katCheckbox => {
        const kategori = katCheckbox.dataset.kategori;
        const katName = katCheckbox.parentElement.querySelector('label').textContent.trim();
        formData.kategoriPemeriksaan.push(katName);
        
        const pemeriksaanChecked = document.querySelectorAll(`input[name="pemeriksaan-${kategori}"]:checked`);
        pemeriksaanChecked.forEach(cb => {
            const pemeriksaanName = cb.value;
            const inputId = cb.getAttribute('data-id');
            
            // ===== TAMBAHAN KHUSUS UNTUK WIDAL TEST =====
            if (inputId === 'widal-test') {
                const widalO_A = document.querySelector('input[name="hasil-widal-O-A"]')?.value || '-';
                const widalO_B = document.querySelector('input[name="hasil-widal-O-B"]')?.value || '-';
                const widalO_C = document.querySelector('input[name="hasil-widal-O-C"]')?.value || '-';
                const widalH_A = document.querySelector('input[name="hasil-widal-H-A"]')?.value || '-';
                const widalH_B = document.querySelector('input[name="hasil-widal-H-B"]')?.value || '-';
                const widalH_C = document.querySelector('input[name="hasil-widal-H-C"]')?.value || '-';
                
                const widalHasil = `O(A:${widalO_A}, B:${widalO_B}, C:${widalO_C}) | H(A:${widalH_A}, B:${widalH_B}, C:${widalH_C})`;
                
                formData.pemeriksaanDetail.push({
                    kategori: katName,
                    nama: pemeriksaanName,
                    hasil: widalHasil,
                    // Simpan juga data detail untuk keperluan lain
                    widalDetail: {
                        'O-A': widalO_A,
                        'O-B': widalO_B,
                        'O-C': widalO_C,
                        'H-A': widalH_A,
                        'H-B': widalH_B,
                        'H-C': widalH_C
                    }
                });
            } else {
                // Untuk pemeriksaan lain (tetap seperti semula)
                const hasilInput = document.querySelector(`[name="hasil-${inputId}"]`);
                const hasilValue = hasilInput ? hasilInput.value : '';
                
                formData.pemeriksaanDetail.push({
                    kategori: katName,
                    nama: pemeriksaanName,
                    hasil: hasilValue
                });
            }
        });
    });
    
    // Save to localStorage
    dataPemeriksaan.push(formData);
    localStorage.setItem('dataPemeriksaan', JSON.stringify(dataPemeriksaan));
    
    // Show success message
    showToast('Data berhasil disimpan!', 'success');
    
    // Reset form
    setTimeout(() => {
        resetForm();
        updateDataCount();
    }, 1000);
});

// Reset Form
function resetForm() {
    document.getElementById('pemeriksaanForm').reset();
    document.querySelectorAll('.kategori-checkbox').forEach(cb => {
        cb.checked = false;
    });
    document.querySelectorAll('.pemeriksaan-list').forEach(list => {
        list.style.display = 'none';
        list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        list.querySelectorAll('.input-hasil').forEach(input => {
            input.style.display = 'none';
        });
        list.querySelectorAll('.hasil-input').forEach(input => {
            input.value = '';
            input.required = false;
        });
    });
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggalPemeriksaan').value = today;
}

// Update Data Count
function updateDataCount() {
    const totalData = dataPemeriksaan.length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const dataBulanIni = dataPemeriksaan.filter(data => {
        const date = new Date(data.tanggalPemeriksaan);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
    
    document.getElementById('totalData').textContent = totalData;
    document.getElementById('dataBulanIni').textContent = dataBulanIni;
}

// Show Data Modal
function showData() {
    if (dataPemeriksaan.length === 0) {
        showToast('Belum ada data tersimpan', 'warning');
        return;
    }
    
    let tableHTML = `
        <div style="overflow-x: auto;">
        <table>
            <thead>
                <tr>
                    <th>No</th>
                    <th>Tanggal</th>
                    <th>Nama Pasien</th>
                    <th>Umur</th>
                    <th>JK</th>
                    <th>Alamat</th>
                    <th>Klaster</th>
                    <th>Pemeriksaan & Hasil</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    dataPemeriksaan.forEach((data, index) => {
        const pemeriksaanStr = data.pemeriksaanDetail.map(p => 
            `${p.nama}: ${p.hasil}`
        ).join('<br>');
        
        tableHTML += `
    <tr>
        <td>${index + 1}</td>
        <td>${formatDate(data.tanggalPemeriksaan)}</td>
        <td>${data.namaPasien}</td>
        <td>${data.umur}</td>
        <td>${data.jenisKelamin}</td>
        <td>${data.Alamat}</td> 
        <td>${data.klaster}</td>
        <td style="text-align: left;">${pemeriksaanStr}</td>
        <td>
            <button onclick="deleteData(${data.id})" style="background: #dc3545; color: white; border-radius: 5px; cursor: pointer;">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    </tr>
`;
    });
    
    tableHTML += '</tbody></table></div>';
    
    document.getElementById('dataTableContainer').innerHTML = tableHTML;
    document.getElementById('dataModal').style.display = 'block';
}

// Close Modal
function closeModal() {
    document.getElementById('dataModal').style.display = 'none';
}

// Delete Single Data
function deleteData(id) {
    if (confirm('Yakin ingin menghapus data ini?')) {
        dataPemeriksaan = dataPemeriksaan.filter(data => data.id !== id);
        localStorage.setItem('dataPemeriksaan', JSON.stringify(dataPemeriksaan));
        showToast('Data berhasil dihapus!', 'success');
        showData();
        updateDataCount();
    }
}

// Confirm Delete All
function confirmDeleteAll() {
    if (dataPemeriksaan.length === 0) {
        showToast('Tidak ada data untuk dihapus', 'warning');
        return;
    }
    
    if (confirm('PERINGATAN! Yakin ingin menghapus SEMUA data?\nTindakan ini tidak dapat dibatalkan!')) {
        dataPemeriksaan = [];
        localStorage.setItem('dataPemeriksaan', JSON.stringify(dataPemeriksaan));
        showToast('Semua data berhasil dihapus!', 'success');
        updateDataCount();
        closeModal();
    }
}
// Tambahkan fungsi ini di atas fungsi exportToExcel
function formatHasilForExcel(pemeriksaan) {
    if (pemeriksaan.widalDetail) {
        // Format khusus untuk Widal di Excel
        return `O: A=${pemeriksaan.widalDetail['O-A']}, B=${pemeriksaan.widalDetail['O-B']}, C=${pemeriksaan.widalDetail['O-C']} | H: A=${pemeriksaan.widalDetail['H-A']}, B=${pemeriksaan.widalDetail['H-B']}, C=${pemeriksaan.widalDetail['H-C']}`;
    }
    return formatHasilForExcel;
}
// Export to Excel
function exportToExcel() {
    if (dataPemeriksaan.length === 0) {
        showToast('Tidak ada data untuk diekspor', 'warning');
        return;
    }
    
    const wb = XLSX.utils.book_new();
    
    // ===== SHEET 1: DATA PASIEN =====
    const worksheetData = [];
    
    // Header
    worksheetData.push(['REKAPITULASI DATA PASIEN']);
    worksheetData.push(['UPTD PUSKESMAS MEUREUBO']);
    worksheetData.push(['']);
    
    const currentDate = new Date();
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    worksheetData.push([`Periode: ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`]);
    worksheetData.push(['']);
    
    // Table Header
    worksheetData.push(['No', 'Tanggal', 'Nama Pasien', 'Umur', 'JK', 'Alamat', 'Klaster', 'Pemeriksaan', 'Hasil']);
    
    // Table Data
    dataPemeriksaan.forEach((data, index) => {
        data.pemeriksaanDetail.forEach((pemeriksaan, pIndex) => {
            if (pIndex === 0) {
                worksheetData.push([
                    index + 1,
                    formatDate(data.tanggalPemeriksaan),
                    data.namaPasien,
                    data.umur,
                    data.jenisKelamin,
                    data.Alamat,
                    data.klaster,
                    pemeriksaan.nama,
                    pemeriksaan.hasil
                ]);
            } else {
                worksheetData.push([
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    pemeriksaan.nama,
                    pemeriksaan.hasil
                ]);
            }
        });
    });
    
    // Add empty rows
    worksheetData.push(['']);
    worksheetData.push(['']);
    
    // ===== STATISTIK =====
    worksheetData.push(['STATISTIK PEMERIKSAAN']);
    worksheetData.push(['']);
    
    // Gender statistics table
    const lakiLaki = dataPemeriksaan.filter(d => d.jenisKelamin === 'Laki-laki').length;
    const perempuan = dataPemeriksaan.filter(d => d.jenisKelamin === 'Perempuan').length;
    
    worksheetData.push(['STATISTIK BERDASARKAN JENIS KELAMIN']);
    worksheetData.push(['Jenis Kelamin', 'Jumlah', 'Persentase']);
    worksheetData.push(['Laki-laki', lakiLaki, `${((lakiLaki / dataPemeriksaan.length) * 100).toFixed(1)}%`]);
    worksheetData.push(['Perempuan', perempuan, `${((perempuan / dataPemeriksaan.length) * 100).toFixed(1)}%`]);
    worksheetData.push(['Total', lakiLaki + perempuan, '100%']);
    worksheetData.push(['']);
    
    // Klaster statistics table
    const klasterCount = {};
    dataPemeriksaan.forEach(data => {
        klasterCount[data.klaster] = (klasterCount[data.klaster] || 0) + 1;
    });
    
    worksheetData.push(['STATISTIK BERDASARKAN KLASTER']);
    worksheetData.push(['Klaster', 'Jumlah', 'Persentase']);
    Object.keys(klasterCount).forEach(klaster => {
        const count = klasterCount[klaster];
        worksheetData.push([klaster, count, `${((count / dataPemeriksaan.length) * 100).toFixed(1)}%`]);
    });
    worksheetData.push(['Total', dataPemeriksaan.length, '100%']);
    worksheetData.push(['']);
    
    // Category statistics table
    const categoryCount = {};
    dataPemeriksaan.forEach(data => {
        data.kategoriPemeriksaan.forEach(kat => {
            categoryCount[kat] = (categoryCount[kat] || 0) + 1;
        });
    });
    
    worksheetData.push(['STATISTIK BERDASARKAN KATEGORI PEMERIKSAAN']);
    worksheetData.push(['Kategori Pemeriksaan', 'Jumlah']);
    Object.keys(categoryCount).sort((a, b) => categoryCount[b] - categoryCount[a]).forEach(kat => {
        worksheetData.push([kat, categoryCount[kat]]);
    });
    worksheetData.push(['']);
    
    // Specific examination statistics table
    const examCount = {};
    dataPemeriksaan.forEach(data => {
        data.pemeriksaanDetail.forEach(exam => {
            examCount[exam.nama] = (examCount[exam.nama] || 0) + 1;
        });
    });
    
    worksheetData.push(['STATISTIK BERDASARKAN JENIS PEMERIKSAAN']);
    worksheetData.push(['Jenis Pemeriksaan', 'Jumlah']);
    Object.keys(examCount).sort((a, b) => examCount[b] - examCount[a]).forEach(exam => {
        worksheetData.push([exam, examCount[exam]]);
    });
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Merge cells for title
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Title row 1
        { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Title row 2
        { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } }  // Periode
    ];
    
    // Set column widths
    ws['!cols'] = [
        { wch: 5 },  // No
        { wch: 12 }, // Tanggal
        { wch: 25 }, // Nama
        { wch: 8 },  // Umur
        { wch: 12 }, // JK
        { wch: 30 }, // Alamat
        { wch: 12 }, // Klaster
        { wch: 35 }, // Pemeriksaan
        { wch: 20 }  // Hasil
    ];
    
    // Style for header cells
    const headerStyle = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: "4472C4" } }
    };
    
    // Apply styles to title
    ['A1', 'A2', 'A4'].forEach(cell => {
        if (ws[cell]) {
            ws[cell].s = headerStyle;
        }
    });
    
    XLSX.utils.book_append_sheet(wb, ws, 'Data Pemeriksaan');
    
    // Generate filename
    const filename = `Rekapitulasi_Data_Pasien_${monthNames[currentDate.getMonth()]}_${currentDate.getFullYear()}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
    
    showToast('Data berhasil diekspor ke Excel!', 'success');
}

// Show Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('dataModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
    }
