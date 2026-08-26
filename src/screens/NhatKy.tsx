import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db, khoiPhuc, xoaMem } from '../db/db'
import { chepBuaAn, gomTheoBua, layNhatKyAnTheoNgay, tongDinhDuong } from '../db/truyvan'
import { ngayLocal, nhanDinhDuong, themNgay } from '../lib/tinhtoan'
import { useChiSoMucTieu, useNguoiDung, useThongBao } from '../hooks/useApp'
import {
  BangTruot, HopThoaiXacNhan, NhapSo, ThanhMacro, ThongBao, TrangRong,
} from '../components/chung'
import { MAU_DO_TIN_CAY, NHAN_DO_TIN_CAY } from '../lib/nhandienanh'
import type { LoaiBua, NhatKyAn } from '../lib/types'

const TEN_BUA: Record<LoaiBua, string> = {
  sang: 'Bữa sáng', trua: 'Bữa trưa', toi: 'Bữa tối', phu: 'Bữa phụ',
}

const BIEU_TUONG_BUA: Record<LoaiBua, string> = {
  sang: '🌅', trua: '☀️', toi: '🌙', phu: '🍎',
}

function AnhBua({ anhId }: { anhId: number }) {
  const anh = useLiveQuery(() => db.anhBuaAn.get(anhId), [anhId])
  const [url, datUrl] = useState<string>()

  useEffect(() => {
    if (!anh) return
    const u = URL.createObjectURL(anh.blob)
    datUrl(u)
    // Thu hồi URL khi đổi ảnh hoặc rời màn hình, nếu không sẽ rò bộ nhớ.
    return () => URL.revokeObjectURL(u)
  }, [anh])

  if (!url) return null
  return <img src={url} alt="Ảnh bữa ăn" className="w-full rounded-xl mb-4" />
}

