# TUBES 2 Strategi Algoritma- DOM Explorer


DOM Explorer adalah aplikasi berbasis web interaktif untuk menelusuri, mengekstraksi, dan memvisualisasikan struktur Document Object Model (DOM) dari sebuah halaman HTML atau URL secara utuh. Aplikasi ini dikembangkan untuk memenuhi Tugas Besar 2 mata kuliah IF2211 Strategi Algoritma.

## Penjelasan Singkat Algoritma

Aplikasi ini menggunakan dua algoritma pencarian fundamental untuk mengevaluasi dan mencocokkan pola *Cascading Style Sheets* (CSS) *Selector* terhadap pohon DOM:

* **Breadth-First Search (BFS):** BFS adalah algoritma penelusuran graf dan pohon yang mengeksplorasi node secara melebar. Algoritma ini diimplementasikan menggunakan struktur data *queue* berprinsip First-In-First-Out (FIFO). Pada pohon DOM, algoritma ini memaksa mesin untuk menyelesaikan pembacaan seluruh elemen di satu lapis kedalaman yang sama sebelum menuruni lapisan hierarki dokumen berikutnya.
* **Depth-First Search (DFS):** DFS adalah algoritma penelusuran yang mengeksplorasi node secara mendalam sebelum melebar. Algoritma ini diimplementasikan menggunakan struktur data *stack* berprinsip Last-In-First-Out (LIFO). Saat diaplikasikan pada DOM, algoritma ini akan terus menyelam mengunjungi *child node* terdalam pada satu cabang sebelum melakukan *backtracking* dan mengunjungi cabang lainnya.

## Requirement Program

Untuk pengalaman instalasi terbaik dan menghindari konflik versi, sangat disarankan untuk menjalankan aplikasi ini menggunakan lingkungan kontainerisasi (Docker).

**Kebutuhan Utama:**
* Docker Engine & Docker Compose V2 (atau Docker Desktop)

**Kebutuhan Manual (Jika tidak menggunakan Docker):**
* Go Compiler (versi 1.25 atau lebih baru)
* Node.js (versi 20 atau lebih baru) beserta NPM

## Langkah-langkah Build dan Menjalankan Program

### Cara 1: Menjalankan dengan Docker (Direkomendasikan)
Cara termudah untuk menyalakan aplikasi adalah dengan menggunakan konfigurasi Docker Compose yang sudah disediakan.

1.  Buka terminal dan arahkan ke direktori utama (root) repositori.
2.  Jalankan perintah build berikut untuk membuat *image* dan menjalankan *container* di latar belakang:

    ```bash
    docker compose build --no-cache
    docker compose up -d
    ```
3.  Tunggu hingga proses kompilasi selesai. Buka browser dan akses aplikasi melalui `http://localhost:3000`.
4.  Untuk mematikan dan menghapus *container*, jalankan:
    ```bash
    docker compose down
    ```

### Cara 2: Menjalankan Secara Manual (Tanpa Docker)
Jika Anda ingin menjalankan aplikasi secara langsung di mesin lokal, *backend* dan *frontend* harus dijalankan di terminal yang terpisah.

**Menjalankan Backend (API):**
1.  Buka terminal dan masuk ke direktori *backend*:
    ```bash
    cd backend
    ```
2.  Unduh semua dependensi modul Go:
    ```bash
    go mod download
    ```
3.  Lakukan kompilasi dan jalankan *server*:
    ```bash
    go run ./cmd/server/main.go
    ```
    *(Backend akan berjalan di port 8080).*

**Menjalankan Frontend (Web UI):**
1.  Buka terminal baru dan masuk ke direktori proyek *frontend*:
    ```bash
    cd frontend/dom-explorer
    ```
2.  Pasang semua dependensi NPM:
    ```bash
    npm install
    ```
3.  Jalankan *server development* Next.js:
    ```bash
    npm run dev
    ```
    *(Frontend akan berjalan di port 3000).*

## Author



* Wisa Ahmaduta Dinutama / 18223003
* Nazwan Siddqi Muttaqin / 18223066
* Izhar Alif Akbar / 18223129

## Checklist Evaluasi

| No | Poin | Ya | Tidak |
|:---:|:--- |:---:|:---:|
| 1 | Aplikasi berhasil di kompilasi tanpa kesalahan | ✓ | |
| 2 | Aplikasi berhasil dijalankan | ✓ | |
| 3 | Aplikasi dapat menerima input URL web, pilihan algoritma, CSS selector, dan jumlah hasil | ✓ | |
| 4 | Aplikasi dapat melakukan scraping terhadap web pada input | ✓ | |
| 5 | Aplikasi dapat menampilkan visualisasi pohon DOM | ✓ | |
| 6 | Aplikasi dapat menelusuri pohon DOM dan menampilkan hasil penelusuran | ✓ | |
| 7 | Aplikasi dapat menandai jalur tempuh oleh algoritma | ✓ | |
| 8 | Aplikasi dapat menyimpan jalur yang ditempuh algoritma dalam traversal log | ✓ | |
| 9 | [Bonus] Membuat video | ✓ | |
| 10 | [Bonus] Deploy aplikasi | | ✓ |
| 11 | [Bonus] Implementasi animasi pada penelusuran pohon | ✓ | |
| 12 | [Bonus] Implementasi multithreading | | ✓ |
| 13 | [Bonus] Implementasi LCA Binary Lifting | | ✓ |
| 14 | [Bonus] Implementasi docker | ✓ | |
