import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, luuNguoiDung } from '../db/db'
import {
  docFileSaoLuu, nhapDuLieu, taiFileCsv, taiFileJson, uocLuongDungLuong,
  xinLuuTruBenVung, xuatCsvCanNang, xuatCsvNhatKyAn, xuatDuLieu,
} from '../db/saoluu'
import {
  MACRO_MAC_DINH, NHAN_MUC_TIEU, NHAN_MUC_VAN_DONG, ngayLocal,
  tinhCaloMucTieu, tinhMacroGam, tinhTuoi,
} from '../lib/tinhtoan'
import { useCaiDat, useChiSoMucTieu, useNguoiDung, useThongBao } from '../hooks/useApp'
import {
  BangTruot, HopThoaiXacNhan, NhapSo, ThongBao, TieuDeTrang,
} from '../components/chung'
import type { MucTieu, MucVanDong } from '../lib/types'

const MODEL = [
  { ma: 'claude-sonnet-5', nhan: 'Sonnet 5', moTa: 'Cân bằng giữa độ chính xác và chi phí' },
  { ma: 'claude-opus-5', nhan: 'Opus 5', moTa: 'Chính xác nhất, đắt hơn' },
  { ma: 'claude-haiku-4-5-20251001', nhan: 'Haiku 4.5', moTa: 'Rẻ và nhanh nhất' },
]

