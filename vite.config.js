import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import Icons from 'unplugin-icons/vite'
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	return {
		plugins: [
			sveltekit(),
			tailwindcss(),
			Icons({
				compiler: 'svelte',
			})
		],
		server: {
			fs: {
				allow: ['.']
			}
		},
		define: {
			'process.env.SENDGRID_API_KEY': JSON.stringify(env.SENDGRID_API_KEY)
		}
	};
});
