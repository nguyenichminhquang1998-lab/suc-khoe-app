// Nạp dữ liệu mặc định (món ăn, bài tập) vào máy người dùng lần đầu mở app.
// Chạy lại nhiều lần không tạo bản trùng — chỉ thêm những mục còn thiếu.

import { db, layCaiDat, luuCaiDat } from './db'
import { THUC_PHAM_MAC_DINH } from '../data/thucpham'
import { BAI_TAP_MAC_DINH } from '../data/baitap'
import type { BaiTap, ThucPham } from '../lib/types'

const KHOA_PHIEN_BAN_SEED = 'phienBanSeed'

/**
 * Tăng số này khi bổ sung món ăn / bài tập mới vào file dữ liệu mặc định,
 * để người dùng cũ cũng nhận được phần bổ sung khi cập nhật app.
 */
const PHIEN_BAN_SEED = 1

export async function napDuLieuMacDinh(): Promise<{ themThucPham: number; themBaiTap: number }> {
  const daNap = await layCaiDat<number>(KHOA_PHIEN_BAN_SEED, 0)

  // Món của người dùng tự tạo không bao giờ bị đụng tới, chỉ so tên các món hệ thống.
  const tenDaCo = new Set((await db.thucPham.toArray()).map((t) => t.ten))
  const thucPhamMoi: ThucPham[] = THUC_PHAM_MAC_DINH.filter((t) => !tenDaCo.has(t.ten)).map(
    (t) => ({
      ten: t.ten,
      tenKhac: t.tenKhac,
      nhom: t.nhom,
      tren100g: t.tren100g,
      khauPhanChuan: t.khauPhanChuan,
      nguon: 'Viện Dinh dưỡng Quốc gia / USDA',
      laCuaNguoiDung: false,
      taoLuc: Date.now(),
    }),
  )
  if (thucPhamMoi.length > 0) await db.thucPham.bulkAdd(thucPhamMoi)

  const tenBaiTapDaCo = new Set((await db.baiTap.toArray()).map((t) => t.ten))
  const baiTapMoi: BaiTap[] = BAI_TAP_MAC_DINH.filter((t) => !tenBaiTapDaCo.has(t.ten)).map((t) => ({
    ten: t.ten,
    nhomCo: t.nhomCo,
    dungCu: t.dungCu,
    moTa: t.moTa,
    met: t.met,
    laCardio: t.laCardio,
    laCuaNguoiDung: false,
  }))
  if (baiTapMoi.length > 0) await db.baiTap.bulkAdd(baiTapMoi)

  if (daNap < PHIEN_BAN_SEED) await luuCaiDat(KHOA_PHIEN_BAN_SEED, PHIEN_BAN_SEED)

  return { themThucPham: thucPhamMoi.length, themBaiTap: baiTapMoi.length }
}
