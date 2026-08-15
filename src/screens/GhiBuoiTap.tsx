import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../db/db'
import { laySetGanNhatCuaBai } from '../db/truyvan'
import { NHAN_NHOM_CO } from '../data/baitap'
import { ngayLocal, tinh1RM, tinhCaloDot, tinhVolume } from '../lib/tinhtoan'
import { useCaiDat, useChiSoMucTieu, useNguoiDung, useThongBao } from '../hooks/useApp'
import { BangTruot, HopThoaiXacNhan, ThongBao } from '../components/chung'
import type { BaiTap, NhomCo } from '../lib/types'

interface SetDangTap {
  baiTapId: number
  thuTuSet: number
  rep: number
  taKg: number
  phut?: number
  hoanThanh: boolean
}

const THOI_GIAN_NGHI_MAC_DINH = 90

function DemNguoc({ giay, dung }: { giay: number; dung: () => void }) {
  const phut = Math.floor(giay / 60)
  const con = giay % 60
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-800 bg-slate-900 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-lg flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">Nghỉ giữa set</div>
          <div className="text-2xl font-bold tabular-nums">
            {phut}:{String(con).padStart(2, '0')}
          </div>
        </div>
        <button onClick={dung} className="nut-phu py-2">Bỏ qua</button>
      </div>
    </div>
  )
}

