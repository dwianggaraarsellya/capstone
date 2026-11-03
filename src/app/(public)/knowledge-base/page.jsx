
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';

const tutorialImages = {
  'how-to-order': [
    '/images/knowledge-base/how-to-order.webp',
    '/images/knowledge-base/how-to-order-2.webp',
    '/images/knowledge-base/how-to-order-3.webp',
  ],
  'how-to-checkout': [
    '/images/knowledge-base/how-to-checkout.webp',
    '/images/knowledge-base/how-to-checkout-2.webp',
    '/images/knowledge-base/how-to-checkout-3.webp',
  ],
  'how-to-use-voucher': [
    '/images/knowledge-base/how-to-use-voucher.webp',
    '/images/knowledge-base/how-to-use-voucher-2.webp',
    '/images/knowledge-base/how-to-use-voucher-3.webp',
  ],
  'how-to-track-order': [
    '/images/knowledge-base/how-to-track-order.webp',
    '/images/knowledge-base/how-to-track-order-2.webp',
    '/images/knowledge-base/how-to-track-order-3.webp',
  ],
};

function KnowledgeBaseContent() {
  const [selectedTopic, setSelectedTopic] = useState('how-to-order');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const topics = [
    {
      id: 'how-to-order',
      title: 'Tutorial Belanja',
      steps: [
        {
          num: "1",
          heading: "Jelajahi Produk Pilihan",
          body: "Kunjungi halaman Katalog Produk ('Produk Segar'). Gunakan pencarian atau filter kategori seperti daun hijau, buah, atau rempah untuk menemukan bahan masakan Anda."
        },
        {
          num: "2",
          heading: "Tambahkan ke Keranjang",
          body: "Tentukan jumlah satuan atau per 250g yang Anda inginkan, lalu klik tombol 'Masukkan Keranjang' di kartu produk."
        },
        {
          num: "3",
          heading: "Selesaikan Pemesanan",
          body: "Klik ikon tas belanja di pojok kanan atas Header untuk meninjau sayur-mayur yang telah Anda kumpulkan, lalu lanjutkan ke halaman pemesanan."
        }
      ]
    },
    {
      id: 'how-to-checkout',
      title: 'Pemesanan & Pembayaran',
      steps: [
        {
          num: "1",
          heading: "Lengkapi Alamat Kirim",
          body: "Pada formulir pemesanan, pastikan nama penerima, nomor WhatsApp aktif, dan koordinat detail alamat pengantaran terisi lengkap."
        },
        {
          num: "2",
          heading: "Pilih Jadwal & Kurir",
          body: "Pilih jadwal pengantaran fajar kami serta metode bayar digital yang Anda kehendaki (VA Bank, GoPay, QRIS, dll)."
        },
        {
          num: "3",
          heading: "Selesaikan Pembayaran",
          body: "Klik 'Bayar Sekarang' dan lakukan transfer sesuai nominal. Pesanan Anda otomatis terjadwal untuk panen fajar."
        }
      ]
    },
    {
      id: 'how-to-use-voucher',
      title: 'Gunakan Voucher',
      steps: [
        {
          num: "1",
          heading: "Temukan Kode Promo",
          body: "Periksa banner halaman beranda atau perhatikan info promo eksklusif bulanan yang dibagikan lewat newsletter TaniCo."
        },
        {
          num: "2",
          heading: "Masukkan di Kolom Voucher",
          body: "Sebelum menyelesaikan pesanan, ketik atau tempelkan kode voucher Anda (contoh: TANICOPERDANA) pada kolom voucher yang tersedia."
        },
        {
          num: "3",
          heading: "Verifikasi Potongan Harga",
          body: "Sistem otomatis memangkas subtotal belanjaan Anda secara real-time. Pastikan diskon sudah teraplikasi sebelum membayar."
        }
      ]
    },
    {
      id: 'how-to-track-order',
      title: 'Lihat Pesanan',
      steps: [
        {
          num: "1",
          heading: "Kunjungi Halaman Akun",
          body: "Klik avatar profil Anda di bagian Header atau navigasikan langsung ke alamat halaman /akun."
        },
        {
          num: "2",
          heading: "Pilih Menu Transaksi",
          body: "Masuk ke sub-menu 'Transaksi Saya' untuk meninjau seluruh riwayat pendaftaran belanja sayuran Anda."
        },
        {
          num: "3",
          heading: "Cek Status Terkini",
          body: "Pantau label status orderan Anda: Menunggu Pembayaran, Diproses (Sedang Dipanen Fajar), Dikirim (Diperjalanan Kurir), atau Selesai."
        }
      ]
    }
  ];

  const activeTopicObj = topics.find(t => t.id === selectedTopic);
  const activeImages = tutorialImages[selectedTopic] || tutorialImages['how-to-order'];

  const handleTopicChange = (topicId) => {
    setSelectedTopic(topicId);
    setSelectedImageIndex(0);
  };

  const handlePreviousImage = () => {
    setSelectedImageIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) =>
      Math.min(activeImages.length - 1, prev + 1)
    );
  };

  return (
    <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-24 text-left">

      {/* Page Header Banner */}
      <section className="relative bg-[#1B4D3E] text-white py-16 px-6 md:px-8 text-center overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <h1 className="text-[32px] md:text-[38px] font-bold font-sans tracking-tight">
            Basis Pengetahuan TaniCo
          </h1>

          <p className="text-[#E3EBF0]/80 text-[13px] md:text-[15px] font-light max-w-xl mx-auto">
            Pelajari cara memanfaatkan fitur situs TaniCo untuk pengalaman berbelanja sayur segar organik fajar yang praktis, cepat, dan menguntungkan.
          </p>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* COLUMN LEFT: IMAGE SLIDER */}
          <div className="lg:sticky lg:top-24 self-center flex items-center justify-center py-8">
            <div className="w-full max-w-[500px]">

              {/* Image Container */}
              <div
                id="tutorial-image-container"
                className="relative w-full max-w-[300px] aspect-[435/885] mx-auto rounded-3xl overflow-hidden border border-[#DDE9DF] bg-white">
                <Image
  key={`${selectedTopic}-${selectedImageIndex}`}
  src={activeImages[selectedImageIndex]}
  alt={`Tutorial TaniCo ${selectedImageIndex + 1}`}
  fill
  sizes="300px"
  className="object-contain"
  loading="lazy"