export default function CaiDat() {
  const dieuHuong = useNavigate()
  const nguoiDung = useNguoiDung()
  const mucTieuHienTai = useChiSoMucTieu(nguoiDung)
  const { thongBao, hien } = useThongBao()

  const [apiKey, datApiKey] = useCaiDat<string>('apiKey', '')
  const [model, datModel] = useCaiDat<string>('model', 'claude-sonnet-5')
  const [thoiGianNghi, datThoiGianNghi] = useCaiDat<number>('thoiGianNghi', 90)

  const [keyTam, datKeyTam] = useState('')
  const [moHoSo, datMoHoSo] = useState(false)
  const [moMucTieu, datMoMucTieu] = useState(false)
  const [moApi, datMoApi] = useState(false)
  const [xacNhanXoa, datXacNhanXoa] = useState(false)
  const [xacNhanNhap, datXacNhanNhap] = useState<{ file: File; cheDo: 'thay_the' | 'tron' } | null>(null)
  const [dungLuong, datDungLuong] = useState<{ dungMb: number; conMb: number } | null>(null)
  const [benVung, datBenVung] = useState<boolean | null>(null)
  const [dangXuat, datDangXuat] = useState(false)

  // Form hồ sơ
  const [ten, datTen] = useState('')
  const [chieuCao, datChieuCao] = useState(170)
  const [mucVanDong, datMucVanDong] = useState<MucVanDong>('nhe')
  const [mucTieu, datMucTieu] = useState<MucTieu>('giam_can')
  const [canNangMucTieu, datCanNangMucTieu] = useState(65)
  const [tocDo, datTocDo] = useState(0.5)
  const [caloTuChinh, datCaloTuChinh] = useState(2000)
  const [congCaloTap, datCongCaloTap] = useState(false)

  const nhapFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    uocLuongDungLuong().then(datDungLuong)
    navigator.storage?.persisted?.().then(datBenVung)
  }, [])

  useEffect(() => {
    if (!nguoiDung) return
    datTen(nguoiDung.ten)
    datChieuCao(nguoiDung.chieuCaoCm)
    datMucVanDong(nguoiDung.mucVanDong)
    datMucTieu(nguoiDung.mucTieu)
    datCanNangMucTieu(nguoiDung.canNangMucTieuKg)
    datTocDo(nguoiDung.tocDoKgTuan)
    datCaloTuChinh(nguoiDung.caloMucTieu)
    datCongCaloTap(nguoiDung.congCaloTapLuyen)
  }, [nguoiDung])

  useEffect(() => datKeyTam(apiKey), [apiKey])

  if (!nguoiDung || !mucTieuHienTai) return null

  async function luuHoSo() {
    if (!nguoiDung) return
    await luuNguoiDung({
      ...nguoiDung,
      ten: ten.trim() || 'Bạn',
      chieuCaoCm: chieuCao,
      mucVanDong,
      congCaloTapLuyen: congCaloTap,
      suaLuc: Date.now(),
    })
    datMoHoSo(false)
    hien('Đã lưu hồ sơ')
  }

  async function luuMucTieu() {
    if (!nguoiDung) return
    const tyLe = MACRO_MAC_DINH[mucTieu]
    await luuNguoiDung({
      ...nguoiDung,
      mucTieu,
      canNangMucTieuKg: canNangMucTieu,
      tocDoKgTuan: tocDo,
      caloMucTieu: caloTuChinh,
      macroDamPhanTram: tyLe.dam,
      macroTinhbotPhanTram: tyLe.tinhbot,
      macroBeoPhanTram: tyLe.beo,
      suaLuc: Date.now(),
    })
    datMoMucTieu(false)
    hien('Đã lưu mục tiêu')
  }

  function tinhLaiCalo() {
    if (!nguoiDung || !mucTieuHienTai) return
    const kq = tinhCaloMucTieu(mucTieuHienTai.tdee, mucTieu, tocDo, nguoiDung.gioiTinh)
    datCaloTuChinh(kq.calo)
    if (kq.biKep) {
      hien(`Đã nâng lên ${kq.calo} kcal vì mức tính ra thấp hơn ngưỡng an toàn`, 'loi')
    }
  }

  async function xuatJson(kemAnh: boolean) {
    datDangXuat(true)
    try {
      taiFileJson(await xuatDuLieu(kemAnh))
      hien('Đã tải file sao lưu')
    } catch {
      hien('Không xuất được dữ liệu', 'loi')
    } finally {
      datDangXuat(false)
    }
  }

  async function thucHienNhap() {
    if (!xacNhanNhap) return
    const { file, cheDo } = xacNhanNhap
    datXacNhanNhap(null)
    try {
      const goi = await docFileSaoLuu(file)
      const kq = await nhapDuLieu(goi, cheDo)
      hien(
        kq.thanhCong ? `Đã nhập ${kq.soBanGhi} bản ghi` : (kq.loi ?? 'Nhập thất bại'),
        kq.thanhCong ? 'thanh_cong' : 'loi',
      )
    } catch {
      hien('File không đọc được. Hãy chọn đúng file .json đã xuất từ app.', 'loi')
    }
  }

  const macroXemTruoc = tinhMacroGam(caloTuChinh, MACRO_MAC_DINH[mucTieu])

  return (
    <div>
      <div className="flex items-center gap-3">
        <button onClick={() => dieuHuong(-1)} className="nut-phu px-3 py-2">←</button>
        <TieuDeTrang>Cài đặt</TieuDeTrang>
      </div>

      <div className="the mb-4 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl">
          {nguoiDung.ten.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-semibold">{nguoiDung.ten}</div>
          <div className="text-sm text-slate-500">
            {tinhTuoi(nguoiDung.ngaySinh)} tuổi · {nguoiDung.chieuCaoCm} cm ·{' '}
            {mucTieuHienTai.canNangHienTai} kg
          </div>
        </div>
      </div>

      <section className="mb-5">
        <h2 className="text-sm font-medium text-slate-400 mb-2">Hồ sơ & mục tiêu</h2>
        <div className="the divide-y divide-slate-800 p-0">
          <button onClick={() => datMoHoSo(true)} className="w-full flex items-center justify-between p-4">
            <span className="text-sm">Thông tin cá nhân</span>
            <span className="text-slate-600">›</span>
          </button>
          <button onClick={() => datMoMucTieu(true)} className="w-full flex items-center justify-between p-4">
            <div className="text-left">
              <div className="text-sm">Mục tiêu dinh dưỡng</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {mucTieuHienTai.calo} kcal · Đ {mucTieuHienTai.dam}g · TB{' '}
                {mucTieuHienTai.tinhbot}g · B {mucTieuHienTai.beo}g
              </div>
            </div>
            <span className="text-slate-600">›</span>
          </button>
        </div>
      </section>

      <section className="mb-5">
        <h2 className="text-sm font-medium text-slate-400 mb-2">Nhận diện ảnh</h2>
        <div className="the">
          <button onClick={() => datMoApi(true)} className="w-full flex items-center justify-between">
            <div className="text-left">
              <div className="text-sm">API key</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {apiKey
                  ? `Đã cài · ${MODEL.find((m) => m.ma === model)?.nhan ?? model}`
                  : 'Chưa cài — nhận diện ảnh chưa dùng được'}
              </div>
            </div>
            <span className="text-slate-600">›</span>
          </button>
        </div>
      </section>

      <section className="mb-5">
        <h2 className="text-sm font-medium text-slate-400 mb-2">Tập luyện</h2>
        <div className="the">
          <label className="nhan">Thời gian nghỉ giữa set</label>
          <NhapSo
            giaTri={thoiGianNghi}
            doiGiaTri={(v) => datThoiGianNghi(v)}
            buoc={15} toiThieu={15} toiDa={600} donVi="giây"
          />
        </div>
      </section>

      <section className="mb-5">
        <h2 className="text-sm font-medium text-slate-400 mb-2">Dữ liệu của bạn</h2>

        <div className="the mb-3">
          <div className="flex items-start gap-3">
            <span className="text-xl">{benVung ? '🔒' : '⚠️'}</span>
            <div className="flex-1">
              <div className="text-sm font-medium">
                {benVung ? 'Dữ liệu được giữ bền vững' : 'Dữ liệu chưa được bảo vệ'}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {benVung
                  ? 'Trình duyệt cam kết không tự xóa dữ liệu của app khi thiếu dung lượng.'
                  : 'Trình duyệt có thể xóa dữ liệu app khi máy hết chỗ. Hãy xuất file sao lưu định kỳ.'}
              </p>
              {dungLuong && (
                <p className="text-xs text-slate-600 mt-1.5">
                  Đang dùng {dungLuong.dungMb} MB · còn trống khoảng {Math.round(dungLuong.conMb)} MB
                </p>
              )}
              {!benVung && (
                <button
                  onClick={async () => {
                    const kq = await xinLuuTruBenVung()
                    datBenVung(kq)
                    hien(
                      kq
                        ? 'Đã bật chế độ giữ dữ liệu bền vững'
                        : 'Trình duyệt từ chối. Cài app lên màn hình chính thường sẽ được chấp nhận.',
                      kq ? 'thanh_cong' : 'loi',
                    )
                  }}
                  className="text-xs text-emerald-400 mt-2"
                >
                  Xin quyền giữ dữ liệu
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="the space-y-2.5">
          <p className="text-xs text-slate-500 leading-relaxed">
            Dữ liệu chỉ nằm trên máy này. Nếu mất máy hoặc xóa trình duyệt là mất hết — hãy xuất
            file sao lưu mỗi tháng và cất vào Google Drive hoặc email cho chính mình.
          </p>
          <button className="nut-chinh w-full" onClick={() => xuatJson(true)} disabled={dangXuat}>
            {dangXuat ? 'Đang xuất...' : '⬇️ Xuất toàn bộ (kèm ảnh)'}
          </button>
          <button className="nut-phu w-full" onClick={() => xuatJson(false)} disabled={dangXuat}>
            Xuất dữ liệu, không kèm ảnh (file nhẹ hơn)
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              className="nut-vien text-sm"
              onClick={async () =>
                taiFileCsv(await xuatCsvNhatKyAn(), `nhat-ky-an-${ngayLocal()}.csv`)
              }
            >
              CSV nhật ký ăn
            </button>
            <button
              className="nut-vien text-sm"
              onClick={async () =>
                taiFileCsv(await xuatCsvCanNang(), `can-nang-${ngayLocal()}.csv`)
              }
            >
              CSV cân nặng
            </button>
          </div>
        </div>

        <input
          ref={nhapFileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) datXacNhanNhap({ file: f, cheDo: 'tron' })
            e.target.value = ''
          }}
        />

        <div className="the mt-3 space-y-2.5">
          <div className="text-sm font-medium">Khôi phục từ file</div>
          <button className="nut-phu w-full" onClick={() => nhapFileRef.current?.click()}>
            ⬆️ Chọn file sao lưu
          </button>
          <p className="text-xs text-slate-500">
            Bạn sẽ được chọn giữa <strong>trộn</strong> (giữ dữ liệu đang có, chỉ thêm phần thiếu)
            và <strong>thay thế</strong> (xóa hết rồi nạp file vào).
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-slate-400 mb-2">Khác</h2>
        <div className="the">
          <button
            onClick={() => datXacNhanXoa(true)}
            className="w-full text-left text-sm text-rose-400"
          >
            Xóa toàn bộ dữ liệu
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-4 text-center">
          Sức Khỏe App · phiên bản {__PHIEN_BAN_APP__}
        </p>
      </section>

      <BangTruot mo={moHoSo} dong={() => datMoHoSo(false)} tieuDe="Thông tin cá nhân">
        <div className="space-y-5">
          <div>
            <label className="nhan">Tên gọi</label>
            <input className="o-nhap" value={ten} onChange={(e) => datTen(e.target.value)} />
          </div>
          <div>
            <label className="nhan">Chiều cao</label>
            <NhapSo
              giaTri={chieuCao} doiGiaTri={datChieuCao}
              buoc={1} toiThieu={100} toiDa={250} donVi="cm"
            />
          </div>
          <div>
            <label className="nhan">Mức vận động</label>
            <div className="space-y-2">
              {(Object.keys(NHAN_MUC_VAN_DONG) as MucVanDong[]).map((ma) => (
                <button
                  key={ma}
                  onClick={() => datMucVanDong(ma)}
                  className={`w-full text-left rounded-xl border p-3 text-sm transition ${
                    mucVanDong === ma
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-800 bg-slate-900'
                  }`}
                >
                  {NHAN_MUC_VAN_DONG[ma]}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={congCaloTap}
              onChange={(e) => datCongCaloTap(e.target.checked)}
              className="h-5 w-5 rounded accent-emerald-500 mt-0.5"
            />
            <span>
              Cộng calo đốt do tập luyện vào hạn mức ăn
              <span className="block text-xs text-slate-500 mt-0.5">
                Nên để tắt — calo đốt rất dễ bị ước lượng thừa, dẫn tới ăn nhiều hơn mức thật sự cần.
              </span>
            </span>
          </label>
          <button className="nut-chinh w-full" onClick={luuHoSo}>Lưu</button>
        </div>
      </BangTruot>

      <BangTruot mo={moMucTieu} dong={() => datMoMucTieu(false)} tieuDe="Mục tiêu dinh dưỡng">
        <div className="space-y-5">
          <div>
            <label className="nhan">Mục tiêu</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(NHAN_MUC_TIEU) as MucTieu[]).map((ma) => (
                <button
                  key={ma}
                  onClick={() => datMucTieu(ma)}
                  className={mucTieu === ma ? 'chip-bat' : 'chip-tat'}
                >
                  {NHAN_MUC_TIEU[ma]}
                </button>
              ))}
            </div>
          </div>

          {mucTieu !== 'giu_can' && (
            <>
              <div>
                <label className="nhan">Cân nặng mục tiêu</label>
                <NhapSo
                  giaTri={canNangMucTieu} doiGiaTri={datCanNangMucTieu}
                  buoc={0.5} toiThieu={25} toiDa={300} donVi="kg" thapPhan={1}
                />
              </div>
              <div>
                <label className="nhan">Tốc độ mỗi tuần</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0.25, 0.5, 0.75, 1].map((t) => (
                    <button
                      key={t}
                      onClick={() => datTocDo(t)}
                      className={tocDo === t ? 'chip-bat' : 'chip-tat'}
                    >
                      {t} kg
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="nhan mb-0">Calo mỗi ngày</label>
              <button onClick={tinhLaiCalo} className="text-xs text-emerald-400">
                Tính lại theo công thức
              </button>
            </div>
            <NhapSo
              giaTri={caloTuChinh} doiGiaTri={datCaloTuChinh}
              buoc={50} toiThieu={800} toiDa={6000} donVi="kcal"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              TDEE ước tính của bạn là {mucTieuHienTai.tdee} kcal/ngày.
            </p>
          </div>

          <div className="the grid grid-cols-3 gap-2 text-center">
            {[
              ['Đạm', macroXemTruoc.dam, 'text-blue-400'],
              ['Tinh bột', macroXemTruoc.tinhbot, 'text-amber-400'],
              ['Béo', macroXemTruoc.beo, 'text-purple-400'],
            ].map(([nhan, gt, mau]) => (
              <div key={nhan as string}>
                <div className={`font-bold ${mau}`}>{gt as number}g</div>
                <div className="text-xs text-slate-500">{nhan as string}</div>
              </div>
            ))}
          </div>

          <button className="nut-chinh w-full" onClick={luuMucTieu}>Lưu</button>
        </div>
      </BangTruot>

      <BangTruot mo={moApi} dong={() => datMoApi(false)} tieuDe="Nhận diện ảnh bằng AI">
        <div className="space-y-5">
          <div className="rounded-xl bg-slate-800/50 border border-slate-800 p-4 text-sm text-slate-300 leading-relaxed">
            <p className="font-medium mb-2">API key là gì?</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Đó là một chuỗi ký tự bạn lấy từ trang console.anthropic.com sau khi tạo tài khoản
              và nạp tiền. Khi bạn chụp ảnh món ăn, app gửi ảnh kèm chuỗi này lên máy chủ AI để
              nó đọc ảnh và trả về ước lượng calo. Chi phí tính theo lượt dùng, mỗi lần chụp
              khoảng vài chục tới vài trăm đồng tùy model.
            </p>
            <p className="text-slate-400 text-xs mt-2.5 leading-relaxed">
              Key được lưu trên máy bạn và chỉ gửi tới máy chủ của Anthropic. Không có key thì
              mọi chức năng khác của app vẫn chạy bình thường, chỉ là bạn nhập món ăn bằng tay.
            </p>
          </div>

          <div>
            <label className="nhan">API key</label>
            <input
              className="o-nhap font-mono text-sm"
              type="password"
              placeholder="sk-ant-..."
              value={keyTam}
              onChange={(e) => datKeyTam(e.target.value)}
            />
          </div>

          <div>
            <label className="nhan">Model</label>
            <div className="space-y-2">
              {MODEL.map((m) => (
                <button
                  key={m.ma}
                  onClick={() => datModel(m.ma)}
                  className={`w-full text-left rounded-xl border p-3 transition ${
                    model === m.ma
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-800 bg-slate-900'
                  }`}
                >
                  <div className="text-sm font-medium">{m.nhan}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{m.moTa}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            {apiKey && (
              <button
                className="nut-vien flex-1"
                onClick={async () => {
                  await datApiKey('')
                  datKeyTam('')
                  hien('Đã xóa key khỏi máy')
                }}
              >
                Xóa key
              </button>
            )}
            <button
              className="nut-chinh flex-1"
              onClick={async () => {
                await datApiKey(keyTam.trim())
                datMoApi(false)
                hien(keyTam.trim() ? 'Đã lưu key' : 'Đã xóa key')
              }}
            >
              Lưu
            </button>
          </div>
        </div>
      </BangTruot>

      <BangTruot
        mo={!!xacNhanNhap}
        dong={() => datXacNhanNhap(null)}
        tieuDe="Nhập dữ liệu"
      >
        {xacNhanNhap && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              File: <span className="text-slate-200">{xacNhanNhap.file.name}</span>
            </p>
            <button
              onClick={() => datXacNhanNhap({ ...xacNhanNhap, cheDo: 'tron' })}
              className={`w-full text-left rounded-xl border p-4 transition ${
                xacNhanNhap.cheDo === 'tron'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="font-medium text-sm">Trộn vào dữ liệu hiện có</div>
              <div className="text-xs text-slate-500 mt-1">
                Giữ nguyên mọi thứ đang có, chỉ thêm những gì máy này chưa có. An toàn hơn.
              </div>
            </button>
            <button
              onClick={() => datXacNhanNhap({ ...xacNhanNhap, cheDo: 'thay_the' })}
              className={`w-full text-left rounded-xl border p-4 transition ${
                xacNhanNhap.cheDo === 'thay_the'
                  ? 'border-rose-500 bg-rose-500/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="font-medium text-sm">Thay thế toàn bộ</div>
              <div className="text-xs text-slate-500 mt-1">
                Xóa sạch dữ liệu đang có rồi nạp file vào. Dùng khi khôi phục sau khi mất máy.
                Ảnh chỉ khôi phục được ở chế độ này.
              </div>
            </button>
            <button className="nut-chinh w-full" onClick={thucHienNhap}>
              {xacNhanNhap.cheDo === 'thay_the' ? 'Thay thế toàn bộ' : 'Trộn dữ liệu'}
            </button>
          </div>
        )}
      </BangTruot>

      <HopThoaiXacNhan
        mo={xacNhanXoa}
        tieuDe="Xóa toàn bộ dữ liệu?"
        noiDung={
          'Mọi bữa ăn, cân nặng, buổi tập và ảnh sẽ bị xóa vĩnh viễn khỏi máy này. Không khôi phục được.\n\nNếu chưa xuất file sao lưu, hãy hủy và xuất trước.'
        }
        nhanDongY="Xóa hết"
        nguyHiem
        huy={() => datXacNhanXoa(false)}
        dongY={async () => {
          for (const bang of db.tables) await bang.clear()
          datXacNhanXoa(false)
          dieuHuong('/bat-dau', { replace: true })
        }}
      />

      {thongBao && <ThongBao noiDung={thongBao.noiDung} loai={thongBao.loai} />}
    </div>
  )
}
