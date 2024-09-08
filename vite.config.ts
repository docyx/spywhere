import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
	plugins: [vue()],
	base: mode === 'production' ? '/spywhere/' : '/',
	server: {
		host: '0.0.0.0',
	},
}))