export default function GhiBuoiTap() {
  const { id } = useParams()
  const dieuHuong = useNavigate()
  const nguoiDung = useNguoiDung()
  const mucTieu = useChiSoMucTieu(nguoiDung)
  const { thongBao } = useThongBao()
  const [thoiGianNghi] = useCaiDat<number>('thoiGianNghi', THOI_GIAN_NGHI_MAC_DINH)

  const laTuDo = id === 'tu-do'
  const mauId = laTuDo ? undefined : Number(id)

  const [batDau] = useState(Date.now())
  const [sets, datSets] = useState<SetDangTap[]>([])
  const [dsBaiTap, datDsBaiTap] = useState<number[]>([])
  const [demNghi, datDemNghi] = useState<number | null>(null)
  const [moThemBai, datMoThemBai] = useState(false)
  const [nhomLoc, datNhomLoc] = useState<NhomCo | 'tat_ca'>('tat_ca')
  const [xacNhanKetThuc, datXacNhanKetThuc] = useState(false)
  const [xacNhanThoat, datXacNhanThoat] = useState(false)
  const [daKhoiTao, datDaKhoiTao] = useState(false)

  const mau = useLiveQuery(
    () => (mauId ? db.buoiTapMau.get(mauId) : undefined),
    [mauId],
  )
  const baiTapTatCa = useLiveQuery(() => db.baiTap.toArray(), [])
  const timeoutRef = useRef<number>()

  // Nạp các bài từ buổi tập mẫu vào lần đầu mở màn hình.
  useEffect(() => {
    if (daKhoiTao || laTuDo) {
      if (laTuDo) datDaKhoiTao(true)
      return
    }
    if (!mau) return
    datDsBaiTap(mau.baiTap.map((b) => b.baiTapId))
    datSets(
      mau.baiTap.flatMap((b) =>
        Array.from({ length: Math.max(b.soSet, 1) }, (_, i) => ({
          baiTapId: b.baiTapId,
          thuTuSet: i + 1,
          rep: b.soRep,
          taKg: b.taKg,
          phut: b.phut,
          hoanThanh: false,
        })),
      ),
    )
    datDaKhoiTao(true)
  }, [mau, laTuDo, daKhoiTao])

  // Đồng hồ nghỉ giữa set.
  useEffect(() => {
    if (demNghi === null) return
    if (demNghi <= 0) {
      datDemNghi(null)
      // Rung nhẹ để báo hết giờ nghỉ, máy không hỗ trợ thì bỏ qua.
      navigator.vibrate?.([200, 100, 200])
      return
    }
    timeoutRef.current = window.setTimeout(() => datDemNghi((t) => (t === null ? null : t - 1)), 1000)
    return () => clearTimeout(timeoutRef.current)
  }, [demNghi])

  if (!nguoiDung || !mucTieu) return null

  function baiCua(baiTapId: number): BaiTap | undefined {
    return baiTapTatCa?.find((b) => b.id === baiTapId)
  }

  function doiSet(baiTapId: number, thuTu: number, thayDoi: Partial<SetDangTap>) {
    datSets((cu) =>
      cu.map((s) =>
        s.baiTapId === baiTapId && s.thuTuSet === thuTu ? { ...s, ...thayDoi } : s,
      ),
    )
  }

  function tickSet(baiTapId: number, thuTu: number, dangHoanThanh: boolean) {
    doiSet(baiTapId, thuTu, { hoanThanh: dangHoanThanh })
    // Chỉ đếm nghỉ khi vừa tick xong một set, không đếm khi bỏ tick.
    if (dangHoanThanh && !baiCua(baiTapId)?.laCardio) datDemNghi(thoiGianNghi)
  }

  function themSet(baiTapId: number) {
    const cua = sets.filter((s) => s.baiTapId === baiTapId)
    const cuoi = cua[cua.length - 1]
    datSets((cu) => [
      ...cu,
      {
        baiTapId,
        thuTuSet: (cuoi?.thuTuSet ?? 0) + 1,
        rep: cuoi?.rep ?? 10,
        taKg: cuoi?.taKg ?? 20,
        phut: cuoi?.phut,
        hoanThanh: false,
      },
    ])
  }

  const setDaXong = sets.filter((s) => s.hoanThanh)
  const tongVolume = tinhVolume(
    sets.filter((s) => !baiCua(s.baiTapId)?.laCardio).map((s) => ({
      taKg: s.taKg, rep: s.rep, hoanThanh: s.hoanThanh,
    })),
  )
  const soPhutTap = Math.max(1, Math.round((Date.now() - batDau) / 60000))
  const caloDot = sets
    .filter((s) => s.hoanThanh)
    .reduce((tong, s) => {
      const bai = baiCua(s.baiTapId)
      if (!bai) return tong
      // Cardio tính theo thời lượng nhập; bài tạ ước lượng 1 phút cho mỗi set.
      const phut = bai.laCardio ? (s.phut ?? 0) : 1
      return tong + tinhCaloDot(bai.met, mucTieu.canNangHienTai, phut)
    }, 0)

  async function ketThuc() {
    if (setDaXong.length === 0) {
      dieuHuong('/tap-luyen')
      return
    }
    const bayGio = Date.now()
    const nhatKyId = await db.nhatKyTap.add({
      ngay: ngayLocal(),
      buoiTapMauId: mauId,
      ten: mau?.ten ?? 'Tập tự do',
      batDau,
      ketThuc: bayGio,
      tongVolume,
      caloDot,
      ghiChu: '',
      taoLuc: bayGio,
      suaLuc: bayGio,
    })
    await db.setTap.bulkAdd(
      sets.map((s) => ({
        nhatKyTapId: nhatKyId,
        baiTapId: s.baiTapId,
        thuTuSet: s.thuTuSet,
        rep: s.rep,
        taKg: s.taKg,
        phut: s.phut,
        hoanThanh: s.hoanThanh,
      })),
    )
    dieuHuong('/tap-luyen')
  }

  const baiTapLoc = (baiTapTatCa ?? []).filter(
    (b) => nhomLoc === 'tat_ca' || b.nhomCo === nhomLoc,
  )

  return (
    <div className={demNghi !== null ? 'pb-24' : 'pb-6'}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => (setDaXong.length > 0 ? datXacNhanThoat(true) : dieuHuong('/tap-luyen'))}
          className="nut-phu px-3 py-2"
        >
          ←
        </button>
        <div className="text-center">
          <div className="font-semibold">{mau?.ten ?? 'Tập tự do'}</div>
          <div className="text-xs text-slate-500">{soPhutTap} phút</div>
        </div>
        <button
          onClick={() => datXacNhanKetThuc(true)}
          className="text-sm text-emerald-400 px-2"
        >
          Xong
        </button>
      </div>

      <div className="the mb-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold">{setDaXong.length}</div>
          <div className="text-xs text-slate-500">Set đã xong</div>
        </div>
        <div>
          <div className="text-lg font-bold">{tongVolume}</div>
          <div className="text-xs text-slate-500">Volume (kg)</div>
        </div>
        <div>
          <div className="text-lg font-bold">{caloDot}</div>
          <div className="text-xs text-slate-500">Calo đốt</div>
        </div>
      </div>

      <div className="space-y-4">
        {dsBaiTap.map((baiTapId) => {
          const bai = baiCua(baiTapId)
          const cua = sets.filter((s) => s.baiTapId === baiTapId)
          return (
            <BaiTapTrongBuoi
              key={baiTapId}
              bai={bai}
              sets={cua}
              doiSet={doiSet}
              tickSet={tickSet}
              themSet={() => themSet(baiTapId)}
              boBai={() => {
                datDsBaiTap((cu) => cu.filter((x) => x !== baiTapId))
                datSets((cu) => cu.filter((s) => s.baiTapId !== baiTapId))
              }}
            />
          )
        })}
      </div>

      <button className="nut-phu w-full mt-4" onClick={() => datMoThemBai(true)}>
        + Thêm bài tập
      </button>

      {demNghi !== null && <DemNguoc giay={demNghi} dung={() => datDemNghi(null)} />}

      <BangTruot mo={moThemBai} dong={() => datMoThemBai(false)} tieuDe="Thêm bài tập">
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
                if (!dsBaiTap.includes(b.id!)) {
                  datDsBaiTap((cu) => [...cu, b.id!])
                  datSets((cu) => [
                    ...cu,
                    ...Array.from({ length: b.laCardio ? 1 : 3 }, (_, i) => ({
                      baiTapId: b.id!,
                      thuTuSet: i + 1,
                      rep: b.laCardio ? 0 : 10,
                      taKg: b.laCardio ? 0 : 20,
                      phut: b.laCardio ? 30 : undefined,
                      hoanThanh: false,
                    })),
                  ])
                }
                datMoThemBai(false)
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

      <HopThoaiXacNhan
        mo={xacNhanKetThuc}
        tieuDe="Kết thúc buổi tập?"
        noiDung={
          setDaXong.length === 0
            ? 'Bạn chưa hoàn thành set nào, buổi tập sẽ không được lưu.'
            : `Lưu lại ${setDaXong.length} set, tổng volume ${tongVolume} kg.`
        }
        nhanDongY={setDaXong.length === 0 ? 'Thoát' : 'Lưu và kết thúc'}
        huy={() => datXacNhanKetThuc(false)}
        dongY={ketThuc}
      />

      <HopThoaiXacNhan
        mo={xacNhanThoat}
        tieuDe="Thoát mà không lưu?"
        noiDung={`Bạn đã hoàn thành ${setDaXong.length} set. Thoát bây giờ sẽ mất hết.`}
        nhanDongY="Thoát, không lưu"
        nguyHiem
        huy={() => datXacNhanThoat(false)}
        dongY={() => dieuHuong('/tap-luyen')}
      />

      {thongBao && <ThongBao noiDung={thongBao.noiDung} loai={thongBao.loai} />}
    </div>
  )
}