export default function NhatKy() {
  const dieuHuong = useNavigate()
  const [thamSo, datThamSo] = useSearchParams()
  const ngay = thamSo.get('ngay') ?? ngayLocal()
  const nguoiDung = useNguoiDung()
  const mucTieu = useChiSoMucTieu(nguoiDung)
  const { thongBao, hien, an } = useThongBao()

  const [dangSua, datDangSua] = useState<NhatKyAn | null>(null)
  const [khoiLuongSua, datKhoiLuongSua] = useState(100)
  const [xacNhanChep, datXacNhanChep] = useState(false)

  const buaAn = useLiveQuery(() => layNhatKyAnTheoNgay(ngay), [ngay])

  if (!nguoiDung || !mucTieu) return null

  const tong = tongDinhDuong(buaAn ?? [])
  const gom = gomTheoBua(buaAn ?? [])
  const laHomNay = ngay === ngayLocal()

  function doiNgay(soNgay: number) {
    const moi = themNgay(ngay, soNgay)
    // Không cho đi tới tương lai — không có gì để xem ở đó.
    if (moi > ngayLocal()) return
    datThamSo({ ngay: moi })
  }

  function nhanNgay(n: string): string {
    if (n === ngayLocal()) return 'Hôm nay'
    if (n === themNgay(ngayLocal(), -1)) return 'Hôm qua'
    return new Date(n + 'T00:00:00').toLocaleDateString('vi-VN', {
      weekday: 'short', day: 'numeric', month: 'numeric',
    })
  }

  async function xoaMon(mon: NhatKyAn) {
    await xoaMem(db.nhatKyAn, mon.id!)
    hien(`Đã xóa ${mon.tenHienThi}`, 'thanh_cong', async () => {
      await khoiPhuc(db.nhatKyAn, mon.id!)
      an()
    })
  }

  async function luuSua() {
    if (!dangSua) return
    // Dinh dưỡng của bản ghi là của khối lượng cũ, quy về 100g rồi nhân lại.
    const tren100 = nhanDinhDuong(dangSua.dinhDuong, (100 / dangSua.khoiLuongG) * 100)
    await db.nhatKyAn.update(dangSua.id!, {
      khoiLuongG: khoiLuongSua,
      dinhDuong: nhanDinhDuong(tren100, khoiLuongSua),
      suaLuc: Date.now(),
    })
    datDangSua(null)
    hien('Đã cập nhật')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => doiNgay(-1)} className="nut-phu px-3 py-2" aria-label="Ngày trước">
          ←
        </button>
        <div className="text-center">
          <div className="font-semibold">{nhanNgay(ngay)}</div>
          <input
            type="date"
            value={ngay}
            max={ngayLocal()}
            onChange={(e) => e.target.value && datThamSo({ ngay: e.target.value })}
            className="text-xs text-slate-500 bg-transparent text-center"
          />
        </div>
        <button
          onClick={() => doiNgay(1)}
          className="nut-phu px-3 py-2 disabled:opacity-30"
          disabled={laHomNay}
          aria-label="Ngày sau"
        >
          →
        </button>
      </div>

      <div className="the mb-4">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-2xl font-bold">{tong.calo}</span>
          <span className="text-sm text-slate-500">/ {mucTieu.calo} kcal</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              tong.calo > mucTieu.calo ? 'bg-rose-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min((tong.calo / mucTieu.calo) * 100, 100)}%` }}
          />
        </div>
        <div className="flex gap-4">
          <ThanhMacro nhan="Đạm" daAn={tong.dam} mucTieu={mucTieu.dam} mau="#3b82f6" />
          <ThanhMacro nhan="Tinh bột" daAn={tong.tinhbot} mucTieu={mucTieu.tinhbot} mau="#f59e0b" />
          <ThanhMacro nhan="Béo" daAn={tong.beo} mucTieu={mucTieu.beo} mau="#a855f7" />
        </div>
      </div>

      {buaAn && buaAn.length === 0 ? (
        <TrangRong
          bieuTuong="🍽️"
          tieuDe="Chưa ghi gì ngày này"
          moTa="Chụp ảnh món ăn hoặc tìm trong danh sách để bắt đầu ghi."
          hanhDong={
            <div className="flex flex-col gap-2 w-full">
              <button className="nut-chinh" onClick={() => dieuHuong('/camera')}>
                📷 Chụp món ăn
              </button>
              <button
                className="nut-phu"
                onClick={() => dieuHuong(`/them-mon?ngay=${ngay}`)}
              >
                🔍 Tìm món hoặc nhập tay
              </button>
              <button className="nut-vien" onClick={() => datXacNhanChep(true)}>
                Chép lại bữa hôm trước
              </button>
            </div>
          }
        />
      ) : (
        <div className="space-y-4">
          {(['sang', 'trua', 'toi', 'phu'] as LoaiBua[]).map((bua) => {
            const cua = gom[bua]
            const caloBua = cua.reduce((t, n) => t + n.dinhDuong.calo, 0)
            return (
              <section key={bua}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-medium text-sm text-slate-300">
                    {BIEU_TUONG_BUA[bua]} {TEN_BUA[bua]}
                  </h2>
                  <div className="flex items-center gap-3">
                    {caloBua > 0 && (
                      <span className="text-sm text-slate-400">{caloBua} kcal</span>
                    )}
                    <button
                      onClick={() => dieuHuong(`/them-mon?ngay=${ngay}&bua=${bua}`)}
                      className="text-emerald-400 text-lg leading-none px-1"
                      aria-label={`Thêm món vào ${TEN_BUA[bua]}`}
                    >
                      +
                    </button>
                  </div>
                </div>

                {cua.length === 0 ? (
                  <button
                    onClick={() => dieuHuong(`/them-mon?ngay=${ngay}&bua=${bua}`)}
                    className="w-full rounded-xl border border-dashed border-slate-800 py-3 text-sm text-slate-600 hover:border-slate-700"
                  >
                    Thêm món
                  </button>
                ) : (
                  <div className="space-y-2">
                    {cua.map((mon) => (
                      <div key={mon.id} className="the py-3">
                        <div className="flex items-start justify-between gap-3">
                          <button
                            className="flex-1 text-left min-w-0"
                            onClick={() => {
                              datDangSua(mon)
                              datKhoiLuongSua(mon.khoiLuongG)
                            }}
                          >
                            <div className="font-medium text-sm truncate">{mon.tenHienThi}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {mon.khoiLuongG} g · Đ {mon.dinhDuong.dam}g · TB{' '}
                              {mon.dinhDuong.tinhbot}g · B {mon.dinhDuong.beo}g
                            </div>
                            {mon.doTinCay && mon.nguonNhap === 'anh' && (
                              <span
                                className={`inline-block mt-1.5 rounded-full border px-2 py-0.5 text-[10px] ${
                                  MAU_DO_TIN_CAY[mon.doTinCay]
                                }`}
                              >
                                AI · {NHAN_DO_TIN_CAY[mon.doTinCay]}
                              </span>
                            )}
                          </button>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-semibold">{mon.dinhDuong.calo}</span>
                            <button
                              onClick={() => xoaMon(mon)}
                              className="h-7 w-7 flex items-center justify-center rounded-full text-lg leading-none text-slate-500 hover:bg-rose-500/15 hover:text-rose-400 transition"
                              aria-label="Xóa món"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })}

          <button className="nut-vien w-full" onClick={() => datXacNhanChep(true)}>
            Chép lại bữa của hôm trước
          </button>
        </div>
      )}

      <BangTruot mo={!!dangSua} dong={() => datDangSua(null)} tieuDe="Sửa món">
        {dangSua && (
          <div>
            {dangSua.anhId && <AnhBua anhId={dangSua.anhId} />}
            <h3 className="font-semibold text-lg mb-1">{dangSua.tenHienThi}</h3>
            <p className="text-sm text-slate-500 mb-5">
              {dangSua.dinhDuong.calo} kcal ở khối lượng {dangSua.khoiLuongG} g
            </p>

            <label className="nhan">Khối lượng</label>
            <NhapSo
              giaTri={khoiLuongSua}
              doiGiaTri={datKhoiLuongSua}
              buoc={10}
              toiThieu={1}
              toiDa={5000}
              donVi="g"
            />

            <div className="the mt-4 grid grid-cols-4 gap-2 text-center text-sm">
              {(() => {
                const tren100 = nhanDinhDuong(
                  dangSua.dinhDuong,
                  (100 / dangSua.khoiLuongG) * 100,
                )
                const moi = nhanDinhDuong(tren100, khoiLuongSua)
                return [
                  ['Calo', moi.calo, ''],
                  ['Đạm', moi.dam, 'g'],
                  ['T.bột', moi.tinhbot, 'g'],
                  ['Béo', moi.beo, 'g'],
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

            <div className="flex gap-3 mt-6">
              <button
                className="nut-nguy-hiem flex-1"
                onClick={() => {
                  xoaMon(dangSua)
                  datDangSua(null)
                }}
              >
                Xóa
              </button>
              <button className="nut-chinh flex-1" onClick={luuSua}>
                Lưu
              </button>
            </div>
          </div>
        )}
      </BangTruot>

      <HopThoaiXacNhan
        mo={xacNhanChep}
        tieuDe="Chép lại bữa hôm trước"
        noiDung={`Toàn bộ món ăn của ngày ${nhanNgay(themNgay(ngay, -1))} sẽ được chép sang ngày này. Các món đang có vẫn giữ nguyên.`}
        nhanDongY="Chép"
        huy={() => datXacNhanChep(false)}
        dongY={async () => {
          const so = await chepBuaAn(themNgay(ngay, -1), ngay)
          datXacNhanChep(false)
          hien(so > 0 ? `Đã chép ${so} món` : 'Hôm trước không có món nào', so > 0 ? 'thanh_cong' : 'loi')
        }}
      />

      {thongBao && (
        <ThongBao noiDung={thongBao.noiDung} loai={thongBao.loai} hoanTac={thongBao.hoanTac} />
      )}
    </div>
  )
}
