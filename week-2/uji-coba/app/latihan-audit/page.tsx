export default function LatihanAudit() {
 return (
<main>
    <div className="p-8">
    <div className="text-2xl font-bold">Katalog Alat Laboratorium</div>
    <img src="/next.svg" width={120} height={24} alt="Next.js logo" />
    <p className="text-gray-300">Stok diperbarui setiap hari.</p>
    <input type="search" placeholder="Cari alat laboratorium" aria-label="Cari alat laboratorium" className="border p-2" />
    <button type="submit" className="ml-2 border p-2" aria-label="Cari">
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <circle cx="7" cy="7" r="5" stroke="currentColor" fill="none" />
    </svg>
    </button>
    </div>
 </main>
 );
}