function BaiTapTrongBuoi({
  bai, sets, doiSet, tickSet, themSet, boBai,
}: {
  bai: BaiTap | undefined
  sets: SetDangTap[]
  doiSet: (baiTapId: number, thuTu: number, thayDoi: Partial<SetDangTap>) => void
  tickSet: (baiTapId: number, thuTu: number, hoanThanh: boolean) => void
  themSet: () => void
  boBai: () => void
}) {
  const lanTruoc = useLiveQuery(
    () => (bai?.id ? laySetGanNhatCuaBai(bai.id) : null),
    [bai?.id],
  )

  if (!bai) return null

  const totNhat = sets
    .filter((s) => s.hoanThanh && s.taKg > 0)
    .reduce((max, s) => Math.max(max, tinh1RM(s.taKg, s.rep)), 0)

  return (
    <div className="the">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="font-medium">{bai.ten}</div>
          {lanTruoc && (
            <div className="text-xs text-slate-500 mt-0.5">
              Lần trước ({new Date(lanTruoc.ngay + 'T00:00:00').toLocaleDateString('vi-VN')}):{' '}
              {lanTruoc.sets.map((s) => `${s.taKg}×${s.rep}`).join(', ')}
            </div>
          )}
        </div>
        <button onClick={boBai} className="text-slate-600 hover:text-rose-400 px-1 shrink-0">
          ×
        </button>
      </div>

      <div className="space-y-2">
        {bai.laCardio ? (
          sets.map((s) => (
            <div key={s.thuTuSet} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-8">Phút</span>
              <input
                type="number"
                inputMode="numeric"
                className="o-nhap py-2 flex-1 text-center"
                value={s.phut ?? 0}
                onChange={(e) =>
                  doiSet(bai.id!, s.thuTuSet, { phut: parseInt(e.target.value) || 0 })
                }
              />
              <button
                onClick={() => tickSet(bai.id!, s.thuTuSet, !s.hoanThanh)}
                className={`h-11 w-11 shrink-0 rounded-xl border text-lg transition ${
                  s.hoanThanh
                    ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                    : 'border-slate-700 text-slate-600'
                }`}
              >
                ✓
              </button>
            </div>
          ))
        ) : (
          <>
            <div className="grid grid-cols-[2rem_1fr_1fr_2.75rem] gap-2 text-xs text-slate-500 px-1">
              <span>Set</span>
              <span className="text-center">Tạ (kg)</span>
              <span className="text-center">Rep</span>
              <span />
            </div>
            {sets.map((s) => (
              <div key={s.thuTuSet} className="grid grid-cols-[2rem_1fr_1fr_2.75rem] gap-2 items-center">
                <span className="text-sm text-slate-500 text-center">{s.thuTuSet}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  className={`o-nhap py-2 text-center ${s.hoanThanh ? 'opacity-60' : ''}`}
                  value={s.taKg}
                  onChange={(e) =>
                    doiSet(bai.id!, s.thuTuSet, { taKg: parseFloat(e.target.value) || 0 })
                  }
                />
                <input
                  type="number"
                  inputMode="numeric"
                  className={`o-nhap py-2 text-center ${s.hoanThanh ? 'opacity-60' : ''}`}
                  value={s.rep}
                  onChange={(e) =>
                    doiSet(bai.id!, s.thuTuSet, { rep: parseInt(e.target.value) || 0 })
                  }
                />
                <button
                  onClick={() => tickSet(bai.id!, s.thuTuSet, !s.hoanThanh)}
                  className={`h-11 rounded-xl border text-lg transition ${
                    s.hoanThanh
                      ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                      : 'border-slate-700 text-slate-600'
                  }`}
                  aria-label={`Đánh dấu set ${s.thuTuSet}`}
                >
                  ✓
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
        <button onClick={themSet} className="text-sm text-emerald-400">
          + Thêm set
        </button>
        {totNhat > 0 && (
          <span className="text-xs text-slate-500">1RM ước lượng {totNhat} kg</span>
        )}
      </div>
    </div>
  )
}
