// Cấu hình test để riêng, không gộp vào vite.config.ts.
// Vitest đi kèm bản Vite riêng của nó, nên khai báo `test` trong vite.config.ts
// khiến TypeScript thấy hai bộ kiểu Vite khác nhau và báo lỗi khi chạy `tsc -b`.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test-setup.ts'],
  },
})
