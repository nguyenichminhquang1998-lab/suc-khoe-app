// Sinh icon PNG cho PWA mà không cần thư viện đồ họa ngoài.
// Vẽ trực tiếp lên mảng pixel rồi đóng gói thành PNG bằng zlib có sẵn của Node.

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { Buffer } from 'node:buffer'

const NEN = [15, 23, 42]        // slate-950
const XANH = [16, 185, 129]     // emerald-500
const TRANG = [241, 245, 249]   // slate-100

function crc32(buf) {
  let c
  const bang = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    bang[n] = c
  }
  let crc = 0xffffffff
  for (const b of buf) crc = bang[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function khoi(kieu, duLieu) {
  const dai = Buffer.alloc(4)
  dai.writeUInt32BE(duLieu.length)
  const than = Buffer.concat([Buffer.from(kieu, 'ascii'), duLieu])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(than))
  return Buffer.concat([dai, than, crc])
}

function taoPng(kichThuoc, vePixel) {
  // Mỗi hàng bắt đầu bằng 1 byte filter (0 = None), sau đó là RGB.
  const hang = kichThuoc * 3 + 1
  const tho = Buffer.alloc(hang * kichThuoc)
  for (let y = 0; y < kichThuoc; y++) {
    tho[y * hang] = 0
    for (let x = 0; x < kichThuoc; x++) {
      const [r, g, b] = vePixel(x, y, kichThuoc)
      const i = y * hang + 1 + x * 3
      tho[i] = r
      tho[i + 1] = g
      tho[i + 2] = b
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(kichThuoc, 0)
  ihdr.writeUInt32BE(kichThuoc, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type: truecolor RGB
  ihdr[10] = 0  // compression
  ihdr[11] = 0  // filter
  ihdr[12] = 0  // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    khoi('IHDR', ihdr),
    khoi('IDAT', deflateSync(tho, { level: 9 })),
    khoi('IEND', Buffer.alloc(0)),
  ])
}

function tron(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

/**
 * Icon: nền tối bo góc, một vòng tròn tiến độ màu xanh hở ở góc trên
 * (gợi lại vòng calo ở màn hình chính) và một chấm trắng ở giữa.
 */
function veIcon(x, y, kt) {
  const tam = kt / 2
  const dx = x - tam
  const dy = y - tam
  const r = Math.hypot(dx, dy)

  // Bo góc: nằm ngoài hình chữ nhật bo tròn thì để trong suốt-giả bằng màu nền.
  const banKinhBo = kt * 0.22
  const gx = Math.max(Math.abs(dx) - (tam - banKinhBo), 0)
  const gy = Math.max(Math.abs(dy) - (tam - banKinhBo), 0)
  if (Math.hypot(gx, gy) > banKinhBo) return NEN

  const rNgoai = kt * 0.36
  const rTrong = kt * 0.26
  const day = kt * 0.012

  if (r <= rNgoai + day && r >= rTrong - day) {
    // Góc tính từ đỉnh, theo chiều kim đồng hồ; chừa hở 20% cuối vòng.
    let goc = Math.atan2(dx, -dy)
    if (goc < 0) goc += Math.PI * 2
    const phanVong = goc / (Math.PI * 2)

    const trongVanh = r <= rNgoai && r >= rTrong
    if (!trongVanh) return NEN
    if (phanVong > 0.8) return tron(NEN, XANH, 0.12)

    // Khử răng cưa nhẹ ở mép trong và mép ngoài của vành.
    const meNgoai = Math.min(1, (rNgoai - r) / day)
    const meTrong = Math.min(1, (r - rTrong) / day)
    return tron(NEN, XANH, Math.max(0, Math.min(meNgoai, meTrong, 1)))
  }

  const rCham = kt * 0.1
  if (r <= rCham) {
    const me = Math.min(1, (rCham - r) / (kt * 0.012))
    return tron(NEN, TRANG, Math.max(0, me))
  }

  return NEN
}

mkdirSync('public', { recursive: true })
for (const kt of [192, 512]) {
  writeFileSync(`public/icon-${kt}.png`, taoPng(kt, (x, y) => veIcon(x, y, kt)))
  console.log(`public/icon-${kt}.png`)
}
