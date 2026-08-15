import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db } from '../db/db'
import { layMonThuongAn, taoBanGhiTuThucPham, timThucPham } from '../db/truyvan'
import { luuSanPhamMaVach, taoTrinhDocMaVach, traMaVach, type SanPhamMaVach } from '../lib/mavach'
import { nhanDinhDuong, ngayLocal } from '../lib/tinhtoan'
import { useThongBao } from '../hooks/useApp'
import { BangTruot, NhapSo, ThongBao, TrangRong } from '../components/chung'
import type { LoaiBua, ThucPham } from '../lib/types'

type Tab = 'tim' | 'thuong_an' | 'cua_toi' | 'nhap_tay'

const TEN_BUA: Record<LoaiBua, string> = {
  sang: 'Bữa sáng', trua: 'Bữa trưa', toi: 'Bữa tối', phu: 'Bữa phụ',
}

/** Đoán bữa ăn theo giờ hiện tại để người dùng đỡ phải chọn. */
function doanBua(): LoaiBua {
  const g = new Date().getHours()
  if (g < 10) return 'sang'
  if (g < 14) return 'trua'
  if (g < 21) return 'toi'
  return 'phu'
}

function QuetMaVach({
  mo, dong, timThay,
}: {
  mo: boolean
  dong: () => void
  timThay: (sp: SanPhamMaVach | null, ma: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loi, datLoi] = useState<string>()
  const [dangTra, datDangTra] = useState(false)

  useEffect(() => {
    if (!mo) return
    const trinhDoc = taoTrinhDocMaVach()
    let dieuKhien: { stop: () => void } | undefined
    let daHuy = false

    trinhDoc
      .decodeFromVideoDevice(undefined, videoRef.current!, async (kq) => {
        if (!kq || daHuy) return
        daHuy = true
        dieuKhien?.stop()
        const ma = kq.getText()
        datDangTra(true)
        try {
          timThay(await traMaVach(ma), ma)
        } catch {
          timThay(null, ma)
        }
      })
      .then((dk) => {
        dieuKhien = dk
        if (daHuy) dk.stop()
      })
      .catch(() => {
        datLoi('Không mở được camera. Hãy cho phép quyền truy cập camera trong trình duyệt.')
      })

    return () => {
      daHuy = true
      dieuKhien?.stop()
    }
  }, [mo, timThay])

  return (
    <BangTruot mo={mo} dong={dong} tieuDe="Quét mã vạch">
      {loi ? (
        <p className="text-sm text-rose-300">{loi}</p>
      ) : (
        <>
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-rose-500/80" />
          </div>
          <p className="text-sm text-slate-400 mt-4 text-center">
            {dangTra ? 'Đang tra cứu sản phẩm...' : 'Đưa mã vạch vào giữa khung hình'}
          </p>
        </>
      )}
    </BangTruot>
  )
}

export default function ThemMon() {
  const dieuHuong = useNavigate()
  const [thamSo] = useSearchParams()
  const ngay = thamSo.get('ngay') ?? ngayLocal()
  const buaBanDau = (thamSo.get('bua') as LoaiBua | null) ?? doanBua()

  const { thongBao, hien } = useThongBao()
  const [tab, datTab] = useState<Tab>('tim')
  const [tuKhoa, datTuKhoa] = useState('')
  const [loaiBua, datLoaiBua] = useState<LoaiBua>(buaBanDau)
  const [dangChon, datDangChon] = useState<ThucPham | null>(null)
  const [khoiLuong, datKhoiLuong] = useState(100)
  const [moQuet, datMoQuet] = useState(false)

  // Trạng thái form nhập tay
  const [tenTay, datTenTay] = useState('')
  const [caloTay, datCaloTay] = useState(0)
  const [damTay, datDamTay] = useState(0)
  const [tinhbotTay, datTinhbotTay] = useState(0)
  const [beoTay, datBeoTay] = useState(0)
  const [luuLaiMonTay, datLuuLaiMonTay] = useState(true)

  const ketQua = useLiveQuery(() => timThucPham(tuKhoa), [tuKhoa])
  const thuongAn = useLiveQuery(() => layMonThuongAn(), [])
  const cuaToi = useLiveQuery(() => db.thucPham.filter((t) => t.laCuaNguoiDung).toArray(), [])

  async function themVaoNhatKy(tp: ThucPham, gam: number, nguon: 'tim_kiem' | 'ma_vach' = 'tim_kiem') {
    await db.nhatKyAn.add(taoBanGhiTuThucPham(tp, gam, ngay, loaiBua, nguon))
    dieuHuong(`/nhat-ky?ngay=${ngay}`)
  }

  async function themNhanhTuThuongAn(mon: NonNullable<typeof thuongAn>[number]) {
    const bayGio = Date.now()
    await db.nhatKyAn.add({
      ngay,
      loaiBua,
      thoiDiem: bayGio,
      thucPhamId: mon.thucPhamId,
      tenHienThi: mon.tenHienThi,
      khoiLuongG: mon.khoiLuongG,
      dinhDuong: mon.dinhDuong,
      nguonNhap: 'chep_lai',
      ghiChu: '',
      taoLuc: bayGio,
      suaLuc: bayGio,
    })
    dieuHuong(`/nhat-ky?ngay=${ngay}`)
  }

  async function luuMonNhapTay() {
    if (!tenTay.trim() || caloTay <= 0) {
      hien('Cần có tên món và số calo lớn hơn 0', 'loi')
      return
    }
    const bayGio = Date.now()
    const dinhDuong = {
      calo: caloTay, dam: damTay, tinhbot: tinhbotTay, beo: beoTay,
      chatxo: 0, duong: 0, natri: 0,
    }

    // Người dùng nhập số liệu cho cả phần ăn, quy về 100 g khi lưu vào thư viện.
    if (luuLaiMonTay) {
      await db.thucPham.add({
        ten: tenTay.trim(),
        tenKhac: [],
        nhom: 'Cơm & món mặn',
        tren100g: nhanDinhDuong(dinhDuong, (100 / Math.max(khoiLuong, 1)) * 100),
        khauPhanChuan: [{ ten: 'phần', gam: khoiLuong }],
        nguon: 'Tự nhập',
        laCuaNguoiDung: true,
        taoLuc: bayGio,
      } as ThucPham)
    }

    await db.nhatKyAn.add({
      ngay,
      loaiBua,
      thoiDiem: bayGio,
      tenHienThi: tenTay.trim(),
      khoiLuongG: khoiLuong,
      dinhDuong,
      nguonNhap: 'thu_cong',
      ghiChu: '',
      taoLuc: bayGio,
      suaLuc: bayGio,
    })
    dieuHuong(`/nhat-ky?ngay=${ngay}`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => dieuHuong(-1)} className="nut-phu px-3 py-2">←</button>
        <h1 className="font-semibold">Thêm món</h1>
        <button onClick={() => datMoQuet(true)} className="nut-phu px-3 py-2" aria-label="Quét mã vạch">
          ▥
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {(Object.keys(TEN_BUA) as LoaiBua[]).map((b) => (
          <button
            key={b}
            onClick={() => datLoaiBua(b)}
            className={`text-xs py-2 ${loaiBua === b ? 'chip-bat' : 'chip-tat'}`}
          >
            {TEN_BUA[b].replace('Bữa ', '')}
          </button>
        ))}
      </div>

      <div className="flex gap-1 mb-4 border-b border-slate-800">
        {([
          ['tim', 'Tìm món'],
          ['thuong_an', 'Thường ăn'],
          ['cua_toi', 'Của tôi'],
          ['nhap_tay', 'Nhập tay'],
        ] as [Tab, string][]).map(([ma, nhan]) => (
          <button
            key={ma}
            onClick={() => datTab(ma)}
            className={`flex-1 pb-2.5 text-sm border-b-2 transition ${
              tab === ma
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            {nhan}
          </button>
        ))}
      </div>

      {tab === 'tim' && (
        <>
          <input
            className="o-nhap mb-3"
            placeholder="Gõ tên món, có dấu hay không dấu đều được"
            value={tuKhoa}
            onChange={(e) => datTuKhoa(e.target.value)}
            autoFocus
          />
          <div className="space-y-2">
            {ketQua?.map((tp) => (
              <button
                key={tp.id}
                onClick={() => {
                  datDangChon(tp)
                  datKhoiLuong(tp.khauPhanChuan[0]?.gam ?? 100)
                }}
                className="the w-full text-left py-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{tp.ten}</div>
                    <div className="text-xs text-slate-500">{tp.nhom}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold">{tp.tren100g.calo}</div>
                    <div className="text-[10px] text-slate-500">kcal/100g</div>
                  </div>
                </div>
              </button>
            ))}
            {ketQua?.length === 0 && (
              <TrangRong
                bieuTuong="🔍"
                tieuDe="Không tìm thấy món này"
                moTa="Bạn có thể nhập tay số liệu và lưu lại để lần sau dùng nhanh."
                hanhDong={
                  <button
                    className="nut-chinh"
                    onClick={() => {
                      datTenTay(tuKhoa)
                      datTab('nhap_tay')
                    }}
                  >
                    Nhập tay món "{tuKhoa}"
                  </button>
                }
              />
            )}
          </div>
        </>
      )}

      {tab === 'thuong_an' && (
        <div className="space-y-2">
          {thuongAn && thuongAn.length > 0 ? (
            thuongAn.map((mon) => (
              <button
                key={mon.tenHienThi}
                onClick={() => themNhanhTuThuongAn(mon)}
                className="the w-full text-left py-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{mon.tenHienThi}</div>
                    <div className="text-xs text-slate-500">
                      {mon.khoiLuongG} g · đã ăn {mon.soLan} lần
                    </div>
                  </div>
                  <span className="text-sm font-semibold shrink-0">{mon.dinhDuong.calo}</span>
                </div>
              </button>
            ))
          ) : (
            <TrangRong
              bieuTuong="🕐"
              tieuDe="Chưa có món thường ăn"
              moTa="Sau vài ngày ghi log, những món bạn ăn nhiều sẽ hiện ở đây để thêm chỉ với một chạm."
            />
          )}
        </div>
      )}

      {tab === 'cua_toi' && (
        <div className="space-y-2">
          {cuaToi && cuaToi.length > 0 ? (
            cuaToi.map((tp) => (
              <button
                key={tp.id}
                onClick={() => {
                  datDangChon(tp)
                  datKhoiLuong(tp.khauPhanChuan[0]?.gam ?? 100)
                }}
                className="the w-full text-left py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-sm truncate">{tp.ten}</div>
                  <span className="text-sm font-semibold shrink-0">
                    {tp.tren100g.calo}
                    <span className="text-[10px] text-slate-500"> /100g</span>
                  </span>
                </div>
              </button>
            ))
          ) : (
            <TrangRong
              bieuTuong="📝"
              tieuDe="Chưa có món tự tạo"
              moTa="Món bạn nhập tay và chọn lưu lại sẽ nằm ở đây."
            />
          )}
        </div>
      )}

      {tab === 'nhap_tay' && (
        <div className="space-y-4">
          <div>
            <label className="nhan">Tên món</label>
            <input
              className="o-nhap"
              placeholder="Ví dụ: Canh bí mẹ nấu"
              value={tenTay}
              onChange={(e) => datTenTay(e.target.value)}
            />
          </div>
          <div>
            <label className="nhan">Khối lượng phần ăn</label>
            <NhapSo giaTri={khoiLuong} doiGiaTri={datKhoiLuong} buoc={10} toiThieu={1} donVi="g" />
          </div>
          <p className="text-xs text-slate-500">
            Các số dưới đây là của <strong>cả phần ăn</strong> này, không phải trên 100 g.
          </p>
          <div>
            <label className="nhan">Calo</label>
            <NhapSo giaTri={caloTay} doiGiaTri={datCaloTay} buoc={10} donVi="kcal" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="nhan">Đạm</label>
              <NhapSo giaTri={damTay} doiGiaTri={datDamTay} buoc={1} thapPhan={1} />
            </div>
            <div>
              <label className="nhan">Tinh bột</label>
              <NhapSo giaTri={tinhbotTay} doiGiaTri={datTinhbotTay} buoc={1} thapPhan={1} />
            </div>
            <div>
              <label className="nhan">Béo</label>
              <NhapSo giaTri={beoTay} doiGiaTri={datBeoTay} buoc={1} thapPhan={1} />
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={luuLaiMonTay}
              onChange={(e) => datLuuLaiMonTay(e.target.checked)}
              className="h-5 w-5 rounded accent-emerald-500"
            />
            Lưu món này để lần sau dùng lại
          </label>
          <button className="nut-chinh w-full" onClick={luuMonNhapTay}>
            Thêm vào {TEN_BUA[loaiBua].toLowerCase()}
          </button>
        </div>
      )}

      <BangTruot mo={!!dangChon} dong={() => datDangChon(null)} tieuDe={dangChon?.ten ?? ''}>
        {dangChon && (
          <div>
            {dangChon.khauPhanChuan.length > 0 && (
              <>
                <label className="nhan">Khẩu phần thường gặp</label>
                <div className="flex flex-wrap gap-2 mb-5">
                  {dangChon.khauPhanChuan.map((k) => (
                    <button
                      key={k.ten}
                      onClick={() => datKhoiLuong(k.gam)}
                      className={khoiLuong === k.gam ? 'chip-bat' : 'chip-tat'}
                    >
                      {k.ten} ({k.gam}g)
                    </button>
                  ))}
                </div>
              </>
            )}

            <label className="nhan">Khối lượng</label>
            <NhapSo
              giaTri={khoiLuong} doiGiaTri={datKhoiLuong}
              buoc={10} toiThieu={1} toiDa={5000} donVi="g"
            />

            <div className="the mt-4 grid grid-cols-4 gap-2 text-center text-sm">
              {(() => {
                const d = nhanDinhDuong(dangChon.tren100g, khoiLuong)
                return [
                  ['Calo', d.calo, ''],
                  ['Đạm', d.dam, 'g'],
                  ['T.bột', d.tinhbot, 'g'],
                  ['Béo', d.beo, 'g'],
                ].map(([nhan, gt, dv]) => (
                  <div key={nhan as string}>
                    <div className="font-semibold">
                      {gt as number}
                      {dv as string}
                    </div>
                    <div className="text-xs text-slate-500">{nhan as string}</div>
                  </div>
                ))
              })()}
            </div>

            <button
              className="nut-chinh w-full mt-6"
              onClick={() => themVaoNhatKy(dangChon, khoiLuong)}
            >
              Thêm vào {TEN_BUA[loaiBua].toLowerCase()}
            </button>
          </div>
        )}
      </BangTruot>

      <QuetMaVach
        mo={moQuet}
        dong={() => datMoQuet(false)}
        timThay={async (sp, ma) => {
          datMoQuet(false)
          if (!sp) {
            datTab('nhap_tay')
            datTenTay(`Sản phẩm ${ma}`)
            hien('Không tìm thấy mã vạch này. Bạn nhập tay giúp nhé, app sẽ nhớ cho lần sau.', 'loi')
            return
          }
          const id = await luuSanPhamMaVach(sp)
          const tp = await db.thucPham.get(id)
          if (tp) {
            datDangChon(tp)
            datKhoiLuong(sp.khoiLuongGoi ?? 100)
          }
        }}
      />

      {thongBao && <ThongBao noiDung={thongBao.noiDung} loai={thongBao.loai} />}
    </div>
  )
}