/>
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={handlePreviousImage}
                  disabled={selectedImageIndex === 0}
                  aria-label="Gambar sebelumnya"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 text-[#1B4D3E] shadow-md flex items-center justify-center hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={handleNextImage}
                  disabled={selectedImageIndex === activeImages.length - 1}
                  aria-label="Gambar berikutnya"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 text-[#1B4D3E] shadow-md flex items-center justify-center hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-full bg-black/55 text-white text-xs font-medium">
                  {selectedImageIndex + 1} / {activeImages.length}
                </div>
              </div>

              {/* Image Indicators */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {activeImages.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`Lihat gambar ${index + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${selectedImageIndex === index
                        ? 'w-7 bg-[#1B4D3E]'
                        : 'w-2 bg-[#C8D5CD] hover:bg-[#8BA99A]'
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN RIGHT: TUTORIAL CONTENT */}
          <div className="space-y-6 relative z-10">

            {/* Header Title */}
            <div className="space-y-4">
              <h2 className="text-[21px] lg:text-[37px] font-extrabold font-sans text-[#1B4D3E] tracking-tight leading-tight">
                Langkah Mudah Menikmati Hasil Kebun Terbaik
              </h2>

              <p className="text-gray-500 text-[13px] leading-relaxed">
                Kami menyederhanakan seluruh alur pembelian agar Anda tetap dapat memantau kesegaran dan transparansi asal sayur mayur lokal pilihan Anda secara real-time.
              </p>
            </div>

            {/* Horizontal Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-2">
              {topics.map((item) => {
                const isActive = selectedTopic === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTopicChange(item.id)}
                    className={`px-3 py-1.5 rounded-full border text-[11px] font-medium cursor-pointer select-none transition ${isActive
                        ? 'bg-[#1B4D3E] text-white border-[#1B4D3E]'
                        : 'bg-white text-gray-500 border-[#DDE9DF] hover:border-[#1B4D3E]'
                      }`}
                  >
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Vertical Steps List */}
            <div className="min-h-[280px]">
              <div className="space-y-5">
                {activeTopicObj.steps.map((st, idx) => (
                  <div key={idx} className="flex gap-6 items-start">

                    {/* Step Number */}
                    <div className="w-10 h-10 rounded-full bg-[#1B4D3E] text-white flex items-center justify-center font-bold shrink-0 text-[13px]">
                      {st.num}
                    </div>

                    {/* Step Content */}
                    <div className="space-y-1.5 pt-1.5">
                      <h4 className="font-bold text-[#1B4D3E] text-[15px] leading-snug">
                        {st.heading}
                      </h4>

                      <p className="text-gray-500 text-[12px] md:text-[13px] leading-relaxed">
                        {st.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

export default function KnowledgeBasePage() {
  return (
    <PageLayoutWrapper>
      <KnowledgeBaseContent />
    </PageLayoutWrapper>
  );
}