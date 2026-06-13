#!/bin/bash

# ============================================
# CPA SYN FLOOD INSTALLER
# ============================================

MERAH='\033[0;31m'
HIJAU='\033[0;32m'
KUNING='\033[1;33m'
BIRU='\033[0;34m'
NC='\033[0m'

clear

echo -e "${BIRU}"
echo "   ██████╗██████╗  █████╗     ███████╗██╗   ██╗███╗   ██╗"
echo "  ██╔════╝██╔══██╗██╔══██╗    ██╔════╝╚██╗ ██╔╝████╗  ██║"
echo "  ██║     ██████╔╝███████║    ███████╗ ╚████╔╝ ██╔██╗ ██║"
echo "  ██║     ██╔══██╗██╔══██║    ╚════██║  ╚██╔╝  ██║╚██╗██║"
echo "  ╚██████╗██║  ██║██║  ██║    ███████║   ██║   ██║ ╚████║"
echo "   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝    ╚══════╝   ╚═╝   ╚═╝  ╚═══╝"
echo -e "${NC}"
echo -e "${KUNING}========================================${NC}"
echo -e "${KUNING}   CPA SYN FLOOD INSTALLER v2.0${NC}"
echo -e "${KUNING}========================================${NC}"

# Cek Node.js
if ! command -v node &> /dev/null; then
    echo -e "${MERAH}❌ Node.js tidak ditemukan!${NC}"
    echo -e "${KUNING}📦 Install Node.js dulu:${NC}"
    echo "   Termux: pkg install nodejs"
    echo "   Ubuntu: sudo apt install nodejs npm"
    exit 1
fi

echo -e "${HIJAU}✅ Node.js ditemukan: $(node --version)${NC}"

# Install dependencies
echo -e "${KUNING}📦 Menginstall dependencies...${NC}"
npm install

# Beri izin eksekusi
chmod +x cpa_syn_flood.js

echo -e "${HIJAU}✅ Installasi selesai!${NC}"
echo ""
echo -e "${KUNING}🚀 Cara menjalankan:${NC}"
echo "   node cpa_syn_flood.js <IP> <PORT> <THREADS> <METHOD>"
echo "   Contoh: node cpa_syn_flood.js 192.168.1.1 80 100 tcp"
echo ""
echo -e "${KUNING}📖 Bantuan:${NC}"
echo "   node cpa_syn_flood.js --help"
