
import React from 'react';
import Image from 'next/image';
import PageLayoutWrapper from '@/components/layout/PageLayoutWrapper';

const COMPANY_PROFILE_SECTIONS = [
  {
    id: 'cerita-tanico',
    title: 'Cerita TaniCo',
    image: '/images/about/perkebunan.webp',
    imageAlt: 'Kebun pertanian mitra lokal TaniCo',
    summary:
      'TaniCo adalah platform pasar pertanian yang hadir sebagai jembatan langsung antara petani lokal dengan meja makan keluarga Indonesia. Kami berangkat dari kebutuhan akan akses pangan segar yang lebih transparan sekaligus memberikan apresiasi yang adil bagi para petani.',
    highlights: [
      'Memfasilitasi penyaluran hasil kebun petani mitra lokal secara langsung tanpa rantai perantara yang panjang.',
      'Mendorong praktik budidaya ramah lingkungan demi menjaga kesuburan ekosistem tanah.',
      'Menghadirkan kemudahan belanja hasil panen harian yang bersih, sehat, dan terukur asal-usulnya.',
    ],
  },
  {
    id: 'komitmen-kami',
    title: 'Komitmen Kami',
    image: '/images/about/value-kesegaran.webp',
    imageAlt: 'Komitmen kesegaran dan kualitas hasil panen TaniCo',
    summary:
      'Kepercayaan pelanggan dibangun melalui konsistensi mutu di setiap ikat sayuran yang dikirimkan. Kami menerapkan pengawasan berlapis pada empat pilar utama operasional harian TaniCo.',
    pillars: [
      {
        label: 'Kualitas Produk',
        desc: 'Hasil panen diseleksi ketat, bebas residu bahan kimia berbahaya, dan layak konsumsi keluarga.',
      },
      {
        label: 'Kesegaran Alami',
        desc: 'Dipetik pada pagi atau fajar hari untuk mengunci kerenyahan, warna alami, dan kandungan gizi.',
      },
      {
        label: 'Transparansi',
        desc: 'Informasi kategori, satuan berat, serta asal kebun mitra disampaikan secara terbuka dan jelas.',
      },
      {
        label: 'Pelayanan Responsif',
        desc: 'Pengemasan rapi dan higienis disertai dukungan layanan pelanggan yang siap membantu.',
      },
    ],
  },
  {
    id: 'perjalanan-produk',
    title: 'Perjalanan Produk',
    image: '/images/about/value-petani.webp',
    imageAlt: 'Perjalanan hasil panen dari petani hingga ke pelanggan TaniCo',
    summary:
      'Setiap produk TaniCo melewati alur penanganan yang terencana dan ringkas agar waktu dari pemetikan di kebun hingga diterima pelanggan tetap singkat dan higienis.',
    steps: [
      {
        step: '1',
        name: 'Budidaya Petani Mitra',
        desc: 'Sayuran dirawat oleh petani lokal dengan metode organik dan hidroponik yang selaras dengan alam.',
      },
      {
        step: '2',
        name: 'Panen Fajar Hari',
        desc: 'Pemetikan dilakukan saat suhu pagi masih sejuk agar daun dan buah tidak layu.',
      },
      {
        step: '3',
        name: 'Sortir & Pengemasan Higienis',
        desc: 'Hasil panen diperiksa kualitasnya, dibersihkan, dan dikemas sesuai takaran secara rapi.',
      },
      {
        step: '4',
        name: 'Pengiriman ke Pelanggan',
        desc: 'Pesanan dikirim terjadwal ke alamat rumah pelanggan atau disiapkan untuk pengambilan di toko.',
      },
    ],
  },
];

