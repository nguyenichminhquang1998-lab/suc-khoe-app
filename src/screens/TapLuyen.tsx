import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, khoiPhuc, xoaMem } from '../db/db'
import { layNhatKyTapTheoKhoang } from '../db/truyvan'
import { NHAN_NHOM_CO } from '../data/baitap'
import { ngayLocal, themNgay } from '../lib/tinhtoan'
import { useThongBao } from '../hooks/useApp'
import {
  BangTruot, HopThoaiXacNhan, ThongBao, TieuDeTrang, TrangRong,
} from '../components/chung'
import type { BaiTap, BaiTapTrongMau, BuoiTapMau, NhatKyTap, NhomCo } from '../lib/types'

const THU = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

type Tab = 'lich' | 'buoi_tap' | 'thu_vien'

export default function TapLuyen() {
  const dieuHuong = useNavigate()
  const { thongBao, hien, an } = useThongBao()
  const [tab, datTab] = useState<Tab>('lich')
  const [nhomLoc, datNhomLoc] = useState<NhomCo | 'tat_ca'>('tat_ca')
  const [moTaoMau, datMoTaoMau] = useState(false)
  const [dangSuaMau, datDangSuaMau] = useState<BuoiTapMau | null>(null)
  const [tenMau, datTenMau] = useState('')
  const [baiDaChon, datBaiDaChon] = useState<BaiTapTrongMau[]>([])
  const [moChonBai, datMoChonBai] = useState(false)
  const [xemBai, datXemBai] = useState<BaiTap | null>(null)
  const [ganLich, datGanLich] = useState<BuoiTapMau | null>(null)
  const [xemBuoi, datXemBuoi] = useState<NhatKyTap | null>(null)
  const [ghiChuSua, datGhiChuSua] = useState('')
  const [camNhanSua, datCamNhanSua] = useState<1 | 2 | 3 | 4 | 5 | undefined>(undefined)
  const [xacNhanXoaBuoi, datXacNhanXoaBuoi] = useState(false)

  const mauTap = useLiveQuery(
    async () => (await db.buoiTapMau.toArray()).filter((m) => !m.deletedAt),
    [],
  )
  const baiTap = useLiveQuery(() => db.baiTap.toArray(), [])
  const lich = useLiveQuery(() => db.lichTap.toArray(), [])
  const tuanNay = useLiveQuery(
    () => layNhatKyTapTheoKhoang(themNgay(ngayLocal(), -6), ngayLocal()),
    [],
  )
  const setCuaBuoiXem = useLiveQuery(async () => {
    if (!xemBuoi?.id) return []
    const sets = await db.setTap.where('nhatKyTapId').equals(xemBuoi.id).sortBy('thuTuSet')
    const dsBaiTapId = [...new Set(sets.map((s) => s.baiTapId))]
    const baiTapCuaBuoi = await db.baiTap.bulkGet(dsBaiTapId)
    return dsBaiTapId.map((baiTapId, i) => ({
      bai: baiTapCuaBuoi[i],
      sets: sets.filter((s) => s.baiTapId === baiTapId),
    }))
  }, [xemBuoi?.id])

  const baiTapLoc = (baiTap ?? []).filter(
    (b) => nhomLoc === 'tat_ca' || b.nhomCo === nhomLoc,
  )

  function moTaoMauMoi() {
    datDangSuaMau(null)
    datTenMau('')
    datBaiDaChon([])
    datMoTaoMau(true)
  }

  function moSuaMau(m: BuoiTapMau) {
    datDangSuaMau(m)
    datTenMau(m.ten)
    datBaiDaChon([...m.baiTap])
    datMoTaoMau(true)
  }

  async function luuMau() {
    if (!tenMau.trim() || baiDaChon.length === 0) {
      hien('Cần đặt tên và chọn ít nhất một bài tập', 'loi')
      return
    }
    const bayGio = Date.now()
    if (dangSuaMau) {
      await db.buoiTapMau.update(dangSuaMau.id!, {
        ten: tenMau.trim(), baiTap: baiDaChon, suaLuc: bayGio,
      })
    } else {
      await db.buoiTapMau.add({
        ten: tenMau.trim(), ghiChu: '', baiTap: baiDaChon, taoLuc: bayGio, suaLuc: bayGio,
      })
    }
    datMoTaoMau(false)
    hien('Đã lưu buổi tập')
  }

  function moXemBuoi(b: NhatKyTap) {
    datXemBuoi(b)
    datGhiChuSua(b.ghiChu)
    datCamNhanSua(b.camNhan)
  }

  async function luuGhiChuBuoi() {
    if (!xemBuoi) return
    await db.nhatKyTap.update(xemBuoi.id!, {
      ghiChu: ghiChuSua, camNhan: camNhanSua, suaLuc: Date.now(),
    })
    hien('Đã lưu')
    datXemBuoi(null)
  }

  async function xoaBuoi() {
    if (!xemBuoi) return
    const idBuoi = xemBuoi.id!
    await xoaMem(db.nhatKyTap, idBuoi)
    datXacNhanXoaBuoi(false)
    datXemBuoi(null)
    hien('Đã xóa buổi tập', 'thanh_cong', async () => {
      await khoiPhuc(db.nhatKyTap, idBuoi)
      an()
    })
  }

  async function doiLich(mauId: number, thu: number) {
    const daCo = await db.lichTap
      .where('thuTrongTuan').equals(thu)
      .filter((l) => l.buoiTapMauId === mauId)
      .first()
    if (daCo) await db.lichTap.delete(daCo.id!)
    else await db.lichTap.add({ thuTrongTuan: thu, buoiTapMauId: mauId })
  }

  return (
    <div>
      <TieuDeTrang>Tập luyện</TieuDeTrang>

      <div className="flex gap-1 mb-4 border-b border-slate-800">
        {([
          ['lich', 'Lịch tuần'],
          ['buoi_tap', 'Buổi tập'],
          ['thu_vien', 'Thư viện'],
        ] as [Tab, string][]).map(([ma, nhan]) => (
          <button
            key={ma}
            onClick={() => datTab(ma)}
            className={`flex-1 pb-2.5 text-sm border-b-2 transition ${
              tab === ma ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500'
            }`}
          >
            {nhan}
          </button>
        ))}
      </div>

      {tab === 'lich' && (
        <>
          <div className="the mb-4">
            <div className="text-sm font-medium mb-3">Tuần này</div>
            <div className="flex justify-between">
              {THU.map((t, i) => {
                const ngay = themNgay(ngayLocal(), i - new Date().getDay())
                const daTap = tuanNay?.some((b) => b.ngay === ngay && b.ketThuc)
                const coLich = lich?.some((l) => l.thuTrongTuan === i)
                const laHomNay = ngay === ngayLocal()
                return (
                  <div key={t} className="flex flex-col items-center gap-1.5">
                    <span className={`text-xs ${laHomNay ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {t}
                    </span>
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center text-sm ${
                        daTap
                          ? 'bg-emerald-500 text-slate-950 font-semibold'
                          : coLich
                            ? 'border border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-800 text-slate-600'
                      }`}
                    >
                      {daTap ? '✓' : coLich ? '•' : ''}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              {tuanNay?.filter((b) => b.ketThuc).length ?? 0} buổi đã tập tuần này
            </p>
          </div>

          {mauTap && mauTap.length > 0 ? (
            <div className="space-y-2">
              {mauTap.map((m) => {
                const cacThu = (lich ?? [])
                  .filter((l) => l.buoiTapMauId === m.id)
                  .map((l) => THU[l.thuTrongTuan])
                return (
                  <div key={m.id} className="the">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium">{m.ten}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {m.baiTap.length} bài
                          {cacThu.length > 0 && ` · ${cacThu.join(', ')}`}
                        </div>
                      </div>
                      <button
                        onClick={() => dieuHuong(`/ghi-buoi-tap/${m.id}`)}
                        className="nut-chinh py-2 px-3 text-sm shrink-0"
                      >
                        Bắt đầu
                      </button>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800">
                      <button onClick={() => datGanLich(m)} className="text-xs text-slate-400">
                        Đặt lịch
                      </button>
                      <button onClick={() => moSuaMau(m)} className="text-xs text-slate-400">
                        Sửa
                      </button>
                      <button
                        onClick={async () => {
                          await xoaMem(db.buoiTapMau, m.id!)
                          hien('Đã xóa buổi tập', 'thanh_cong', async () => {
                            await khoiPhuc(db.buoiTapMau, m.id!)
                            an()
                          })
                        }}
                        className="text-xs text-slate-600 ml-auto"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <TrangRong
              bieuTuong="💪"
              tieuDe="Chưa có buổi tập nào"
              moTa="Tạo một buổi tập mẫu gồm các bài bạn hay tập, rồi gán vào các ngày trong tuần."
              hanhDong={
                <button className="nut-chinh" onClick={moTaoMauMoi}>
                  Tạo buổi tập
                </button>
              }
            />
          )}

          {mauTap && mauTap.length > 0 && (
            <button className="nut-phu w-full mt-4" onClick={moTaoMauMoi}>
              + Tạo buổi tập mới
            </button>
          )}

          <button
            className="nut-vien w-full mt-3"
            onClick={() => dieuHuong('/ghi-buoi-tap/tu-do')}
          >
            Tập tự do (không theo mẫu)
          </button>
        </>
      )}

      {tab === 'buoi_tap' && (
        <div className="space-y-2">
          {tuanNay && tuanNay.length > 0 ? (
            [...tuanNay].reverse().map((b) => (
              <button
                key={b.id}
                onClick={() => moXemBuoi(b)}
                className="the w-full text-left hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{b.ten}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {new Date(b.ngay + 'T00:00:00').toLocaleDateString('vi-VN')}
                      {b.ketThuc &&
                        ` · ${Math.round((b.ketThuc - b.batDau) / 60000)} phút`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{b.tongVolume} kg</div>
                    <div className="text-xs text-slate-500">{b.caloDot} kcal</div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <TrangRong bieuTuong="📋" tieuDe="Tuần này chưa tập buổi nào" />
          )}
        </div>
      )}

      {tab === 'thu_vien' && (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto an-thanh-cuon">
            <button
              onClick={() => datNhomLoc('tat_ca')}
              className={`shrink-0 text-sm ${nhomLoc === 'tat_ca' ? 'chip-bat' : 'chip-tat'}`}
            >
              Tất cả
            </button>
            {(Object.keys(NHAN_NHOM_CO) as NhomCo[]).map((n) => (
              <button
                key={n}
                onClick={() => datNhomLoc(n)}
                className={`shrink-0 text-sm ${nhomLoc === n ? 'chip-bat' : 'chip-tat'}`}
              >
                {NHAN_NHOM_CO[n]}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {baiTapLoc.map((b) => (
              <button
                key={b.id}
                onClick={() => datXemBai(b)}
                className="the w-full text-left py-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{b.ten}</div>
                    <div className="text-xs text-slate-500">
                      {NHAN_NHOM_CO[b.nhomCo]} · {b.dungCu}
                    </div>
                  </div>
                  <span className="text-xs text-slate-600 shrink-0">MET {b.met}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <BangTruot
        mo={moTaoMau}
        dong={() => datMoTaoMau(false)}
        tieuDe={dangSuaMau ? 'Sửa buổi tập' : 'Tạo buổi tập'}
      >
        <div className="space-y-4">
          <div>
            <label className="nhan">Tên buổi tập</label>
            <input
              className="o-nhap"
              placeholder="Ví dụ: Ngực - Tay sau"
              value={tenMau}
              onChange={(e) => datTenMau(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="nhan mb-0">Bài tập ({baiDaChon.length})</label>
              <button onClick={() => datMoChonBai(true)} className="text-sm text-emerald-400">
                + Thêm bài
              </button>
            </div>
            {baiDaChon.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 py-6 text-center text-sm text-slate-600">
                Chưa chọn bài nào
              </div>
            ) : (
              <div className="space-y-2">
                {baiDaChon.map((bt, i) => {
                  const bai = baiTap?.find((b) => b.id === bt.baiTapId)
                  return (
                    <div key={i} className="the py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{bai?.ten ?? 'Bài tập'}</span>
                        <button
                          onClick={() => datBaiDaChon((cu) => cu.filter((_, j) => j !== i))}
                          className="text-slate-600 hover:text-rose-400 px-1"
                        >
                          ×
                        </button>
                      </div>
                      {bai?.laCardio ? (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-500">Thời lượng</span>
                          <input
                            type="number"
                            className="o-nhap py-1.5 w-20 text-center"
                            value={bt.phut ?? 30}
                            onChange={(e) =>
                              datBaiDaChon((cu) =>
                                cu.map((x, j) =>
                                  j === i ? { ...x, phut: parseInt(e.target.value) || 0 } : x,
                                ),
                              )
                            }
                          />
                          <span className="text-slate-500">phút</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {([
                            ['soSet', 'Set'],
                            ['soRep', 'Rep'],
                            ['taKg', 'Tạ (kg)'],
                          ] as const).map(([khoa, nhan]) => (
                            <div key={khoa}>
                              <div className="text-xs text-slate-500 mb-1">{nhan}</div>
                              <input
                                type="number"
                                className="o-nhap py-1.5 text-center"
                                value={bt[khoa]}
                                onChange={(e) =>
                                  datBaiDaChon((cu) =>
                                    cu.map((x, j) =>
                                      j === i
                                        ? { ...x, [khoa]: parseFloat(e.target.value) || 0 }
                                        : x,
                                    ),
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <button className="nut-chinh w-full" onClick={luuMau}>
            {dangSuaMau ? 'Lưu thay đổi' : 'Tạo buổi tập'}
          </button>
        </div>
      </BangTruot>

      <BangTruot mo={moChonBai} dong={() => datMoChonBai(false)} tieuDe="Chọn bài tập">
        <div className="flex gap-2 mb-4 overflow-x-auto an-thanh-cuon">
          <button
            onClick={() => datNhomLoc('tat_ca')}
            className={`shrink-0 text-sm ${nhomLoc === 'tat_ca' ? 'chip-bat' : 'chip-tat'}`}
          >
            Tất cả
          </button>
          {(Object.keys(NHAN_NHOM_CO) as NhomCo[]).map((n) => (
            <button
              key={n}
              onClick={() => datNhomLoc(n)}
              className={`shrink-0 text-sm ${nhomLoc === n ? 'chip-bat' : 'chip-tat'}`}
            >
              {NHAN_NHOM_CO[n]}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {baiTapLoc.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                datBaiDaChon((cu) => [
                  ...cu,
                  b.laCardio
                    ? { baiTapId: b.id!, soSet: 1, soRep: 0, taKg: 0, phut: 30 }
                    : { baiTapId: b.id!, soSet: 3, soRep: 10, taKg: 20 },
                ])
                datMoChonBai(false)
              }}
              className="the w-full text-left py-3"
            >
              <div className="font-medium text-sm">{b.ten}</div>
              <div className="text-xs text-slate-500">
                {NHAN_NHOM_CO[b.nhomCo]} · {b.dungCu}
              </div>
            </button>
          ))}
        </div>
      </BangTruot>

      <BangTruot mo={!!xemBai} dong={() => datXemBai(null)} tieuDe={xemBai?.ten ?? ''}>
        {xemBai && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <span className="chip-tat">{NHAN_NHOM_CO[xemBai.nhomCo]}</span>
              <span className="chip-tat">{xemBai.dungCu}</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{xemBai.moTa}</p>
            <p className="text-xs text-slate-500">
              MET {xemBai.met} — dùng để ước lượng calo đốt theo cân nặng và thời gian tập.
            </p>
          </div>
        )}
      </BangTruot>

      <BangTruot
        mo={!!ganLich}
        dong={() => datGanLich(null)}
        tieuDe={ganLich ? `Đặt lịch: ${ganLich.ten}` : ''}
      >
        {ganLich && (
          <>
            <p className="text-sm text-slate-500 mb-4">
              Chọn các ngày trong tuần bạn muốn tập buổi này. Lịch lặp lại hàng tuần.
            </p>
            <div className="grid grid-cols-7 gap-2">
              {THU.map((t, i) => {
                const bat = lich?.some(
                  (l) => l.thuTrongTuan === i && l.buoiTapMauId === ganLich.id,
                )
                return (
                  <button
                    key={t}
                    onClick={() => doiLich(ganLich.id!, i)}
                    className={`py-3 text-sm rounded-xl border transition ${
                      bat
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                        : 'border-slate-700 text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </BangTruot>

      <BangTruot mo={!!xemBuoi} dong={() => datXemBuoi(null)} tieuDe={xemBuoi?.ten ?? ''}>
        {xemBuoi && (
          <div className="space-y-5">
            <div className="the grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm font-semibold">
                  {new Date(xemBuoi.ngay + 'T00:00:00').toLocaleDateString('vi-VN')}
                </div>
                <div className="text-xs text-slate-500">Ngày</div>
              </div>
              <div>
                <div className="text-sm font-semibold">{xemBuoi.tongVolume} kg</div>
                <div className="text-xs text-slate-500">Volume</div>
              </div>
              <div>
                <div className="text-sm font-semibold">{xemBuoi.caloDot} kcal</div>
                <div className="text-xs text-slate-500">Calo đốt</div>
              </div>
            </div>

            <div className="space-y-2">
              {setCuaBuoiXem?.map(({ bai, sets }) => (
                <div key={bai?.id} className="the py-3">
                  <div className="font-medium text-sm mb-1.5">{bai?.ten ?? 'Bài tập'}</div>
                  <div className="text-xs text-slate-500">
                    {bai?.laCardio
                      ? sets.map((s) => `${s.phut ?? 0} phút`).join(', ')
                      : sets
                          .filter((s) => s.hoanThanh)
                          .map((s) => `${s.taKg}kg×${s.rep}`)
                          .join(', ') || 'Không có set nào hoàn thành'}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="nhan">
                Cảm nhận {camNhanSua ? `(${camNhanSua}/5)` : ''}
              </label>
              <div className="flex gap-1.5">
                {([1, 2, 3, 4, 5] as const).map((sao) => (
                  <button
                    key={sao}
                    onClick={() => datCamNhanSua(sao)}
                    className="flex-1 rounded-xl border border-slate-700 py-2.5 text-xl leading-none"
                    aria-label={`${sao} sao`}
                  >
                    {(camNhanSua ?? 0) >= sao ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="nhan">Ghi chú</label>
              <textarea
                className="o-nhap"
                rows={3}
                placeholder="Cảm giác buổi tập, chấn thương, ghi chú khác..."
                value={ghiChuSua}
                onChange={(e) => datGhiChuSua(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button className="nut-nguy-hiem flex-1" onClick={() => datXacNhanXoaBuoi(true)}>
                Xóa buổi tập
              </button>
              <button className="nut-chinh flex-1" onClick={luuGhiChuBuoi}>
                Lưu
              </button>
            </div>
          </div>
        )}
      </BangTruot>

      <HopThoaiXacNhan
        mo={xacNhanXoaBuoi}
        tieuDe="Xóa buổi tập này?"
        noiDung={`Toàn bộ dữ liệu buổi "${xemBuoi?.ten ?? ''}" sẽ bị xóa. Bạn hoàn tác được trong ít giây sau khi xóa.`}
        nhanDongY="Xóa"
        nguyHiem
        huy={() => datXacNhanXoaBuoi(false)}
        dongY={xoaBuoi}
      />

      {thongBao && (
        <ThongBao noiDung={thongBao.noiDung} loai={thongBao.loai} hoanTac={thongBao.hoanTac} />
      )}
    </div>
  )
}
