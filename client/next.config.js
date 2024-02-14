/** @type {import('next').NextConfig} */

const path_config = process.env.NODE_ENV === 'production' ? {
	basePath: '/monopole',
} : {}

const nextConfig = {
	reactStrictMode: false,
	typescript: {
		ignoreBuildErrors: true,
	},
	...path_config
}

module.exports = nextConfig