export default function TentangKamiPage() {
  return (
    <PageLayoutWrapper>
      <div className="bg-[#FCFCFC] text-[#111111] font-jost pb-12 sm:pb-16 md:pb-20 select-none">
        {/* Hero Section - Brand Philosophy */}
        <section className="relative bg-[#1B4D3E] text-white py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-8 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="max-w-3xl mx-auto relative z-10">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#A3E635]"></span>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold font-sans mt-3 sm:mt-4 tracking-tight leading-snug sm:leading-tight">
              Menghubungkan Kebun Organik Langsung ke Meja Makan
            </h1>

            <p className="mt-3 sm:mt-6 text-[13px] sm:text-base md:text-lg text-[#E3EBF0]/80 leading-relaxed font-light">
              TaniCo lahir dari komitmen menjaga kelestarian lingkungan dan transparansi rantai pasok hasil bumi lokal dengan kualitas panen fajar terbaik.
            </p>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
            <div className="space-y-3 sm:space-y-5">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-sans tracking-tight text-[#1B4D3E]">
                Dedikasi Panen Segar & Pertanian Ramah Lingkungan
              </h2>

              <p className="text-gray-600 text-[13px] sm:text-sm md:text-base leading-relaxed">
                TaniCo didirikan dengan misi sederhana: memfasilitasi petani lokal menyalurkan hasil kebun organik mereka secara adil dan langsung ke tangan konsumen. Kami menjunjung tinggi kelestarian ekosistem tanah dan nutrisi alami tanpa residu kimia berbahaya.
              </p>

              <p className="text-gray-600 text-[13px] sm:text-sm md:text-base leading-relaxed">
                Seluruh sayur dipetik saat fajar dan didistribusikan dengan standar higienis tinggi agar kesegaran dan cita rasa alami tetap terjaga sempurna hingga tiba di dapur Anda.
              </p>
            </div>

            {/* Static image from public folder - not from API */}
            <div className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xs border border-[#DDE9DF] bg-[#174C3C]/10 flex items-center justify-center">
              <Image
                src="/images/about/perkebunan.webp"
                alt="Perkebunan TaniCo"
                width={800}
                height={600}
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </section>

        {/* Vision & Mission Section */}
        <section className="bg-white py-10 sm:py-16 md:py-20 border-y border-[#DDE9DF]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 lg:gap-12">
              <div className="p-5 sm:p-6 md:p-8 bg-white rounded-2xl border border-[#DDE9DF] space-y-3 sm:space-y-4">
                <h3 className="text-lg sm:text-xl font-bold font-sans text-[#1B4D3E]">
                  Visi Kami
                </h3>

                <p className="text-gray-600 text-[13px] sm:text-sm leading-relaxed">
                  Menjadi pelopor distribusi hasil pangan organik terpercaya, menginspirasi pola makan sehat alami, dan mengangkat kesejahteraan petani lokal secara berkelanjutan.
                </p>
              </div>

              <div className="p-5 sm:p-6 md:p-8 bg-white rounded-2xl border border-[#DDE9DF] space-y-3 sm:space-y-4">
                <h3 className="text-lg sm:text-xl font-bold font-sans text-[#1B4D3E]">
                  Misi Kami
                </h3>

                <ul className="text-gray-600 text-[13px] sm:text-sm space-y-1.5 sm:space-y-2 list-disc pl-5 leading-relaxed">
                  <li>Mendukung pertanian berkelanjutan bersama kelompok tani binaan.</li>
                  <li>Menyediakan pangan organik berkualitas prima bebas pestisida kimia sintetis.</li>
                  <li>Menjaga rantai distribusi cepat dan higienis langsung dari kebun fajar ke dapur konsumen.</li>
                  <li>Mendukung kelestarian alam melalui praktik budidaya ramah lingkungan.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Company Profile Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
          <div className="max-w-3xl mx-auto text-center space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm font-semibold tracking-wide text-[#1B4D3E]">
              Profil Perusahaan TaniCo
            </p>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-sans tracking-tight text-[#1B4D3E]">
              Mengenal Lebih Dekat Nilai, Komitmen, dan Alur Panen Kami
            </h2>

            <p className="text-gray-600 text-[13px] sm:text-sm md:text-base leading-relaxed">
              Setiap langkah di TaniCo dirancang agar hasil kebun petani lokal dapat dinikmati dalam kondisi segar, transparan, dan terpercaya oleh pelanggan setiap hari.
            </p>
          </div>

          <div className="mt-10 sm:mt-12 space-y-8 sm:space-y-10">
            {COMPANY_PROFILE_SECTIONS.map((item, idx) => {
              const isReversed = idx % 2 === 1;

              return (
                <article
                  key={item.id}
                  className="bg-white border border-[#DDE9DF] rounded-3xl overflow-hidden shadow-xs"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                    {/* Local Image Column */}
                    <div
                      className={`lg:col-span-5 relative min-h-[220px] sm:min-h-[280px] lg:min-h-full bg-[#1B4D3E]/10 overflow-hidden ${
                        isReversed ? 'lg:order-2' : 'lg:order-1'
                      }`}
                    >
                      <Image
                        src={item.image}
                        alt={item.imageAlt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 42vw"
                        className="object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Text & Structured Detail Column */}
                    <div
                      className={`lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center space-y-5 text-left ${
                        isReversed ? 'lg:order-1' : 'lg:order-2'
                      }`}
                    >
                      <div className="flex items-center gap-4 border-b border-[#DDE9DF] pb-4">
                        <div>
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold font-sans text-[#1B4D3E]">
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-gray-600 text-[13px] sm:text-sm md:text-base leading-relaxed">
                        {item.summary}
                      </p>

                      {item.highlights && (
                        <ul className="space-y-2.5 text-[13px] sm:text-sm text-gray-600 list-disc pl-5 leading-relaxed">
                          {item.highlights.map((point, pIdx) => (
                            <li key={pIdx}>{point}</li>
                          ))}
                        </ul>
                      )}

                      {item.pillars && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
                          {item.pillars.map((pillar) => (
                            <div
                              key={pillar.label}
                              className="p-3.5 sm:p-4 rounded-2xl bg-[#FCFCFC] border border-[#DDE9DF] space-y-1"
                            >
                              <h4 className="text-xs sm:text-sm font-bold font-sans text-[#1B4D3E]">
                                {pillar.label}
                              </h4>

                              <p className="text-xs text-gray-600 leading-relaxed">
                                {pillar.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.steps && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
                          {item.steps.map((st) => (
                            <div
                              key={st.step}
                              className="p-3.5 sm:p-4 rounded-2xl bg-[#FCFCFC] border border-[#DDE9DF] flex items-start gap-3"
                            >
                              <span className="w-6 h-6 rounded-full bg-[#1B4D3E] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {st.step}
                              </span>

                              <div className="space-y-1">
                                <h4 className="text-xs sm:text-sm font-bold font-sans text-[#1B4D3E]">
                                  {st.name}
                                </h4>

                                <p className="text-xs text-gray-600 leading-relaxed">
                                  {st.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </PageLayoutWrapper>
  );
}